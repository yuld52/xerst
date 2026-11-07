import enum

from sqlalchemy import Boolean, Column, DateTime, Enum, Float, ForeignKey, Integer, String

from database.core.connection import Base
from database.core.timezone import CREATED_AT_DEFAULT, UPDATED_AT_DEFAULT


class RecoveryType(str, enum.Enum):
    ABANDONED_CART = "abandoned_cart"
    DECLINED_CARD = "declined_card"
    UNPAID_PIX = "unpaid_pix"
    TRIAL = "trial"


class RecoveryChannel(str, enum.Enum):
    WHATSAPP = "whatsapp"
    EMAIL = "email"
    SMS = "sms"
    BACK_REDIRECT = "back_redirect"
    OTHER = "other"


class Recovery(Base):
    __tablename__ = "recoveries"

    id = Column(Integer, primary_key=True, autoincrement=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=True)
    customer_name = Column(String(255), nullable=True)
    customer_email = Column(String(255), nullable=True)
    product_name = Column(String(255), nullable=True)
    type = Column(Enum(RecoveryType, name="recoverytype"), nullable=False)
    amount = Column(Float, nullable=False)
    recovered = Column(Boolean, default=False, nullable=True)
    channel = Column(Enum(RecoveryChannel, name="recoverychannel"), nullable=True)
    src = Column(String(255), nullable=True)
    webhook_slug = Column(String(50), nullable=True)
    recovered_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=CREATED_AT_DEFAULT)
    updated_at = Column(
        DateTime(timezone=True),
        server_default=UPDATED_AT_DEFAULT,
        onupdate=UPDATED_AT_DEFAULT,
    )
