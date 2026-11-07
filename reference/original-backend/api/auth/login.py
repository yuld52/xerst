from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
import bcrypt
from database.core.connection import get_db
from database.models.admin import Admin
from api.auth.token import create_access_token
from services.totp import verify_code

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
def login(data: LoginRequest, db: Session = Depends(get_db)):
    admin = db.query(Admin).filter(Admin.email == data.email).first()

    if not admin or not admin.password_hash:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    try:
        if not bcrypt.checkpw(data.password.encode("utf-8"), admin.password_hash.encode("utf-8")):
            raise HTTPException(status_code=401, detail="Invalid credentials")
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if admin.two_factor_enabled and not verify_code(admin.two_factor_secret or "", data.two_factor_code or ""):
        raise HTTPException(status_code=401, detail="Código de autenticação de dois fatores inválido")

    token = create_access_token({
        "sub": str(admin.id),
        "email": admin.email,
        "role": admin.role.value,
        "token_version": admin.token_version or 1,
    })

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
