from sqlalchemy import Column, DateTime, ForeignKey, Integer, String

from database.core.connection import Base
from database.core.timezone import CREATED_AT_DEFAULT


class SubscriptionPlanRequest(Base):
    __tablename__ = "subscription_plan_requests"

    id = Column(Integer, primary_key=True, autoincrement=True)
    company_id = Column(Integer, nullable=False, index=True)
    requested_by_admin_id = Column(Integer, ForeignKey("admins.id"), nullable=False)
    requested_plan = Column(String(20), nullable=False)
    status = Column(String(20), nullable=False, default="pending", server_default="pending")
    created_at = Column(DateTime, server_default=CREATED_AT_DEFAULT, nullable=False)
    reviewed_at = Column(DateTime, nullable=True)
    reviewed_by_admin_id = Column(Integer, ForeignKey("admins.id"), nullable=True)
