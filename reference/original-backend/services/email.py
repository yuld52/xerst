import os
import logging
import resend
from typing import Optional

logger = logging.getLogger("email_service")

RESEND_API_KEY = os.getenv("RESEND_API_KEY")
FROM_EMAIL = os.getenv("FROM_EMAIL", "LomusTrack <noreply@lomustrack.app>")

if RESEND_API_KEY:
    resend.api_key = RESEND_API_KEY
else:
    logger.warning("RESEND_API_KEY não configurada. Emails não serão enviados.")


def _send_email(to: str, subject: str, html: str, text: Optional[str] = None) -> bool:
    """Envia email via Resend."""
    if not RESEND_API_KEY:
        logger.warning(f"Email não enviado (sem API key): {subject} -> {to}")
        return False

    try:
        params = {
            "from": FROM_EMAIL,
            "to": [to],
            "subject": subject,
            "html": html,
        }
        if text:
            params["text"] = text

        resend.Emails.send(params)
        logger.info(f"Email enviado: {subject} -> {to}")
        return True
    except Exception as e:
        logger.error(f"Erro ao enviar email: {e}")
        return False


def send_password_reset_email(to: str, reset_token: str, base_url: str = "https://lomustrack.online") -> bool:
    """Envia email de recuperação de senha."""
    reset_url = f"{base_url}/reset-password?token={reset_token}"

    subject = "Recuperação de senha - LomusTrack"
    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">LomusTrack</h1>
        </div>
        <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb; border-top: none;">
            <h2 style="color: #1f2937; margin-top: 0;">Recuperação de senha</h2>
            <p style="color: #4b5563;">Recebemos uma solicitação para redefinir sua senha. Clique no botão abaixo para criar uma nova senha:</p>
            <div style="text-align: center; margin: 30px 0;">
                <a href="{reset_url}" style="display: inline-block; background: #3B82F6; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">Redefinir senha</a>
            </div>
            <p style="color: #6b7280; font-size: 14px;">Ou copie e cole este link no navegador:</p>
            <p style="color: #3B82F6; font-size: 14px; word-break: break-all;">{reset_url}</p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
            <p style="color: #9ca3af; font-size: 12px;">Este link expira em 1 hora. Se você não solicitou esta recuperação, ignore este email.</p>
            <p style="color: #9ca3af; font-size: 12px;">Equipe LomusTrack</p>
        </div>
    </body>
    </html>
    """
    text = f"Recuperação de senha - LomusTrack\n\nAcesse: {reset_url}\n\nLink expira em 1 hora."

    return _send_email(to, subject, html, text)


def send_welcome_email(to: str, name: str, base_url: str = "https://lomustrack.online") -> bool:
    """Envia email de boas-vindas após cadastro."""
    login_url = f"{base_url}/login"

    subject = "Bem-vindo ao LomusTrack! 🎉"
    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">LomusTrack</h1>
        </div>
        <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb; border-top: none;">
            <h2 style="color: #1f2937; margin-top: 0;">Olá, {name}! 👋</h2>
            <p style="color: #4b5563;">Bem-vindo ao LomusTrack! Sua conta foi criada com sucesso.</p>
            <p style="color: #4b5563;">Agora você pode acompanhar suas vendas, campanhas e métricas em um só lugar.</p>
            <div style="text-align: center; margin: 30px 0;">
                <a href="{login_url}" style="display: inline-block; background: #3B82F6; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">Acessar minha conta</a>
            </div>
            <h3 style="color: #1f2937; margin-top: 30px;">Próximos passos:</h3>
            <ul style="color: #4b5563; padding-left: 20px;">
                <li>Conecte suas plataformas (Hotmart, Kiwify, Payt)</li>
                <li>Configure suas campanhas do Facebook Ads</li>
                <li>Ative notificações de vendas em tempo real</li>
                <li>Explore os relatórios automáticos da IA</li>
            </ul>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
            <p style="color: #9ca3af; font-size: 12px;">Precisa de ajuda? Responda este email ou acesse nossa documentação.</p>
            <p style="color: #9ca3af; font-size: 12px;">Equipe LomusTrack</p>
        </div>
    </body>
    </html>
    """
    text = f"Bem-vindo ao LomusTrack, {name}!\n\nSua conta foi criada com sucesso.\nAcesse: {login_url}\n\nEquipe LomusTrack"

    return _send_email(to, subject, html, text)


def send_signup_code_email(to: str, code: str, name: str = "") -> bool:
    """Envia código de verificação para cadastro."""
    subject = "Seu código de verificação - LomusTrack"
    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">LomusTrack</h1>
        </div>
        <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb; border-top: none;">
            <h2 style="color: #1f2937; margin-top: 0;">Verificação de email</h2>
            <p style="color: #4b5563;">Olá{f' {name}' if name else ''},</p>
            <p style="color: #4b5563;">Use o código abaixo para verificar seu email:</p>
            <div style="text-align: center; margin: 30px 0;">
                <div style="display: inline-block; background: #f3f4f6; border: 2px dashed #3B82F6; border-radius: 12px; padding: 20px 40px;">
                    <span style="font-size: 32px; font-weight: 700; color: #1D4ED8; letter-spacing: 8px; font-family: 'Courier New', monospace;">{code}</span>
                </div>
            </div>
            <p style="color: #6b7280; font-size: 14px;">Este código expira em 10 minutos.</p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
            <p style="color: #9ca3af; font-size: 12px;">Se você não solicitou este código, ignore este email.</p>
            <p style="color: #9ca3af; font-size: 12px;">Equipe LomusTrack</p>
        </div>
    </body>
    </html>
    """
    text = f"Seu código de verificação LomusTrack: {code}\n\nExpira em 10 minutos."

    return _send_email(to, subject, html, text)


def send_info_email(to: str, subject: str, message: str, cta_text: Optional[str] = None, cta_url: Optional[str] = None) -> bool:
    """Envia email informativo genérico."""
    cta_html = ""
    if cta_text and cta_url:
        cta_html = f"""
        <div style="text-align: center; margin: 30px 0;">
            <a href="{cta_url}" style="display: inline-block; background: #3B82F6; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">{cta_text}</a>
        </div>
        """

    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">LomusTrack</h1>
        </div>
        <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb; border-top: none;">
            <h2 style="color: #1f2937; margin-top: 0;">{subject}</h2>
            <div style="color: #4b5563; white-space: pre-line;">{message}</div>
            {cta_html}
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
            <p style="color: #9ca3af; font-size: 12px;">Equipe LomusTrack</p>
        </div>
    </body>
    </html>
    """
    text = f"{subject}\n\n{message}"

    return _send_email(to, subject, html, text)