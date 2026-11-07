from sqlalchemy import Column, DateTime, Integer, JSON, String, Text

from database.core.connection import Base
from database.core.timezone import CREATED_AT_DEFAULT


class NotificationRetry(Base):
    __tablename__ = "notification_retries"

    id = Column(Integer, primary_key=True, autoincrement=True)
    company_id = Column(Integer, nullable=False, index=True)
    title = Column(String(255), nullable=False)
    body = Column(Text, nullable=False)
    data = Column(JSON, nullable=True)
    delivered_subscription_ids = Column(JSON, nullable=False, default=list)
    attempts = Column(Integer, nullable=False, default=0)
    max_attempts = Column(Integer, nullable=False, default=5)
    status = Column(String(30), nullable=False, default="pending", index=True)
    next_attempt_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, server_default=CREATED_AT_DEFAULT, nullable=False)
