import hashlib
import hmac
import base64
import json
import os
import time
from typing import Optional
from app.core.config import settings


def hash_password(password: str) -> str:
    salt = os.urandom(16)
    hash_val = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, 260000)
    return base64.b64encode(salt + hash_val).decode()


def verify_password(plain_password: str, stored_hash: str) -> bool:
    try:
        decoded = base64.b64decode(stored_hash)
        salt = decoded[:16]
        stored = decoded[16:]
        hash_val = hashlib.pbkdf2_hmac("sha256", plain_password.encode(), salt, 260000)
        return hmac.compare_digest(hash_val, stored)
    except Exception:
        return False


def _b64_encode(data: bytes) -> bytes:
    return base64.urlsafe_b64encode(data).rstrip(b"=")


def _b64_decode(data: str) -> bytes:
    padding = 4 - len(data) % 4
    if padding != 4:
        data += "=" * padding
    return base64.urlsafe_b64decode(data)


def create_access_token(data: dict) -> str:
    header = _b64_encode(json.dumps({"alg": "HS256", "typ": "JWT"}).encode())
    expire = int(time.time()) + settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    payload = {**data, "exp": expire, "iat": int(time.time())}
    payload_b = _b64_encode(json.dumps(payload).encode())
    sig_input = header + b"." + payload_b
    sig = hmac.new(settings.SECRET_KEY.encode(), sig_input, hashlib.sha256).digest()
    sig_b = _b64_encode(sig)
    return (sig_input + b"." + sig_b).decode()


def verify_token(token: str) -> Optional[dict]:
    try:
        parts = token.split(".")
        if len(parts) != 3:
            return None
        header_b, payload_b, sig_b = parts
        sig_input = f"{header_b}.{payload_b}".encode()
        expected_sig = hmac.new(settings.SECRET_KEY.encode(), sig_input, hashlib.sha256).digest()
        actual_sig = _b64_decode(sig_b)
        if not hmac.compare_digest(expected_sig, actual_sig):
            return None
        payload = json.loads(_b64_decode(payload_b))
        if payload.get("exp", 0) < int(time.time()):
            return None
        return payload
    except Exception:
        return None
