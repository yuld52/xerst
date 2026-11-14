from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, ConfigDict
from datetime import datetime

from database.core.connection import get_db
from database.models.stripe_account import StripeAccount
from database.models.audit_log import AuditLog
from database.models.admin import Admin
from integrations.stripe.client import validate_stripe_key
from api.auth.deps import get_current_user, get_company_id

router = APIRouter(prefix="/stripe", tags=["stripe"])


class StripeAccountCreate(BaseModel):
    name: str
    api_key: str


class StripeAccountResponse(BaseModel):
    id: int
    name: str
    api_key: str
    created_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


def _masked_key(api_key: str) -> str:
    """Never expose the stored Stripe secret key to the browser."""
    return f"••••••{api_key[-6:]}" if len(api_key) > 6 else "••••••"


def _serialize_account(account: StripeAccount) -> dict:
    return {
        "id": account.id,
        "name": account.name,
        "api_key": _masked_key(account.api_key),
        "created_at": account.created_at,
    }


@router.get("/accounts", response_model=list[StripeAccountResponse])
def list_accounts(
    db: Session = Depends(get_db),
    company_id: int = Depends(get_company_id),
):
    accounts = db.query(StripeAccount).filter(StripeAccount.company_id == company_id).order_by(StripeAccount.id.desc()).all()
    return [_serialize_account(account) for account in accounts]


@router.post("/accounts", response_model=StripeAccountResponse, status_code=201)
def create_account(
    payload: StripeAccountCreate,
    db: Session = Depends(get_db),
    company_id: int = Depends(get_company_id),
    current_user: Admin = Depends(get_current_user),
):
    if not validate_stripe_key(payload.api_key):
        raise HTTPException(
            status_code=400,
            detail="API Key inválida. Verifique se é uma Secret Key válida do Stripe.",
        )

    account = StripeAccount(
        company_id=company_id,
        name=payload.name,
        api_key=payload.api_key,
    )
    db.add(account)
    db.add(AuditLog(company_id=company_id, actor_id=current_user.id, action="stripe_account.create", resource_type="stripe_account", details={"name": payload.name}))
    db.commit()
    db.refresh(account)
    return _serialize_account(account)


@router.delete("/accounts/{account_id}", status_code=204)
def delete_account(
    account_id: int,
    db: Session = Depends(get_db),
    company_id: int = Depends(get_company_id),
    current_user: Admin = Depends(get_current_user),
):
    account = (
        db.query(StripeAccount)
        .filter(StripeAccount.id == account_id, StripeAccount.company_id == company_id)
        .first()
    )
    if not account:
        raise HTTPException(status_code=404, detail="Conta Stripe não encontrada")
    db.delete(account)
    db.add(AuditLog(company_id=company_id, actor_id=current_user.id, action="stripe_account.delete", resource_type="stripe_account", resource_id=str(account_id), details={}))
    db.commit()
