import secrets
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel, ConfigDict
from database.core.connection import get_db
from database.models.company import CompanySettings
from api.auth.deps import get_company_id, require_role

router = APIRouter(prefix="/advanced-settings", tags=["mcp"])


class McpResponse(BaseModel):
    enabled: bool
    api_key: str | None

    model_config = ConfigDict(from_attributes=True)


class McpToggle(BaseModel):
    enabled: bool


def _get_or_create_settings(db: Session, company_id: int) -> CompanySettings:
    settings = db.query(CompanySettings).filter(CompanySettings.company_id == company_id).first()
    if not settings:
        settings = CompanySettings(company_id=company_id)
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return settings


def _new_mcp_key() -> str:
    return "mcp_live_" + secrets.token_hex(20)


@router.get("/mcp", response_model=McpResponse)
def get_mcp(
    db: Session = Depends(get_db),
    company_id: int = Depends(get_company_id),
):
    settings = _get_or_create_settings(db, company_id)
    return McpResponse(enabled=settings.mcp_enabled or False, api_key=settings.mcp_api_key)


@router.put("/mcp", response_model=McpResponse)
def toggle_mcp(
    payload: McpToggle,
    db: Session = Depends(get_db),
    company_id: int = Depends(get_company_id),
    user=Depends(require_role("owner")),
):
    settings = _get_or_create_settings(db, company_id)
    settings.mcp_enabled = payload.enabled
    if payload.enabled and settings.mcp_api_key is None:
        settings.mcp_api_key = _new_mcp_key()
    db.commit()
    db.refresh(settings)
    return McpResponse(enabled=settings.mcp_enabled, api_key=settings.mcp_api_key)


@router.post("/mcp/regenerate", response_model=McpResponse)
def regenerate_mcp_key(
    db: Session = Depends(get_db),
    company_id: int = Depends(get_company_id),
    user=Depends(require_role("owner")),
):
    settings = _get_or_create_settings(db, company_id)
    settings.mcp_api_key = _new_mcp_key()
    settings.mcp_enabled = True
    db.commit()
    db.refresh(settings)
    return McpResponse(enabled=settings.mcp_enabled, api_key=settings.mcp_api_key)
