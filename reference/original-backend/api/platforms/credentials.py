from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from database.core.connection import get_db
from database.models.admin import Admin
from database.models.api_credential import ApiCredential
from database.models.audit_log import AuditLog
from api.auth.deps import get_company_id, get_current_user

router = APIRouter(prefix="/platforms", tags=["api-credentials"])


class CredentialCreate(BaseModel):
    name: str


class CredentialUpdate(BaseModel):
    name: str | None = None
    active: bool | None = None


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
    db.add(AuditLog(company_id=current_user.company_id, actor_id=current_user.id, action="api_credential.create", resource_type="api_credential", details={"name": payload.name.strip()}))
    db.commit()
    db.refresh(row)
    return {"id": row.id, "name": row.name, "token": token, "token_prefix": row.token_prefix, "active": row.is_active, "created_at": row.created_at.isoformat() if row.created_at else None}


@router.patch("/credentials/{credential_id}")
@router.put("/credentials/{credential_id}")
@router.post("/credentials/{credential_id}")
def update_credential(
    credential_id: int,
    payload: CredentialUpdate,
    db: Session = Depends(get_db),
    company_id: int = Depends(get_company_id),
    current_user: Admin = Depends(get_current_user)
):
    """
    Update credential name or active status.
    """
    row = db.query(ApiCredential).filter(
        ApiCredential.id == credential_id,
        ApiCredential.company_id == company_id
    ).first()
    
    if not row:
        raise HTTPException(status_code=404, detail="Credencial não encontrada")
    
    # Update fields if provided
    if payload.name is not None:
        if not payload.name.strip():
            raise HTTPException(status_code=400, detail="Nome da credencial obrigatório")
        row.name = payload.name.strip()
        db.add(AuditLog(
            company_id=company_id,
            actor_id=current_user.id,
            action="api_credential.update_name",
            resource_type="api_credential",
            resource_id=str(row.id),
            details={"name": row.name}
        ))
    
    if payload.active is not None:
        row.is_active = payload.active
        action = "api_credential.activate" if payload.active else "api_credential.deactivate"
        db.add(AuditLog(
            company_id=company_id,
            actor_id=current_user.id,
            action=action,
            resource_type="api_credential",
            resource_id=str(row.id),
            details={"name": row.name, "active": payload.active}
        ))
    
    db.commit()
    db.refresh(row)
    
    return {
        "id": row.id,
        "name": row.name,
        "token_prefix": row.token_prefix,
        "active": row.is_active,
        "created_at": row.created_at.isoformat() if row.created_at else None,
        "last_used_at": row.last_used_at.isoformat() if row.last_used_at else None
    }


@router.post("/credentials/{credential_id}/toggle")
@router.patch("/credentials/{credential_id}/toggle")
def toggle_credential(
    credential_id: int,
    db: Session = Depends(get_db),
    company_id: int = Depends(get_company_id),
    current_user: Admin = Depends(get_current_user)
):
    """
    Toggle active status of a credential.
    """
    row = db.query(ApiCredential).filter(
        ApiCredential.id == credential_id,
        ApiCredential.company_id == company_id
    ).first()
    
    if not row:
        raise HTTPException(status_code=404, detail="Credencial não encontrada")
    
    row.is_active = not row.is_active
    action = "api_credential.activate" if row.is_active else "api_credential.deactivate"
    db.add(AuditLog(
        company_id=company_id,
        actor_id=current_user.id,
        action=action,
        resource_type="api_credential",
        resource_id=str(row.id),
        details={"name": row.name, "active": row.is_active}
    ))
    db.commit()
    db.refresh(row)
    
    return {
        "id": row.id,
        "name": row.name,
        "token_prefix": row.token_prefix,
        "active": row.is_active,
        "created_at": row.created_at.isoformat() if row.created_at else None,
        "last_used_at": row.last_used_at.isoformat() if row.last_used_at else None
    }


@router.delete("/credentials/{credential_id}", status_code=204)
def delete_credential(credential_id: int, db: Session = Depends(get_db), company_id: int = Depends(get_company_id), current_user: Admin = Depends(get_current_user)):
    row = db.query(ApiCredential).filter(ApiCredential.id == credential_id, ApiCredential.company_id == company_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Credencial não encontrada")
    
    # Actually delete the credential instead of just marking inactive
    db.delete(row)
    db.add(AuditLog(company_id=company_id, actor_id=current_user.id, action="api_credential.delete", resource_type="api_credential", resource_id=str(row.id), details={"name": row.name}))
    db.commit()
