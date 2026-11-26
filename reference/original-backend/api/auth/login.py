from datetime import datetime, timedelta
import os
import uuid
import secrets
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
import bcrypt
from database.core.connection import get_db
from database.models.admin import Admin
from api.auth.token import create_access_token
from services.totp import verify_code
from database.models.auth_session import AuthSession
from services.email import send_password_reset_email

router = APIRouter()


class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    two_factor_code: str | None = None


class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    user: dict


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ForgotPasswordResponse(BaseModel):
    message: str


class ResetPasswordRequest(BaseModel):
    token: str
    password: str
    confirm_password: str


class ResetPasswordResponse(BaseModel):
    message: str


@router.post("/login", response_model=LoginResponse)
def login(data: LoginRequest, request: Request, db: Session = Depends(get_db)):
    admin = db.query(Admin).filter(Admin.email == data.email).first()

    if not admin or not admin.password_hash:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if admin.is_active == 0:
        raise HTTPException(status_code=403, detail="Conta suspensa. Entre em contato com o suporte.")

    # Apenas suporte@lomustrack.online pode ser admin/superadmin
    if admin.role.value in ["admin", "owner", "superadmin"]:
        if admin.email != "suporte@lomustrack.online":
            raise HTTPException(
                status_code=403, 
                detail="Acesso administrativo restrito. Apenas o email oficial pode acessar o painel admin."
            )

    try:
        if not bcrypt.checkpw(data.password.encode("utf-8"), admin.password_hash.encode("utf-8")):
            raise HTTPException(status_code=401, detail="Invalid credentials")
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if admin.two_factor_enabled and not verify_code(admin.two_factor_secret or "", data.two_factor_code or ""):
        raise HTTPException(status_code=401, detail="Código de autenticação de dois fatores inválido")

    session_id = uuid.uuid4().hex
    token = create_access_token({
        "sub": str(admin.id),
        "email": admin.email,
        "role": admin.role.value,
        "token_version": admin.token_version or 1,
        "jti": session_id,
    })
    now = datetime.utcnow()
    db.add(AuthSession(
        session_id=session_id,
        admin_id=admin.id,
        company_id=admin.company_id,
        user_agent=request.headers.get("user-agent", "")[:500],
        ip_address=request.client.host if request.client else None,
        created_at=now,
        last_seen_at=now,
        expires_at=now + timedelta(days=30),
    ))
    db.commit()

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": admin.id,
            "name": admin.name,
            "email": admin.email,
            "role": admin.role.value,
        },
    }


@router.post("/forgot-password", response_model=ForgotPasswordResponse)
def forgot_password(data: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """Solicita recuperação de senha - envia email com token."""
    admin = db.query(Admin).filter(Admin.email == data.email).first()

    # Sempre retorna sucesso por segurança (não revela se email existe)
    if not admin:
        return {"message": "Se o e-mail estiver cadastrado, as instruções foram enviadas."}

    # Gerar token de recuperação (64 chars hex)
    reset_token = secrets.token_hex(32)
    admin.password_reset_token = reset_token
    admin.password_reset_expires = datetime.utcnow() + timedelta(hours=1)
    db.commit()

    # Enviar email
    base_url = os.getenv("BASE_URL", "https://www.lomustrack.online")
    send_password_reset_email(admin.email, reset_token, base_url)

    return {"message": "Se o e-mail estiver cadastrado, as instruções foram enviadas."}


@router.post("/reset-password", response_model=ResetPasswordResponse)
def reset_password(data: ResetPasswordRequest, db: Session = Depends(get_db)):
    """Redefine senha com token."""
    if data.password != data.confirm_password:
        raise HTTPException(status_code=400, detail="Senhas não coincidem")

    if len(data.password) < 6:
        raise HTTPException(status_code=400, detail="Senha deve ter pelo menos 6 caracteres")

    admin = db.query(Admin).filter(Admin.password_reset_token == data.token).first()

    if not admin or not admin.password_reset_expires or admin.password_reset_expires < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Token inválido ou expirado")

    # Atualizar senha
    hashed_password = bcrypt.hashpw(data.password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    admin.password_hash = hashed_password
    admin.password_reset_token = None
    admin.password_reset_expires = None
    admin.token_version = (admin.token_version or 1) + 1  # Invalida sessões antigas
    db.commit()

    return {"message": "Senha redefinida com sucesso. Faça login com a nova senha."}
