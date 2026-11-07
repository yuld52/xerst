from sqlalchemy import Column, Date, DateTime, Integer, JSON, String, Boolean

from database.core.connection import Base
from database.core.timezone import CREATED_AT_DEFAULT


class CampaignRule(Base):
    __tablename__ = "campaign_rules"

    id = Column(Integer, primary_key=True, autoincrement=True)
    rule_id = Column(String(80), nullable=False, index=True)
    company_id = Column(Integer, nullable=False, index=True)
    definition = Column(JSON, nullable=False)
    enabled = Column(Boolean, nullable=False, default=True, server_default="true")
    last_checked_at = Column(DateTime, nullable=True)
    executions_today = Column(Integer, nullable=False, default=0, server_default="0")
    execution_date = Column(Date, nullable=True)
    created_at = Column(DateTime, server_default=CREATED_AT_DEFAULT)
