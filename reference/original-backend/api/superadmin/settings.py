from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from api.auth.deps import get_db
from api.superadmin.companies import require_superadmin
from database.models.admin import Admin
from database.models.audit_log import AuditLog
from database.models.global_app_settings import GlobalAppSettings

router = APIRouter(prefix="/superadmin/settings", tags=["superadmin"])

DEFAULT_SETTINGS = {
    "allowSignups": True,
    "maintenanceMode": False,
    "pushNotifications": True,
}


class GlobalSettingsPayload(BaseModel):
    allowSignups: bool
    maintenanceMode: bool
    pushNotifications: bool


def _get_or_create_settings(db: Session) -> GlobalAppSettings:
    row = db.query(GlobalAppSettings).filter(GlobalAppSettings.id == 1).first()
    if row is None:
        row = GlobalAppSettings(id=1, settings=DEFAULT_SETTINGS.copy())
        db.add(row)
        db.commit()
        db.refresh(row)
    return row


@router.get("")
def get_global_settings(
    db: Session = Depends(get_db),
    _: Admin = Depends(require_superadmin),
):
    row = _get_or_create_settings(db)
    return {**DEFAULT_SETTINGS, **(row.settings or {})}


@router.put("")
def update_global_settings(
    payload: GlobalSettingsPayload,
    db: Session = Depends(get_db),
    actor: Admin = Depends(require_superadmin),
):
    row = _get_or_create_settings(db)
    row.settings = payload.model_dump()
    db.add(AuditLog(
        actor_id=actor.id,
        action="global_settings.update",
        resource_type="global_app_settings",
        resource_id="1",
        details=payload.model_dump(),
    ))
    db.commit()
    db.refresh(row)
    return {**DEFAULT_SETTINGS, **(row.settings or {})}
