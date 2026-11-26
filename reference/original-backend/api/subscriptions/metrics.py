from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import func
from sqlalchemy.orm import Session
from datetime import datetime
from typing import Literal

from database.core.connection import get_db
from database.models.admin import Admin, UserRole
from database.models.facebook_account import FacebookAccount
from database.models.stripe_account import StripeAccount
from database.models.transaction import Transaction, TransactionStatus
from database.models.webhook_endpoint import WebhookEndpoint
from database.models.subscription_plan_request import SubscriptionPlanRequest
from integrations.stripe.subscriptions import (
    compute_subscription_metrics,
    fetch_stripe_products,
)
from integrations.stripe.mrr_history import compute_mrr_history
from api.auth.deps import get_current_user, get_company_id

router = APIRouter(prefix="/subscriptions", tags=["subscriptions"])

LOMUS_PLANS = {
    "free": {"name": "Gratuito", "monthly_price": 0, "sales_limit": 80, "ad_account_limit": 1, "webhook_limit": 1},
    "premium": {"name": "Premium", "monthly_price": 29, "sales_limit": 1000, "ad_account_limit": 3, "webhook_limit": 3},
    "monster": {"name": "Monster", "monthly_price": 79, "sales_limit": 5000, "ad_account_limit": None, "webhook_limit": None},
}


class PlanRequestCreate(BaseModel):
    plan_id: Literal["premium", "monster"]


@router.get("/current")
def get_current_company_subscription(
    db: Session = Depends(get_db),
    current_user: Admin = Depends(get_current_user),
):
    """Return the current company's plan and usage counters."""
    if current_user.company_id is None:
        raise HTTPException(status_code=403, detail="Super admin não possui assinatura de empresa.")

    owner = db.query(Admin).filter(
        Admin.company_id == current_user.company_id,
        Admin.role == UserRole.owner,
    ).first()
    account = owner or current_user
    plan_id = account.subscription_plan if account.subscription_plan in LOMUS_PLANS else "free"
    month_start = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    approved_sales = db.query(func.count(Transaction.id)).filter(
        Transaction.company_id == current_user.company_id,
        Transaction.status == TransactionStatus.APPROVED,
        Transaction.created_at >= month_start,
    ).scalar() or 0
    ad_accounts = db.query(func.count(FacebookAccount.id)).filter(
        FacebookAccount.company_id == current_user.company_id,
    ).scalar() or 0
    webhooks = db.query(func.count(WebhookEndpoint.id)).filter(
        WebhookEndpoint.company_id == current_user.company_id,
    ).scalar() or 0
    pending_request = db.query(SubscriptionPlanRequest).filter(
        SubscriptionPlanRequest.company_id == current_user.company_id,
        SubscriptionPlanRequest.status == "pending",
    ).order_by(SubscriptionPlanRequest.created_at.desc()).first()

    return {
        "plan_id": plan_id,
        "plan": LOMUS_PLANS[plan_id],
        "started_at": account.subscription_started_at,
        "expires_at": account.subscription_expires_at,
        "usage": {
            "approved_sales_this_month": int(approved_sales),
            "ad_accounts": int(ad_accounts),
            "webhooks": int(webhooks),
        },
        "available_plans": [
            {"id": plan_id, **plan}
            for plan_id, plan in LOMUS_PLANS.items()
        ],
        "pending_plan_request": ({
            "id": pending_request.id,
            "plan_id": pending_request.requested_plan,
            "created_at": pending_request.created_at,
        } if pending_request else None),
    }


@router.post("/requests")
def request_company_plan(
    payload: PlanRequestCreate,
    db: Session = Depends(get_db),
    current_user: Admin = Depends(get_current_user),
):
    if current_user.company_id is None:
        raise HTTPException(status_code=403, detail="Super admin não possui assinatura de empresa.")

    owner = db.query(Admin).filter(
        Admin.company_id == current_user.company_id,
        Admin.role == UserRole.owner,
    ).first()
    current_plan = owner.subscription_plan if owner and owner.subscription_plan in LOMUS_PLANS else "free"
    if payload.plan_id == current_plan:
        raise HTTPException(status_code=400, detail="Esse já é o plano atual da empresa.")

    existing = db.query(SubscriptionPlanRequest).filter(
        SubscriptionPlanRequest.company_id == current_user.company_id,
        SubscriptionPlanRequest.status == "pending",
    ).first()
    if existing:
        if existing.requested_plan == payload.plan_id:
            return {"id": existing.id, "plan_id": existing.requested_plan, "status": existing.status}
        raise HTTPException(status_code=409, detail="Sua empresa já possui uma solicitação de plano pendente.")

    request = SubscriptionPlanRequest(
        company_id=current_user.company_id,
        requested_by_admin_id=current_user.id,
        requested_plan=payload.plan_id,
    )
    db.add(request)
    db.commit()
    db.refresh(request)
    return {"id": request.id, "plan_id": request.requested_plan, "status": request.status}


def _get_first_stripe_account(db: Session, company_id: int) -> StripeAccount:
    """Retorna a primeira conta Stripe configurada ou 404."""
    account = db.query(StripeAccount).filter(StripeAccount.company_id == company_id).first()
    if not account:
        raise HTTPException(
            status_code=404,
            detail="Nenhuma conta Stripe configurada. Adicione uma em Integrações → Stripe.",
        )
    return account


@router.get("/metrics")
def get_subscription_metrics(
    date_from: str | None = Query(None),
    date_to: str | None = Query(None),
    product_id: str | None = Query(None),
    db: Session = Depends(get_db),
    company_id: int = Depends(get_company_id),
):
    account = _get_first_stripe_account(db, company_id)
    try:
        metrics = compute_subscription_metrics(
            api_key=account.api_key,
            date_from=date_from,
            date_to=date_to,
            product_id=product_id,
        )
        return metrics
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao buscar métricas do Stripe: {str(e)}",
        )


@router.get("/mrr-history")
def get_mrr_history(
    months: int = Query(12, ge=3, le=24),
    db: Session = Depends(get_db),
    company_id: int = Depends(get_company_id),
):
    account = _get_first_stripe_account(db, company_id)
    try:
        return compute_mrr_history(account.api_key, months=months)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao buscar histórico de MRR: {str(e)}",
        )


@router.get("/products")
def get_stripe_products(
    db: Session = Depends(get_db),
    company_id: int = Depends(get_company_id),
):
    account = _get_first_stripe_account(db, company_id)
    try:
        return fetch_stripe_products(account.api_key)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao buscar produtos do Stripe: {str(e)}",
        )

