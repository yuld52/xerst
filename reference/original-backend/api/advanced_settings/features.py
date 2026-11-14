from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel, ConfigDict
from database.core.connection import get_db
from database.models.company import CompanySettings
from api.auth.deps import get_current_user, get_company_id, require_role

router = APIRouter(prefix="/advanced-settings", tags=["advanced-settings"])


class FeaturesResponse(BaseModel):
    stripe_enabled: bool

    model_config = ConfigDict(from_attributes=True)


class FeaturesUpdate(BaseModel):
    stripe_enabled: bool


def _get_or_create_settings(db: Session, company_id: int) -> CompanySettings:
    settings = db.query(CompanySettings).filter(CompanySettings.company_id == company_id).first()
    if not settings:
        settings = CompanySettings(company_id=company_id)
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return settings


@router.get("/features", response_model=FeaturesResponse)
def get_features(
    db: Session = Depends(get_db),
    company_id: int = Depends(get_company_id),
):
    settings = _get_or_create_settings(db, company_id)
    return FeaturesResponse(stripe_enabled=settings.stripe_enabled or False)


@router.put("/features", response_model=FeaturesResponse)
def update_features(
    payload: FeaturesUpdate,
    db: Session = Depends(get_db),
    company_id: int = Depends(get_company_id),
    user=Depends(require_role("owner")),
):
    settings = _get_or_create_settings(db, company_id)
    settings.stripe_enabled = payload.stripe_enabled
    db.commit()
    db.refresh(settings)
    return FeaturesResponse(stripe_enabled=settings.stripe_enabled)
