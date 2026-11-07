from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime

from database.core.connection import get_db
from database.models.gemini_account import GeminiAccount
from api.auth.deps import get_current_user, get_company_id

router = APIRouter(prefix="/gemini", tags=["gemini"])


class GeminiAccountCreate(BaseModel):
    name: str
    model: str = "openai/gpt-4o-mini"


class GeminiAccountUpdate(BaseModel):
    model: str


class GeminiAccountResponse(BaseModel):
    id: int
    name: str
    model: str
    created_at: datetime | None = None

    class Config:
        from_attributes = True


@router.get("/accounts", response_model=list[GeminiAccountResponse])
def list_accounts(
    db: Session = Depends(get_db),
    company_id: int = Depends(get_company_id),
):
    return db.query(GeminiAccount).filter(
        GeminiAccount.company_id == company_id,
    ).order_by(GeminiAccount.id.desc()).all()


@router.post("/accounts", response_model=GeminiAccountResponse, status_code=201)
def create_account(
    payload: GeminiAccountCreate,
    db: Session = Depends(get_db),
    company_id: int = Depends(get_company_id),
):
    account = GeminiAccount(
        name=payload.name,
        company_id=company_id,
        api_key=None,
        model=payload.model,
    )
    db.add(account)
    db.commit()
    db.refresh(account)
    return account


@router.patch("/accounts/{account_id}", response_model=GeminiAccountResponse)
def update_account_model(
    account_id: int,
    payload: GeminiAccountUpdate,
    db: Session = Depends(get_db),
    company_id: int = Depends(get_company_id),
):
    account = db.query(GeminiAccount).filter(GeminiAccount.id == account_id, GeminiAccount.company_id == company_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Conta Gemini não encontrada")
    account.model = payload.model
    db.commit()
    db.refresh(account)
    return account


@router.delete("/accounts/{account_id}", status_code=204)
def delete_account(
    account_id: int,
    db: Session = Depends(get_db),
    company_id: int = Depends(get_company_id),
):
    account = db.query(GeminiAccount).filter(GeminiAccount.id == account_id, GeminiAccount.company_id == company_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Conta Gemini não encontrada")
    db.delete(account)
    db.commit()
