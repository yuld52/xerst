from sqlalchemy import BigInteger, Column, DateTime, String

from database.core.connection import Base


class AutomationLock(Base):
    __tablename__ = "automation_locks"

    lock_key = Column(BigInteger, primary_key=True)
    lock_token = Column(String(32), nullable=False, unique=True)
    locked_until = Column(DateTime, nullable=False)
