from sqlalchemy import Column, Integer, String, DateTime, JSON
from database.core.connection import Base
from database.core.timezone import CREATED_AT_DEFAULT


class NotificationDelivery(Base):
    __tablename__ = "notification_deliveries"

    id = Column(Integer, primary_key=True, autoincrement=True)
    company_id = Column(Integer, nullable=False, index=True)
    title = Column(String(255), nullable=False)
    body = Column(String(2000), nullable=False)
    status = Column(String(30), nullable=False, index=True)
    sent_count = Column(Integer, default=0, nullable=False)
    failed_count = Column(Integer, default=0, nullable=False)
    data = Column(JSON, nullable=True)
    created_at = Column(DateTime, server_default=CREATED_AT_DEFAULT, index=True)
