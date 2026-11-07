from sqlalchemy import Column, Integer, String, DateTime, JSON, ForeignKey
from database.core.connection import Base
from database.core.timezone import CREATED_AT_DEFAULT


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    company_id = Column(Integer, nullable=True, index=True)
    actor_id = Column(Integer, ForeignKey("admins.id", ondelete="SET NULL"), nullable=True)
    action = Column(String(120), nullable=False, index=True)
    resource_type = Column(String(80), nullable=False, index=True)
    resource_id = Column(String(120), nullable=True)
    details = Column(JSON, nullable=True)
    created_at = Column(DateTime, server_default=CREATED_AT_DEFAULT, index=True)
