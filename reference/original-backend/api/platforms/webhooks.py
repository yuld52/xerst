import uuid
import hashlib
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime

from database.core.connection import get_db
from database.models.webhook_endpoint import WebhookEndpoint, WebhookPlatform
from database.models.audit_log import AuditLog
from api.auth.deps import get_current_user, get_company_id

router = APIRouter(prefix="/platforms", tags=["platforms"])


class WebhookCreate(BaseModel):
    platform: str  # "hotmart" or "api"
    name: str
    security_token: str | None = None


class WebhookResponse(BaseModel):
    id: int
    slug: str
    platform: str
    name: str
    created_at: datetime | None = None

    class Config:
        from_attributes = True


@router.get("/webhooks", response_model=list[WebhookResponse])
def list_webhooks(
    db: Session = Depends(get_db),
    company_id: int = Depends(get_company_id),
):
    endpoints = db.query(WebhookEndpoint).filter(
        WebhookEndpoint.company_id == company_id
    ).order_by(WebhookEndpoint.id.desc()).all()
    return [
        WebhookResponse(
            id=ep.id,
            slug=ep.slug,
            platform=ep.platform.value,
            name=ep.name,
            created_at=ep.created_at,
        )
        for ep in endpoints
    ]


@router.post("/webhooks", response_model=WebhookResponse, status_code=201)
def create_webhook(
    payload: WebhookCreate,
    db: Session = Depends(get_db),
    company_id: int = Depends(get_company_id),
):
    platform_value = payload.platform.lower()
    if platform_value not in [p.value for p in WebhookPlatform]:
        raise HTTPException(status_code=400, detail="Plataforma inválida")
    security_token = (payload.security_token or "").strip()
    if platform_value == WebhookPlatform.HOTMART.value and not security_token:
        raise HTTPException(status_code=422, detail="O Hottok da Hotmart é obrigatório")
    if len(security_token) > 255:
        raise HTTPException(status_code=422, detail="O Hottok deve ter no máximo 255 caracteres")

    slug = uuid.uuid4().hex[:8]

    endpoint = WebhookEndpoint(
        company_id=company_id,
        slug=slug,
        platform=WebhookPlatform(platform_value),
        name=payload.name,
        security_token_hash=(hashlib.sha256(security_token.encode("utf-8")).hexdigest()
                             if platform_value == WebhookPlatform.HOTMART.value else None),
    )
    db.add(endpoint)
    db.add(AuditLog(company_id=company_id, action="webhook.create", resource_type="webhook_endpoint", resource_id=slug, details={"platform": platform_value, "name": payload.name}))
    db.commit()
    db.refresh(endpoint)

    return WebhookResponse(
        id=endpoint.id,
        slug=endpoint.slug,
        platform=endpoint.platform.value,
        name=endpoint.name,
        created_at=endpoint.created_at,
    )


@router.delete("/webhooks/{webhook_id}", status_code=204)
def delete_webhook(
    webhook_id: int,
    db: Session = Depends(get_db),
    company_id: int = Depends(get_company_id),
):
    endpoint = db.query(WebhookEndpoint).filter(
        WebhookEndpoint.id == webhook_id,
        WebhookEndpoint.company_id == company_id
    ).first()
    if not endpoint:
        raise HTTPException(status_code=404, detail="Webhook não encontrado")
    db.delete(endpoint)
    db.add(AuditLog(company_id=company_id, action="webhook.delete", resource_type="webhook_endpoint", resource_id=str(webhook_id), details={"platform": endpoint.platform.value}))
    db.commit()
