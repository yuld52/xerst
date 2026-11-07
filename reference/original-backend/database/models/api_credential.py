import hashlib
import secrets
from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey
from database.core.connection import Base
from database.core.timezone import CREATED_AT_DEFAULT


class ApiCredential(Base):
    __tablename__ = "api_credentials"

    id = Column(Integer, primary_key=True, autoincrement=True)
    company_id = Column(Integer, nullable=False, index=True)
    name = Column(String(255), nullable=False)
    token_hash = Column(String(64), unique=True, nullable=False, index=True)
    token_prefix = Column(String(16), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, server_default=CREATED_AT_DEFAULT)
    last_used_at = Column(DateTime, nullable=True)

    @staticmethod
    def hash_token(token: str) -> str:
        return hashlib.sha256(token.encode("utf-8")).hexdigest()

    @staticmethod
    def generate_token() -> str:
        return f"lt_{secrets.token_urlsafe(32)}"
