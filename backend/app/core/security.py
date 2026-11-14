import hashlib
import secrets
from datetime import UTC, datetime, timedelta

import jwt
from pwdlib import PasswordHash

from app.core.config import settings

# recommended() gives Argon2id with safe default parameters
_password_hash = PasswordHash.recommended()


def hash_password(password: str) -> str:
    return _password_hash.hash(password)


def verify_password(password: str, hashed: str) -> bool:
    return _password_hash.verify(password, hashed)

def create_access_token(subject: str) -> str:
    expire = datetime.now(UTC) + timedelta(
        minutes=settings.access_token_expire_minutes
    )
    payload = {"sub": subject, "exp": expire}
    return jwt.encode(payload, settings.secret_key, algorithm=settings.jwt_algorithm)


def decode_access_token(token: str) -> dict:
    # raises jwt.InvalidTokenError (or a subclass such as ExpiredSignatureError)
    return jwt.decode(
        token, settings.secret_key, algorithms=[settings.jwt_algorithm]
    )

def hash_sensor_key(key: str) -> str:
    # SHA-256 is fine here: the key is long and random, so it can't be
    # guessed the way a short human password can. A fast hash also lets
    # /ingest look the key up directly in the database.
    return hashlib.sha256(key.encode()).hexdigest()


def generate_sensor_key() -> tuple[str, str, str]:
    """Return (plain_key, key_hash, key_prefix). Show plain_key once, store the rest."""
    plain_key = "nids_" + secrets.token_urlsafe(32)
    return plain_key, hash_sensor_key(plain_key), plain_key[:12]