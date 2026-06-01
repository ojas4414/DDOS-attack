import asyncio
import random
import time

from backend.shared import feat_extractor

NORMAL_ENDPOINTS = ["/api/users", "/api/products", "/api/orders", "/api/health", "/api/search"]
ATTACK_ENDPOINT  = "/api/login"


def _rand_ip() -> str:
    return f"10.{random.randint(0, 255)}.{random.randint(0, 255)}.{random.randint(1, 254)}"


async def run_simulator() -> None:
    print("[SIMULATOR] started")
    while True:
        # ── Normal phase ──────────────────────────────────────────────────────
        normal_secs = random.uniform(30, 60)
        print(f"[SIMULATOR] NORMAL phase ({normal_secs:.0f}s)")
        deadline = time.monotonic() + normal_secs

        # 50-100 unique IPs active this window
        ip_pool = [_rand_ip() for _ in range(random.randint(50, 100))]

        while time.monotonic() < deadline:
            # 5-20 req/s → 0.25-1.0 per 50ms batch → send 1-3 per tick
            for _ in range(random.randint(1, 3)):
                feat_extractor.add_event(
                    ip=random.choice(ip_pool),
                    payload=random.randint(64, 2048),
                    endpoint=random.choice(NORMAL_ENDPOINTS),
                )
            await asyncio.sleep(0.05)

        # ── Attack phase ──────────────────────────────────────────────────────
        attack_secs = random.uniform(15, 30)
        print(f"[SIMULATOR] ATTACK phase ({attack_secs:.0f}s)")
        deadline = time.monotonic() + attack_secs

        # 2-3 fixed IPs hammering one endpoint
        attack_ips = [f"192.168.1.{random.randint(10, 50)}" for _ in range(random.randint(2, 3))]

        while time.monotonic() < deadline:
            # 200-500 req/s → 10-25 per 50ms batch
            for _ in range(random.randint(10, 25)):
                feat_extractor.add_event(
                    ip=random.choice(attack_ips),
                    payload=512,
                    endpoint=ATTACK_ENDPOINT,
                )
            await asyncio.sleep(0.05)
