from sqlalchemy import Column, Integer, String, DateTime, JSON, ForeignKey
from database.core.connection import Base
from database.core.timezone import CREATED_AT_DEFAULT


class WebhookDelivery(Base):
    __tablename__ = "webhook_deliveries"

    id = Column(Integer, primary_key=True, autoincrement=True)
    endpoint_id = Column(Integer, ForeignKey("webhook_endpoints.id", ondelete="SET NULL"), nullable=True, index=True)
    company_id = Column(Integer, nullable=True, index=True)
    platform = Column(String(40), nullable=False, index=True)
    slug = Column(String(50), nullable=False, index=True)
    status = Column(String(30), nullable=False, index=True)
    http_status = Column(Integer, nullable=True)
    error_message = Column(String(1000), nullable=True)
    payload = Column(JSON, nullable=True)
    transaction_id = Column(Integer, nullable=True)
    attempts = Column(Integer, default=1, nullable=False)
    received_at = Column(DateTime, server_default=CREATED_AT_DEFAULT, index=True)
    processed_at = Column(DateTime, nullable=True)
