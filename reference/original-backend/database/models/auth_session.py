from sqlalchemy import Column, DateTime, ForeignKey, Integer, String

from database.core.connection import Base
from database.core.timezone import CREATED_AT_DEFAULT


class AuthSession(Base):
    __tablename__ = "auth_sessions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    session_id = Column(String(64), unique=True, nullable=False, index=True)
    admin_id = Column(Integer, ForeignKey("admins.id", ondelete="CASCADE"), nullable=False, index=True)
    company_id = Column(Integer, nullable=True, index=True)
    user_agent = Column(String(500), nullable=True)
    ip_address = Column(String(80), nullable=True)
    created_at = Column(DateTime, server_default=CREATED_AT_DEFAULT, nullable=False)
    last_seen_at = Column(DateTime, server_default=CREATED_AT_DEFAULT, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    revoked_at = Column(DateTime, nullable=True)
