from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
import bcrypt

from database.core.connection import get_db
from database.models.admin import Admin
from database.models.audit_log import AuditLog
from services.totp import generate_secret, verify_code
from api.auth.deps import get_current_user

router = APIRouter()

class ProfileUpdateRequest(BaseModel):
    name: str
    email: EmailStr

class PasswordChangeRequest(BaseModel):
    new_password: str
    confirm_password: str

@router.get("/profile")
def get_profile(current_user: Admin = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "role": current_user.role.value,
    }

@router.put("/profile")
def update_profile(data: ProfileUpdateRequest, current_user: Admin = Depends(get_current_user), db: Session = Depends(get_db)):
    # Check if email is already taken by another admin
    if data.email != current_user.email:
        existing = db.query(Admin).filter(Admin.email == data.email).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email already registered")
    
    current_user.name = data.name
    current_user.email = data.email
    db.commit()
    db.refresh(current_user)
    
    return {
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email
    }

@router.put("/profile/password")
def change_password(data: PasswordChangeRequest, current_user: Admin = Depends(get_current_user), db: Session = Depends(get_db)):
    if data.new_password != data.confirm_password:
        raise HTTPException(status_code=400, detail="As senhas não coincidem")
        
    hashed = bcrypt.hashpw(data.new_password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    current_user.password_hash = hashed
    current_user.token_version = (current_user.token_version or 1) + 1
    db.add(AuditLog(company_id=current_user.company_id, actor_id=current_user.id, action="security.password.change", resource_type="profile", resource_id=str(current_user.id), details={}))
    db.commit()
    
    return {"message": "Senha atualizada com sucesso"}


@router.post("/profile/sessions/revoke-all")
def revoke_all_sessions(current_user: Admin = Depends(get_current_user), db: Session = Depends(get_db)):
    current_user.token_version = (current_user.token_version or 1) + 1
    db.add(AuditLog(company_id=current_user.company_id, actor_id=current_user.id, action="security.sessions.revoke", resource_type="profile", resource_id=str(current_user.id), details={}))
    db.commit()
    return {"message": "Todas as sessões foram encerradas. Faça login novamente."}


@router.post("/profile/2fa/setup")
def setup_two_factor(current_user: Admin = Depends(get_current_user), db: Session = Depends(get_db)):
    secret = generate_secret()
    current_user.two_factor_secret = secret
    current_user.two_factor_enabled = False
    db.commit()
    return {"secret": secret, "issuer": "LomusTrack", "account": current_user.email}


@router.post("/profile/2fa/enable")
def enable_two_factor(code: str, current_user: Admin = Depends(get_current_user), db: Session = Depends(get_db)):
    if not verify_code(current_user.two_factor_secret or "", code):
        raise HTTPException(status_code=400, detail="Código inválido")
    current_user.two_factor_enabled = True
    db.add(AuditLog(company_id=current_user.company_id, actor_id=current_user.id, action="security.2fa.enable", resource_type="profile", resource_id=str(current_user.id), details={}))
    db.commit()
    return {"enabled": True}


@router.post("/profile/2fa/disable")
def disable_two_factor(current_user: Admin = Depends(get_current_user), db: Session = Depends(get_db)):
    current_user.two_factor_enabled = False
    current_user.two_factor_secret = None
    db.add(AuditLog(company_id=current_user.company_id, actor_id=current_user.id, action="security.2fa.disable", resource_type="profile", resource_id=str(current_user.id), details={}))
    db.commit()
    return {"enabled": False}
