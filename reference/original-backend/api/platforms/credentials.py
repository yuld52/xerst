from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from database.core.connection import get_db
from database.models.admin import Admin
from database.models.api_credential import ApiCredential
from api.auth.deps import get_company_id, get_current_user

router = APIRouter(prefix="/platforms", tags=["api-credentials"])


class CredentialCreate(BaseModel):
    name: str


@router.get("/credentials")
def list_credentials(db: Session = Depends(get_db), company_id: int = Depends(get_company_id)):
    rows = db.query(ApiCredential).filter(ApiCredential.company_id == company_id).order_by(ApiCredential.id.desc()).all()
    return [{"id": row.id, "name": row.name, "token_prefix": row.token_prefix, "active": row.is_active, "created_at": row.created_at.isoformat() if row.created_at else None, "last_used_at": row.last_used_at.isoformat() if row.last_used_at else None} for row in rows]


@router.post("/credentials", status_code=201)
def create_credential(payload: CredentialCreate, db: Session = Depends(get_db), current_user: Admin = Depends(get_current_user)):
    if not payload.name.strip():
        raise HTTPException(status_code=400, detail="Nome da credencial obrigatório")
    token = ApiCredential.generate_token()
    row = ApiCredential(company_id=current_user.company_id, name=payload.name.strip(), token_hash=ApiCredential.hash_token(token), token_prefix=token[:12], is_active=True)
    db.add(row)
    db.commit()
    db.refresh(row)
    return {"id": row.id, "name": row.name, "token": token, "token_prefix": row.token_prefix, "active": row.is_active, "created_at": row.created_at.isoformat() if row.created_at else None}


@router.delete("/credentials/{credential_id}", status_code=204)
def delete_credential(credential_id: int, db: Session = Depends(get_db), company_id: int = Depends(get_company_id)):
    row = db.query(ApiCredential).filter(ApiCredential.id == credential_id, ApiCredential.company_id == company_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Credencial não encontrada")
    row.is_active = False
    db.commit()
