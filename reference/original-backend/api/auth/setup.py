from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
import bcrypt
import secrets
from datetime import datetime, timedelta
from database.core.connection import get_db
from database.models.admin import Admin, UserRole
from services.email import send_welcome_email, send_signup_code_email

router = APIRouter()


class SetupRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    confirm_password: str


class InviteSetupRequest(BaseModel):
    email: EmailStr
    password: str
    confirm_password: str


class SetupStatusResponse(BaseModel):
    is_configured: bool


class InviteInfoResponse(BaseModel):
    name: str
    role: str
    email: EmailStr | None = None


class VerifyCodeRequest(BaseModel):
    email: EmailStr
    code: str


class VerifyCodeResponse(BaseModel):
    message: str
    access_token: str | None = None
    token_type: str | None = None
    user: dict | None = None


class ResendCodeRequest(BaseModel):
    email: EmailStr


@router.get("/setup/status", response_model=SetupStatusResponse)
def setup_status(db: Session = Depends(get_db)):
    """
    Sempre retorna is_configured=False para permitir signups públicos.
    No modelo SaaS, setup está sempre disponível para novos usuários.
    """
    return {"is_configured": False}


@router.get("/setup/invite/{token}", response_model=InviteInfoResponse)
def get_invite_info(token: str, db: Session = Depends(get_db)):
    """Return name and role for an invite token (no auth needed)."""
    invite = db.query(Admin).filter(Admin.invite_token == token).first()
    if not invite:
        raise HTTPException(status_code=404, detail="Convite inválido ou expirado")
    return {"name": invite.name, "role": invite.role.value, "email": invite.email}


@router.post("/setup")
def create_admin(data: SetupRequest, db: Session = Depends(get_db)):
    """
    Public signup – qualquer pessoa pode criar sua empresa.
    Cada signup cria um novo company_id isolado (modelo SaaS).
    """
    try:
        # Verificar se email já existe
        existing = db.query(Admin).filter(Admin.email == data.email).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email já cadastrado")

        if data.password != data.confirm_password:
            raise HTTPException(status_code=400, detail="Senhas não coincidem")

        if len(data.password) < 6:
            raise HTTPException(status_code=400, detail="Senha deve ter pelo menos 6 caracteres")

        salt = bcrypt.gensalt()
        hashed_password = bcrypt.hashpw(data.password.encode("utf-8"), salt).decode("utf-8")

        # Gerar novo company_id único (auto-incremento)
        # Filtrar apenas company_id NOT NULL (ignorar superadmin)
        max_company = db.query(Admin).filter(
            Admin.company_id.isnot(None)
        ).order_by(Admin.company_id.desc()).first()
        new_company_id = (max_company.company_id + 1) if max_company and max_company.company_id else 1

        # Gerar código de verificação (6 dígitos)
        verification_code = str(secrets.randbelow(900000) + 100000)

        admin = Admin(
            name=data.name,
            email=data.email,
            password_hash=hashed_password,
            role=UserRole.owner,  # Cada signup vira owner da própria empresa
            company_id=new_company_id,  # SaaS: cada empresa isolada
            is_active=1,  # Explicitamente definir is_active
            subscription_plan="free",
            subscription_started_at=datetime.utcnow(),
            email_verification_code=verification_code,
            email_verification_expires=datetime.utcnow() + timedelta(minutes=10),
            is_email_verified=False,
        )
        db.add(admin)
        db.commit()
        db.refresh(admin)

        # Enviar código de verificação por email
        send_signup_code_email(admin.email, verification_code, admin.name)

        return {"message": "Conta criada! Verifique seu email para o código de verificação.", "requires_verification": True}
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Erro ao criar conta: {str(e)}")


@router.post("/setup/invite/{token}")
def complete_invite(token: str, data: InviteSetupRequest, db: Session = Depends(get_db)):
    """Complete an invite – convidado sets email + password."""
    invite = db.query(Admin).filter(Admin.invite_token == token).first()
    if not invite:
        raise HTTPException(status_code=404, detail="Convite inválido ou expirado")

    if data.password != data.confirm_password:
        raise HTTPException(status_code=400, detail="As senhas não coincidem")

    # When an invite is bound to an email, the holder cannot redirect it to another account.
    if invite.email and invite.email.casefold() != str(data.email).casefold():
        raise HTTPException(status_code=400, detail="Este convite foi emitido para outro e-mail")

    if len(data.password) < 6:
        raise HTTPException(status_code=400, detail="Senha deve ter pelo menos 6 caracteres")

    # Check if email is already taken
    existing = db.query(Admin).filter(Admin.email == data.email, Admin.id != invite.id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email já está em uso")

    salt = bcrypt.gensalt()
    invite.email = data.email
    invite.password_hash = bcrypt.hashpw(data.password.encode("utf-8"), salt).decode("utf-8")
    invite.invite_token = None  # consume the token
    invite.is_email_verified = True  # Convites já verificam o email
    db.commit()

    # Enviar email de boas-vindas
    send_welcome_email(invite.email, invite.name)

    return {"message": "Conta criada com sucesso"}


@router.post("/setup/verify-code", response_model=VerifyCodeResponse)
def verify_signup_code(data: VerifyCodeRequest, db: Session = Depends(get_db)):
    """Verifica código de email e faz login automático."""
    admin = db.query(Admin).filter(Admin.email == data.email).first()

    if not admin:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")

    if admin.is_email_verified:
        raise HTTPException(status_code=400, detail="Email já verificado")

    if not admin.email_verification_code or admin.email_verification_code != data.code:
        raise HTTPException(status_code=400, detail="Código inválido")

    if not admin.email_verification_expires or admin.email_verification_expires < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Código expirado. Solicite outro.")

    # Marcar email como verificado
    admin.is_email_verified = True
    admin.email_verification_code = None
    admin.email_verification_expires = None
    db.commit()

    # Enviar email de boas-vindas
    send_welcome_email(admin.email, admin.name)

    # Gerar token de acesso automático
    from api.auth.token import create_access_token
    access_token = create_access_token({
        "sub": str(admin.id),
        "email": admin.email,
        "role": admin.role.value,
        "token_version": admin.token_version or 1,
    })

    return {
        "message": "Email verificado com sucesso! Bem-vindo ao LomusTrack.",
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": admin.id,
            "name": admin.name,
            "email": admin.email,
            "role": admin.role.value,
        }
    }


@router.post("/setup/resend-code", response_model=VerifyCodeResponse)
def resend_verification_code(data: ResendCodeRequest, db: Session = Depends(get_db)):
    """Reenvia código de verificação."""
    admin = db.query(Admin).filter(Admin.email == data.email).first()

    if not admin:
        # Não revela se email existe
        return {"message": "Se o email estiver cadastrado, um novo código foi enviado."}

    if admin.is_email_verified:
        raise HTTPException(status_code=400, detail="Email já verificado")

    # Gerar novo código
    verification_code = str(secrets.randbelow(900000) + 100000)
    admin.email_verification_code = verification_code
    admin.email_verification_expires = datetime.utcnow() + timedelta(minutes=10)
    db.commit()

    send_signup_code_email(admin.email, verification_code, admin.name)

    return {"message": "Novo código enviado para seu email."}
