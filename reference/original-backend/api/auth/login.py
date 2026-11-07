from datetime import datetime, timedelta
import uuid
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
import bcrypt
from database.core.connection import get_db
from database.models.admin import Admin
from api.auth.token import create_access_token
from services.totp import verify_code
from database.models.auth_session import AuthSession

router = APIRouter()


class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    two_factor_code: str | None = None


class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    user: dict


@router.post("/login", response_model=LoginResponse)
def login(data: LoginRequest, request: Request, db: Session = Depends(get_db)):
    admin = db.query(Admin).filter(Admin.email == data.email).first()

    if not admin or not admin.password_hash:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if admin.is_active == 0:
        raise HTTPException(status_code=403, detail="Conta suspensa. Entre em contato com o suporte.")

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
