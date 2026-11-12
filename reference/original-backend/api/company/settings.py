from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field, ConfigDict
from typing import Literal
from typing import Optional
from database.core.connection import get_db
from database.models.company import CompanySettings, DEFAULT_KPI_COLORS, DEFAULT_AI_INSTRUCTIONS
from database.models.admin import Admin
from database.models.audit_log import AuditLog
from api.auth.deps import get_current_user, get_company_id

router = APIRouter(prefix="/company", tags=["company"])


class OperationalCostSchema(BaseModel):
    id: str
    name: str
    amount: float


class CompanySettingsSchema(BaseModel):
    tax_rate: float
    operational_costs: list[OperationalCostSchema]


class CompanySettingsResponse(BaseModel):
    tax_rate: float
    operational_costs: list[OperationalCostSchema]

    model_config = ConfigDict(from_attributes=True)


class DisplayCurrencyPayload(BaseModel):
    currency: Literal["MZN", "BRL", "USD", "EUR", "ZAR", "AOA"]


# ── KPI Colors schemas ──────────────────────────────────
class KpiThreshold(BaseModel):
    min: Optional[float] = None
    max: Optional[float] = None


class KpiColorEntry(BaseModel):
    green: KpiThreshold
    yellow: KpiThreshold
    red: KpiThreshold


class KpiColorsSchema(BaseModel):
    roas: Optional[KpiColorEntry] = None
    cpa: Optional[KpiColorEntry] = None
    ctr: Optional[KpiColorEntry] = None
    cpc: Optional[KpiColorEntry] = None


class NotificationPreferencesSchema(BaseModel):
    pendingSales: str = "hide"
    approvedSales: str = "show"
    saleValue: str = "show"
    productName: str = "hide"
    campaignValue: str = "hide"
    reportHours: dict[str, bool] = Field(default_factory=lambda: {"08:00": False, "12:00": False, "18:00": False, "23:00": False})
    template: str = "profit"
    timezone: str = "Africa/Maputo"

    def model_post_init(self, __context):
        for field_name in ("pendingSales", "approvedSales", "saleValue", "productName", "campaignValue"):
            if getattr(self, field_name) not in ("show", "hide"):
                raise ValueError(f"{field_name} deve ser show ou hide")
        if self.template not in ("profit", "summary", "creative"):
            raise ValueError("Modelo de notificação inválido")


def _get_or_create_settings(db: Session, company_id: int) -> CompanySettings:
    settings = db.query(CompanySettings).filter(CompanySettings.company_id == company_id).first()
    # Compatibilidade com a instalação antiga que possuía uma única linha sem company_id.
    if not settings:
        legacy = db.query(CompanySettings).filter(CompanySettings.company_id.is_(None)).first()
        if legacy:
            legacy.company_id = company_id
            db.commit()
            db.refresh(legacy)
            return legacy
    if not settings:
        settings = CompanySettings(
            company_id=company_id,
            tax_rate=12.3,
            operational_costs=[],
            kpi_colors=DEFAULT_KPI_COLORS,
        )
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return settings


@router.get("/settings", response_model=CompanySettingsResponse)
def get_settings(db: Session = Depends(get_db), company_id: int = Depends(get_company_id)):
    return _get_or_create_settings(db, company_id)


@router.put("/settings", response_model=CompanySettingsResponse)
def update_settings(
    payload: CompanySettingsSchema,
    db: Session = Depends(get_db),
    company_id: int = Depends(get_company_id),
    current_user: Admin = Depends(get_current_user),
):
    settings = _get_or_create_settings(db, company_id)
    settings.tax_rate = payload.tax_rate
    settings.operational_costs = [
        c.model_dump() for c in payload.operational_costs
    ]
    db.add(AuditLog(company_id=company_id, actor_id=current_user.id, action="company.settings.update", resource_type="company_settings", details={"tax_rate": payload.tax_rate, "operational_cost_count": len(payload.operational_costs)}))
    db.commit()
    db.refresh(settings)
    return settings


# ── KPI Colors endpoints ────────────────────────────────
@router.get("/kpi-colors")
def get_kpi_colors(db: Session = Depends(get_db), company_id: int = Depends(get_company_id)):
    settings = _get_or_create_settings(db, company_id)
    return settings.kpi_colors or DEFAULT_KPI_COLORS


@router.put("/kpi-colors")
def update_kpi_colors(
    payload: KpiColorsSchema,
    db: Session = Depends(get_db),
    company_id: int = Depends(get_company_id),
    current_user: Admin = Depends(get_current_user),
):
    settings = _get_or_create_settings(db, company_id)
    settings.kpi_colors = payload.model_dump()
    db.add(AuditLog(company_id=company_id, actor_id=current_user.id, action="company.kpi_colors.update", resource_type="company_settings", details={}))
    db.commit()
    db.refresh(settings)
    return settings.kpi_colors


# ── AI Instructions schemas ─────────────────────────────
class MetricRule(BaseModel):
    good: Optional[str] = None
    bad: Optional[str] = None
    average: Optional[str] = None


class AiMetricsConfig(BaseModel):
    roas: Optional[MetricRule] = None
    cpa: Optional[MetricRule] = None
    cpc: Optional[MetricRule] = None
    connect_rate: Optional[MetricRule] = None


class AiInstructionsSchema(BaseModel):
    metrics: AiMetricsConfig
    additional_prompt: str = ""


# ── AI Instructions endpoints ───────────────────────────
@router.get("/ai-instructions")
def get_ai_instructions(
    db: Session = Depends(get_db), company_id: int = Depends(get_company_id)
):
    settings = _get_or_create_settings(db, company_id)
    return settings.ai_instructions or DEFAULT_AI_INSTRUCTIONS


@router.put("/ai-instructions")
def update_ai_instructions(
    payload: AiInstructionsSchema,
    db: Session = Depends(get_db),
    company_id: int = Depends(get_company_id),
    current_user: Admin = Depends(get_current_user),
):
    settings = _get_or_create_settings(db, company_id)
    settings.ai_instructions = payload.model_dump()
    db.add(AuditLog(company_id=company_id, actor_id=current_user.id, action="company.ai_instructions.update", resource_type="company_settings", details={}))
    db.commit()
    db.refresh(settings)
    return settings.ai_instructions


@router.get("/notification-preferences")
def get_notification_preferences(db: Session = Depends(get_db), company_id: int = Depends(get_company_id)):
    settings = _get_or_create_settings(db, company_id)
    return settings.notification_preferences or {
        "pendingSales": "hide", "approvedSales": "show", "saleValue": "show",
        "productName": "hide", "campaignValue": "hide",
        "reportHours": {"08:00": False, "12:00": False, "18:00": False, "23:00": False},
        "template": "profit",
        "timezone": "Africa/Maputo",
    }


@router.put("/notification-preferences")
def update_notification_preferences(
    payload: NotificationPreferencesSchema,
    db: Session = Depends(get_db),
    company_id: int = Depends(get_company_id),
    current_user: Admin = Depends(get_current_user),
):
    settings = _get_or_create_settings(db, company_id)
    settings.notification_preferences = payload.model_dump()
    db.add(AuditLog(company_id=company_id, actor_id=current_user.id, action="company.notification_preferences.update", resource_type="company_settings", details={"template": payload.template}))
    db.commit()
    db.refresh(settings)
    return settings.notification_preferences


@router.get("/currency")
def get_display_currency(db: Session = Depends(get_db), company_id: int = Depends(get_company_id)):
    return {"currency": _get_or_create_settings(db, company_id).display_currency or "MZN"}


@router.put("/currency")
def update_display_currency(
    payload: DisplayCurrencyPayload,
    db: Session = Depends(get_db),
    company_id: int = Depends(get_company_id),
    current_user: Admin = Depends(get_current_user),
):
    settings = _get_or_create_settings(db, company_id)
    settings.display_currency = payload.currency
    db.add(AuditLog(
        company_id=company_id,
        actor_id=current_user.id,
        action="company.display_currency.update",
        resource_type="company_settings",
        details={"currency": payload.currency},
    ))
    db.commit()
    return {"currency": settings.display_currency}
