import base64
import hashlib
import hmac
import secrets
import struct
import time


def generate_secret() -> str:
    return base64.b32encode(secrets.token_bytes(20)).decode("ascii").rstrip("=")


def verify_code(secret: str, code: str, window: int = 1) -> bool:
    if not secret or not code or not code.isdigit() or len(code) != 6:
        return False
    padded = secret + "=" * ((8 - len(secret) % 8) % 8)
    key = base64.b32decode(padded, casefold=True)
    counter = int(time.time() // 30)
    for offset in range(-window, window + 1):
        digest = hmac.new(key, struct.pack(">Q", counter + offset), hashlib.sha1).digest()
        index = digest[-1] & 0x0F
        number = (struct.unpack(">I", digest[index:index + 4])[0] & 0x7FFFFFFF) % 1_000_000
        if f"{number:06d}" == code:
            return True
    return False
