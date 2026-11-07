from sqlalchemy import Column, Integer, DateTime
from sqlalchemy.dialects.postgresql import JSONB

from database.core.connection import Base
from database.core.timezone import UPDATED_AT_DEFAULT


class GlobalAppSettings(Base):
    __tablename__ = "global_app_settings"

    id = Column(Integer, primary_key=True, default=1)
    settings = Column(
        JSONB,
        nullable=False,
        default=dict,
        server_default='{"allowSignups":true,"maintenanceMode":false,"pushNotifications":true}',
    )
    updated_at = Column(DateTime, server_default=UPDATED_AT_DEFAULT, onupdate=UPDATED_AT_DEFAULT)
