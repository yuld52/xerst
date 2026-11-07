"""
Painel Super Admin - Gerenciamento de empresas/clientes do SaaS.
Apenas usuários com role=superadmin podem acessar.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel, Field
from datetime import datetime, timedelta
from typing import Optional

from database.core.connection import get_db
from database.models.admin import Admin, UserRole
from database.models.transaction import Transaction, TransactionStatus
from database.models.customer import Customer
from database.models.product import Product
from database.models.subscription_plan_request import SubscriptionPlanRequest
from database.models.audit_log import AuditLog
from database.models.global_app_settings import GlobalAppSettings
from api.auth.deps import get_current_user

router = APIRouter(prefix="/superadmin", tags=["superadmin"])

LOMUS_PLANS = {
    "free": {"name": "Gratuito", "monthly_price": 0},
    "premium": {"name": "Premium", "monthly_price": 29},
    "monster": {"name": "Monster", "monthly_price": 79},
}


def require_superadmin(current_user: Admin = Depends(get_current_user)) -> Admin:
    """Verifica se o usuário é superadmin."""
    if current_user.role != UserRole.superadmin:
        raise HTTPException(
            status_code=403,
            detail="Acesso negado. Apenas super administradores."
        )
    return current_user


class CompanyStats(BaseModel):
    company_id: int
    owner_name: str
    owner_email: str
    is_active: bool
    created_at: datetime
    
    # Estatísticas
    total_users: int
    total_products: int
    total_customers: int
    total_transactions: int
    total_revenue: float
    
    # Assinatura (futuro)
    subscription_expires_at: Optional[datetime] = None


class CompanySuspendRequest(BaseModel):
    is_active: bool  # True=ativar, False=suspender


class PlanRequestReview(BaseModel):
    decision: str  # approved or rejected


class LomusOperatingCosts(BaseModel):
    monthly_costs: float = Field(ge=0, le=100000000)


@router.get("/companies", response_model=list[CompanyStats])
def list_all_companies(
    db: Session = Depends(get_db),
    _: Admin = Depends(require_superadmin),
):
    """
    Lista todas as empresas cadastradas no sistema.
    Retorna estatísticas de uso para análise.
    """
    # Buscar todos os owners (1 por empresa)
    owners = db.query(Admin).filter(
        Admin.role == UserRole.owner,
        Admin.company_id.isnot(None)
    ).order_by(Admin.created_at.desc()).all()
    
    companies = []
    
    for owner in owners:
        company_id = owner.company_id
        
        # Contar usuários da empresa
        total_users = db.query(func.count(Admin.id)).filter(
            Admin.company_id == company_id
        ).scalar() or 0
        
        # Contar produtos
        total_products = db.query(func.count(Product.id)).filter(
            Product.company_id == company_id
        ).scalar() or 0
        
        # Contar clientes
        total_customers = db.query(func.count(Customer.id)).filter(
            Customer.company_id == company_id
        ).scalar() or 0
        
        # Contar transações aprovadas
        total_transactions = db.query(func.count(Transaction.id)).filter(
            Transaction.company_id == company_id,
            Transaction.status == TransactionStatus.APPROVED
        ).scalar() or 0
        
        # Somar receita
        total_revenue = db.query(func.sum(Transaction.amount)).filter(
            Transaction.company_id == company_id,
            Transaction.status == TransactionStatus.APPROVED
        ).scalar() or 0.0
        
        companies.append(CompanyStats(
            company_id=company_id,
            owner_name=owner.name,
            owner_email=owner.email or "",
            is_active=owner.is_active == 1,
            created_at=owner.created_at,
            total_users=int(total_users),
            total_products=int(total_products),
            total_customers=int(total_customers),
            total_transactions=int(total_transactions),
            total_revenue=float(total_revenue),
            subscription_expires_at=owner.subscription_expires_at,
        ))
    
    return companies


@router.patch("/companies/{company_id}/status")
def toggle_company_status(
    company_id: int,
    payload: CompanySuspendRequest,
    db: Session = Depends(get_db),
    _: Admin = Depends(require_superadmin),
):
    """
    Ativa ou suspende uma empresa.
    Suspender bloqueia acesso de todos usuários da empresa.
    """
    # Atualizar todos os usuários da empresa
    users = db.query(Admin).filter(Admin.company_id == company_id).all()
    
    if not users:
        raise HTTPException(status_code=404, detail="Empresa não encontrada")
    
    for user in users:
        user.is_active = 1 if payload.is_active else 0
    db.add(AuditLog(company_id=company_id, actor_id=_.id, action="company.status.update", resource_type="company", resource_id=str(company_id), details={"is_active": payload.is_active}))
    db.commit()
    
    status_text = "ativada" if payload.is_active else "suspensa"
    return {"message": f"Empresa {company_id} {status_text} com sucesso"}


@router.get("/stats")
def get_global_stats(
    db: Session = Depends(get_db),
    _: Admin = Depends(require_superadmin),
):
    """
    Estatísticas globais do SaaS (todas as empresas).
    """
    total_companies = db.query(func.count(func.distinct(Admin.company_id))).filter(
        Admin.company_id.isnot(None)
    ).scalar() or 0
    
    active_companies = db.query(func.count(func.distinct(Admin.company_id))).filter(
        Admin.company_id.isnot(None),
        Admin.is_active == 1
    ).scalar() or 0
    
    total_users = db.query(func.count(Admin.id)).filter(
        Admin.company_id.isnot(None)
    ).scalar() or 0
    
    total_revenue = db.query(func.sum(Transaction.amount)).filter(
        Transaction.status == TransactionStatus.APPROVED
    ).scalar() or 0.0
    
    total_transactions = db.query(func.count(Transaction.id)).filter(
        Transaction.status == TransactionStatus.APPROVED
    ).scalar() or 0
    
    return {
        "total_companies": int(total_companies),
        "active_companies": int(active_companies),
        "suspended_companies": int(total_companies) - int(active_companies),
        "total_users": int(total_users),
        "total_revenue": float(total_revenue),
        "total_transactions": int(total_transactions),
        "avg_revenue_per_company": float(total_revenue) / max(int(total_companies), 1),
    }


@router.get("/subscriptions")
def list_company_subscriptions(
    db: Session = Depends(get_db),
    _: Admin = Depends(require_superadmin),
):
    owners = db.query(Admin).filter(
        Admin.role == UserRole.owner,
        Admin.company_id.isnot(None),
    ).order_by(Admin.created_at.desc()).all()
    requests = db.query(SubscriptionPlanRequest).filter(
        SubscriptionPlanRequest.status == "pending",
    ).order_by(SubscriptionPlanRequest.created_at.asc()).all()
    request_by_company = {item.company_id: item for item in requests}

    companies = []
    for owner in owners:
        plan_id = owner.subscription_plan if owner.subscription_plan in LOMUS_PLANS else "free"
        user_count = db.query(func.count(Admin.id)).filter(Admin.company_id == owner.company_id).scalar() or 0
        companies.append({
            "company_id": owner.company_id,
            "owner_name": owner.name,
            "owner_email": owner.email or "",
            "plan_id": plan_id,
            "plan_name": LOMUS_PLANS[plan_id]["name"],
            "monthly_price": LOMUS_PLANS[plan_id]["monthly_price"],
            "user_count": int(user_count),
            "is_active": owner.is_active == 1,
            "started_at": owner.subscription_started_at,
            "expires_at": owner.subscription_expires_at,
            "pending_request": ({
                "id": request_by_company[owner.company_id].id,
                "plan_id": request_by_company[owner.company_id].requested_plan,
                "created_at": request_by_company[owner.company_id].created_at,
            } if owner.company_id in request_by_company else None),
        })
    return {"companies": companies}


@router.get("/financials")
def get_lomus_financials(
    db: Session = Depends(get_db),
    _: Admin = Depends(require_superadmin),
):
    owners = db.query(Admin).filter(
        Admin.role == UserRole.owner,
        Admin.company_id.isnot(None),
        Admin.is_active == 1,
    ).all()
    active_owners = [
        owner for owner in owners
        if not owner.subscription_expires_at or owner.subscription_expires_at > datetime.utcnow()
    ]
    paid_owners = [
        owner for owner in active_owners
        if owner.subscription_plan in LOMUS_PLANS
        and LOMUS_PLANS[owner.subscription_plan]["monthly_price"] > 0
    ]
    monthly_revenue = sum(LOMUS_PLANS[owner.subscription_plan]["monthly_price"] for owner in paid_owners)

    settings_row = db.query(GlobalAppSettings).filter(GlobalAppSettings.id == 1).first()
    settings = settings_row.settings if settings_row and isinstance(settings_row.settings, dict) else {}
    monthly_costs = float(settings.get("lomusMonthlyOperatingCosts", 0) or 0)
    return {
        "currency": "USD",
        "active_subscribers": len(active_owners),
        "paid_subscribers": len(paid_owners),
        "monthly_recurring_revenue_estimate": monthly_revenue,
        "monthly_operating_costs": monthly_costs,
        "estimated_monthly_profit": monthly_revenue - monthly_costs,
        "revenue_is_estimate": True,
    }


@router.put("/financials/costs")
def update_lomus_operating_costs(
    payload: LomusOperatingCosts,
    db: Session = Depends(get_db),
    actor: Admin = Depends(require_superadmin),
):
    row = db.query(GlobalAppSettings).filter(GlobalAppSettings.id == 1).first()
    if row is None:
        row = GlobalAppSettings(id=1, settings={})
        db.add(row)
    settings = dict(row.settings or {})
    settings["lomusMonthlyOperatingCosts"] = payload.monthly_costs
    row.settings = settings
    db.add(AuditLog(
        actor_id=actor.id,
        action="lomus.financial_costs.update",
        resource_type="global_app_settings",
        resource_id="1",
        details={"monthly_operating_costs": payload.monthly_costs},
    ))
    db.commit()
    return get_lomus_financials(db=db, _=actor)


@router.patch("/subscription-requests/{request_id}")
def review_subscription_request(
    request_id: int,
    payload: PlanRequestReview,
    db: Session = Depends(get_db),
    reviewer: Admin = Depends(require_superadmin),
):
    if payload.decision not in ("approved", "rejected"):
        raise HTTPException(status_code=422, detail="A decisão precisa ser approved ou rejected.")

    request = db.query(SubscriptionPlanRequest).filter(
        SubscriptionPlanRequest.id == request_id,
        SubscriptionPlanRequest.status == "pending",
    ).first()
    if not request:
        raise HTTPException(status_code=404, detail="Solicitação não encontrada ou já revisada.")

    now = datetime.utcnow()
    request.status = payload.decision
    request.reviewed_at = now
    request.reviewed_by_admin_id = reviewer.id

    if payload.decision == "approved":
        owner = db.query(Admin).filter(
            Admin.company_id == request.company_id,
            Admin.role == UserRole.owner,
        ).first()
        if not owner:
            raise HTTPException(status_code=404, detail="Responsável da empresa não encontrado.")
        owner.subscription_plan = request.requested_plan
        owner.subscription_started_at = now
        owner.subscription_expires_at = now + timedelta(days=30)

    db.add(AuditLog(company_id=request.company_id, actor_id=reviewer.id, action="subscription.request.review", resource_type="subscription_request", resource_id=str(request.id), details={"decision": payload.decision, "plan": request.requested_plan}))

    db.commit()
    return {"id": request.id, "status": request.status, "message": "Solicitação atualizada."}
