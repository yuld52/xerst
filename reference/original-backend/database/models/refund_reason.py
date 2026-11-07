from sqlalchemy import Column, DateTime, ForeignKey, Integer, Text

from database.core.connection import Base
from database.core.timezone import CREATED_AT_DEFAULT


class RefundReason(Base):
    __tablename__ = "refund_reasons"

    id = Column(Integer, primary_key=True, autoincrement=True)
    transaction_id = Column(
        Integer,
        ForeignKey("transactions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    reason = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=CREATED_AT_DEFAULT)
