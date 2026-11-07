from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from typing import Any
import json
import bcrypt

from database.core.connection import get_db
from database.models.admin import Admin
from database.models.audit_log import AuditLog
from services.totp import generate_secret, verify_code
from api.auth.deps import get_current_user
from database.models.auth_session import AuthSession
from datetime import datetime

router = APIRouter()

class ProfileUpdateRequest(BaseModel):
    name: str
    email: EmailStr

class PasswordChangeRequest(BaseModel):
    new_password: str
    confirm_password: str

class UserPreferencesRequest(BaseModel):
    preferences: dict[str, Any]

@router.get("/profile")
def get_profile(current_user: Admin = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "role": current_user.role.value,
        "two_factor_enabled": bool(current_user.two_factor_enabled),
    }

@router.get("/profile/preferences")
def get_user_preferences(current_user: Admin = Depends(get_current_user)):
    return current_user.preferences or {}

@router.put("/profile/preferences")
def update_user_preferences(
    payload: UserPreferencesRequest,
    current_user: Admin = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    encoded = json.dumps(payload.preferences, ensure_ascii=False)
    if len(encoded.encode("utf-8")) > 100_000:
        raise HTTPException(status_code=413, detail="As preferências excedem o limite permitido.")
    current_user.preferences = {**(current_user.preferences or {}), **payload.preferences}
    db.commit()
    return current_user.preferences

@router.put("/profile")
def update_profile(data: ProfileUpdateRequest, current_user: Admin = Depends(get_current_user), db: Session = Depends(get_db)):
    # Check if email is already taken by another admin
    if data.email != current_user.email:
        existing = db.query(Admin).filter(Admin.email == data.email).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email already registered")
    
    email_changed = data.email != current_user.email
    current_user.name = data.name
    current_user.email = data.email
    db.add(AuditLog(company_id=current_user.company_id, actor_id=current_user.id, action="profile.update", resource_type="profile", resource_id=str(current_user.id), details={"email_changed": email_changed}))
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
    db.query(AuthSession).filter(AuthSession.admin_id == current_user.id, AuthSession.revoked_at.is_(None)).update({AuthSession.revoked_at: datetime.utcnow()}, synchronize_session=False)
    db.add(AuditLog(company_id=current_user.company_id, actor_id=current_user.id, action="security.sessions.revoke", resource_type="profile", resource_id=str(current_user.id), details={}))
    db.commit()
    return {"message": "Todas as sessões foram encerradas. Faça login novamente."}


@router.get("/profile/sessions")
def list_active_sessions(current_user: Admin = Depends(get_current_user), db: Session = Depends(get_db)):
    rows = db.query(AuthSession).filter(
        AuthSession.admin_id == current_user.id,
        AuthSession.revoked_at.is_(None),
        AuthSession.expires_at > datetime.utcnow(),
    ).order_by(AuthSession.last_seen_at.desc()).all()
    return [{"id": row.session_id, "device": row.user_agent or "Dispositivo desconhecido", "ip_address": row.ip_address, "created_at": row.created_at, "last_seen_at": row.last_seen_at} for row in rows]


@router.delete("/profile/sessions/{session_id}")
def revoke_session(session_id: str, current_user: Admin = Depends(get_current_user), db: Session = Depends(get_db)):
    row = db.query(AuthSession).filter(AuthSession.session_id == session_id, AuthSession.admin_id == current_user.id, AuthSession.revoked_at.is_(None)).first()
    if not row:
        raise HTTPException(status_code=404, detail="Sessão não encontrada")
    row.revoked_at = datetime.utcnow()
    db.add(AuditLog(company_id=current_user.company_id, actor_id=current_user.id, action="security.session.revoke", resource_type="auth_session", resource_id=session_id, details={}))
    db.commit()
    return {"message": "Sessão encerrada"}


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
def disable_two_factor(code: str, current_user: Admin = Depends(get_current_user), db: Session = Depends(get_db)):
    if not verify_code(current_user.two_factor_secret or "", code):
        raise HTTPException(status_code=400, detail="Código de autenticação inválido")
    current_user.two_factor_enabled = False
    current_user.two_factor_secret = None
    db.add(AuditLog(company_id=current_user.company_id, actor_id=current_user.id, action="security.2fa.disable", resource_type="profile", resource_id=str(current_user.id), details={}))
    db.commit()
    return {"enabled": False}
