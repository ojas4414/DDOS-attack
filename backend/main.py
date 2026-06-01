from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Security
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
import asyncio
import os

from backend.ml_engine import train, predict, SEQ_LEN
from backend.shared import feat_extractor
from backend.simulator import run_simulator
from backend.decision_engine import decide
from backend.database import init_db, ban_and_log, get_active_bans, unban_ip
from backend.auth import router as auth_router, verify_token, decode_token

ml_model: object | None = None
snapshot_buffer: list = []

# One queue per connected dashboard — the per-connection sender task owns all
# writes to its socket, so the detection loop never touches a socket directly.
_queues: list[asyncio.Queue] = []


@asynccontextmanager
async def lifespan(_: FastAPI):
    global ml_model
    init_db()
    ml_model = train()
    asyncio.create_task(detection_loop())
    asyncio.create_task(run_simulator())
    yield


app = FastAPI(title="SentinelAPI", version="1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/auth")


async def broadcast(payload: dict) -> None:
    for q in list(_queues):
        await q.put(payload)


async def detection_loop():
    while True:
        await asyncio.sleep(10)

        if ml_model is None:
            continue

        features = feat_extractor.features()
        if not features:
            continue

        snapshot_buffer.append([
            features["requests_per_sec"],
            features["unique_ips"],
            features["top_k_avg"],
            features["avg_payload"],
            features["endpoint_entropy"],
            features["event_count"],
        ])

        if len(snapshot_buffer) > SEQ_LEN:
            snapshot_buffer.pop(0)

        # Broadcast current stats even before the ML window is full, so the
        # traffic chart starts moving immediately.
        if len(snapshot_buffer) < SEQ_LEN:
            print(f"[DETECTION] rps={features['requests_per_sec']:.1f}  buf={len(snapshot_buffer)}/{SEQ_LEN}")
            await broadcast({
                "rps":          features["requests_per_sec"],
                "threat_level": "normal",
                "is_attack":    False,
                **features,
            })
            continue

        prediction = predict(ml_model, snapshot_buffer)

        top_ips = sorted(
            feat_extractor.ip_counts.items(),
            key=lambda x: x[1],
            reverse=True,
        )[:10]
        top_ips = [(count, ip) for ip, count in top_ips]

        decision = decide(prediction, features, top_ips)

        threat = "normal"
        if decision["is_attack"]:
            threat = "critical"
        elif features["requests_per_sec"] > 50:
            threat = "elevated"

        print(f"[DETECTION] rps={features['requests_per_sec']:.1f}  label={prediction['label']}  confidence={prediction['confidence']:.2f}  threat={threat}")

        msg = {
            "rps":          features["requests_per_sec"],
            "threat_level": threat,
            **features,
            **decision,
        }
        await broadcast(msg)

        if decision["is_attack"]:
            for ip in decision["ban_ips"]:
                ban_and_log(
                    ip=ip,
                    confidence=decision["confidence"],
                    rate_limit=decision["rate_limit"],
                    requests_per_sec=features["requests_per_sec"],
                    unique_ips=features["unique_ips"],
                    banned_ip_count=len(decision["ban_ips"]),
                )


@app.websocket("/ws/dashboard")
async def dashboard_ws(websocket: WebSocket):
    await websocket.accept()

    # The first frame must be the JWT. Reject the connection if it's missing
    # or invalid — this is the auth the README claims the WS feed has.
    try:
        token = await websocket.receive_text()
    except WebSocketDisconnect:
        return
    if decode_token(token) is None:
        await websocket.close(code=1008)  # 1008 = policy violation
        return

    q: asyncio.Queue = asyncio.Queue()
    _queues.append(q)

    async def sender():
        try:
            while True:
                msg = await q.get()
                await websocket.send_json(msg)
        except Exception:
            pass

    send_task = asyncio.create_task(sender())

    try:
        while True:
            await websocket.receive_text()  # keepalive; further frames ignored
    except WebSocketDisconnect:
        pass
    finally:
        send_task.cancel()
        if q in _queues:
            _queues.remove(q)


@app.get("/bans")
def get_bans(user: str = Security(verify_token)):
    return {"bans": get_active_bans()}


@app.delete("/bans/{ip}")
def remove_ban(ip: str, user: str = Security(verify_token)):
    unban_ip(ip)
    return {"status": "unbanned", "ip": ip}


@app.get("/health")
def health():
    return {
        "status": "alive",
        "model_ready": ml_model is not None,
    }


# ── Serve the dashboard UI ───────────────────────────────────────────────────
# Mounted LAST so every API route + the WebSocket above take precedence; this
# catch-all only handles paths the API didn't claim.
_UI_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "security")
if os.path.isdir(_UI_DIR):
    app.mount("/", StaticFiles(directory=_UI_DIR, html=True), name="ui")
