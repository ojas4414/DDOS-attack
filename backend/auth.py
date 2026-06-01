import jwt
import os
from datetime import datetime,timedelta
from fastapi import HTTPException, Security, Request
from fastapi.security import HTTPBearer,HTTPAuthorizationCredentials
from fastapi import APIRouter
from pydantic import BaseModel
from collections import defaultdict
import time

SECRET_KEY=os.environ.get("JWT_SECRET", "sentinel_dev_secret")
ALGORITHM="HS256"
EXPIRY_HRS=24

security =HTTPBearer()
router=APIRouter()
ADMIN_USER = os.environ.get("ADMIN_USER", "admin")
ADMIN_PASS = os.environ.get("ADMIN_PASS", "sentinel123")

def create_token(username: str)-> str:
    payload ={
        "user": username,
        "exp":  datetime.utcnow() + timedelta(hours=EXPIRY_HRS),
        "iat":  datetime.utcnow()
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

def verify_token(credentials: HTTPAuthorizationCredentials = Security(security)) -> str:
    try:
        payload = jwt.decode(
            credentials.credentials,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )
        return payload["user"]
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="invalid token")


def decode_token(token: str):
    """Validate a raw JWT string (used for the WebSocket handshake, where we
    can't use the HTTPBearer dependency). Returns the username on success, or
    None if the token is missing / invalid / expired."""
    if not token:
        return None
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload["user"]
    except jwt.InvalidTokenError:
        return None

class LoginRequest(BaseModel):
    username: str
    password: str

@router.post("/login")
def login(request: LoginRequest, http_request: Request):
    # Key the rate limiter on the real client IP (X-Forwarded-For when behind a
    # proxy, otherwise the socket peer) instead of a hardcoded constant.
    xff = http_request.headers.get("x-forwarded-for", "")
    client_ip = (
        xff.split(",")[0].strip()
        if xff
        else (http_request.client.host if http_request.client else "unknown")
    )
    if not rate_limiter.allow(client_ip):
        raise HTTPException(status_code=429, detail="too many attempts")

    if request.username != ADMIN_USER or request.password != ADMIN_PASS:
        raise HTTPException(status_code=401, detail="invalid credentials")

    token = create_token(request.username)
    return {"access_token": token}

@router.get("/protected")
def protected(user: str = Security(verify_token)):
    return {"message": f"welcome {user}"}


class TokenBucket:
    def __init__(self, capacity: int = 5, refill_rate: float = 1/12):
        self.capacity    = capacity
        self.refill_rate = refill_rate
        self.buckets     = defaultdict(lambda: {
            "tokens": capacity,
            "last":   time.time()
        })

    def allow(self, ip: str) -> bool:
        bucket = self.buckets[ip]
        now    = time.time()

        elapsed = now - bucket["last"]
        bucket["tokens"] = min(
            self.capacity,
            bucket["tokens"] + elapsed * self.refill_rate
        )
        bucket["last"] = now

        if bucket["tokens"] >= 1:
            bucket["tokens"] -= 1
            return True
        return False

rate_limiter = TokenBucket()
