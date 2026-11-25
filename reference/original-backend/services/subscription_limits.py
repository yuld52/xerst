"""
Subscription limits validation service.
Validates company subscription limits before operations.
"""
from typing import Optional, Tuple
from datetime import datetime
from sqlalchemy import func
from sqlalchemy.orm import Session
from fastapi import HTTPException

from database.models.admin import Admin, UserRole
from database.models.transaction import Transaction, TransactionStatus
from database.models.webhook_endpoint import WebhookEndpoint
from database.models.facebook_account import FacebookAccount

LOMUS_PLANS = {
    "free": {"name": "Free", "monthly_price": 0, "sales_limit": 100, "ad_account_limit": 3, "webhook_limit": 3},
    "premium": {"name": "Premium", "monthly_price": 500, "sales_limit": 1000, "ad_account_limit": 10, "webhook_limit": 10},
    "monster": {"name": "Monster", "monthly_price": 2000, "sales_limit": None, "ad_account_limit": None, "webhook_limit": None},
}


def get_company_plan(db: Session, company_id: int) -> dict:
    """Get the current subscription plan for a company."""
    owner = db.query(Admin).filter(
        Admin.company_id == company_id,
        Admin.role == UserRole.owner,
    ).first()
    
    if not owner:
        # Fallback to any admin if owner not found
        admin = db.query(Admin).filter(Admin.company_id == company_id).first()
        plan_id = admin.subscription_plan if admin and admin.subscription_plan in LOMUS_PLANS else "free"
    else:
        plan_id = owner.subscription_plan if owner.subscription_plan in LOMUS_PLANS else "free"
    
    return LOMUS_PLANS[plan_id]


def check_sales_limit(db: Session, company_id: int) -> Tuple[bool, Optional[str]]:
    """
    Check if the company can process more sales this month.
    Returns (can_proceed, error_message)
    """
    plan = get_company_plan(db, company_id)
    sales_limit = plan.get("sales_limit")
    
    # Unlimited sales
    if sales_limit is None:
        return (True, None)
    
    # Count approved sales this month
    month_start = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    current_sales = db.query(func.count(Transaction.id)).filter(
        Transaction.company_id == company_id,
        Transaction.status == TransactionStatus.APPROVED,
        Transaction.created_at >= month_start,
    ).scalar() or 0
    
    if current_sales >= sales_limit:
        return (False, f"Limite de {sales_limit} vendas atingido para o plano {plan['name']}. Faça upgrade para continuar.")
    
    return (True, None)


def check_webhook_limit(db: Session, company_id: int) -> Tuple[bool, Optional[str]]:
    """
    Check if the company can create more webhooks.
    Returns (can_proceed, error_message)
    """
    plan = get_company_plan(db, company_id)
    webhook_limit = plan.get("webhook_limit")
    
    # Unlimited webhooks
    if webhook_limit is None:
        return (True, None)
    
    current_webhooks = db.query(func.count(WebhookEndpoint.id)).filter(
        WebhookEndpoint.company_id == company_id,
    ).scalar() or 0
    
    if current_webhooks >= webhook_limit:
        return (False, f"Limite de {webhook_limit} webhooks atingido para o plano {plan['name']}. Faça upgrade para adicionar mais.")
    
    return (True, None)


def check_ad_account_limit(db: Session, company_id: int) -> Tuple[bool, Optional[str]]:
    """
    Check if the company can add more ad accounts.
    Returns (can_proceed, error_message)
    """
    plan = get_company_plan(db, company_id)
    account_limit = plan.get("ad_account_limit")
    
    # Unlimited ad accounts
    if account_limit is None:
        return (True, None)
    
    current_accounts = db.query(func.count(FacebookAccount.id)).filter(
        FacebookAccount.company_id == company_id,
    ).scalar() or 0
    
    if current_accounts >= account_limit:
        return (False, f"Limite de {account_limit} contas de anúncio atingido para o plano {plan['name']}. Faça upgrade para adicionar mais.")
    
    return (True, None)


def enforce_sales_limit(db: Session, company_id: int) -> None:
    """
    Enforce sales limit or raise HTTPException.
    Use this before processing a new sale.
    """
    can_proceed, error_message = check_sales_limit(db, company_id)
    if not can_proceed:
        raise HTTPException(status_code=403, detail=error_message)


def enforce_webhook_limit(db: Session, company_id: int) -> None:
    """
    Enforce webhook limit or raise HTTPException.
    Use this before creating a new webhook.
    """
    can_proceed, error_message = check_webhook_limit(db, company_id)
    if not can_proceed:
        raise HTTPException(status_code=403, detail=error_message)


def enforce_ad_account_limit(db: Session, company_id: int) -> None:
    """
    Enforce ad account limit or raise HTTPException.
    Use this before adding a new ad account.
    """
    can_proceed, error_message = check_ad_account_limit(db, company_id)
    if not can_proceed:
        raise HTTPException(status_code=403, detail=error_message)
