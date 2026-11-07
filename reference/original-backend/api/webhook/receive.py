import logging
from fastapi import APIRouter, Request, HTTPException, Depends
from sqlalchemy.orm import Session
from datetime import datetime

from database.core.connection import get_db
from database.models.webhook_endpoint import WebhookEndpoint, WebhookPlatform
from database.models.api_credential import ApiCredential
from database.models.webhook_delivery import WebhookDelivery
from integrations.webhook.hotmart import parse_hotmart_webhook
from integrations.webhook.kiwify import parse_kiwify_webhook
from integrations.webhook.payt import parse_payt_webhook
from integrations.webhook.api_direct import parse_api_webhook
from integrations.webhook.processor import process_webhook_event
from integrations.webhook.test_emails import is_test_email

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/webhook", tags=["webhook-receiver"])

PARSERS = {
    WebhookPlatform.HOTMART: parse_hotmart_webhook,
    WebhookPlatform.KIWIFY: parse_kiwify_webhook,
    WebhookPlatform.PAYT: parse_payt_webhook,
    WebhookPlatform.API: parse_api_webhook,
}


@router.post("/{platform}/{slug}")
async def receive_webhook(
    platform: str,
    slug: str,
    request: Request,
    db: Session = Depends(get_db),
):
    """
    Endpoint público que recebe os POSTs das plataformas de pagamento.
    Não requer autenticação — as plataformas enviam direto.
    URL: POST /api/webhook/hotmart/{slug} | /api/webhook/api/{slug}
    """
    # Validar plataforma
    platform_lower = platform.lower()
    try:
        platform_enum = WebhookPlatform(platform_lower)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Plataforma '{platform}' inválida")

    # Buscar o endpoint pelo slug + plataforma
    endpoint = (
        db.query(WebhookEndpoint)
        .filter(
            WebhookEndpoint.slug == slug,
            WebhookEndpoint.platform == platform_enum,
        )
        .first()
    )

    if not endpoint:
        raise HTTPException(
            status_code=404,
            detail=f"Webhook endpoint '{slug}' não encontrado para '{platform}'",
        )
    if endpoint.company_id is None:
        raise HTTPException(status_code=409, detail="Este webhook não está vinculado a uma conta válida.")

    # A integração API direta exige a credencial criada na conta correta.
    credential = None
    if platform_enum == WebhookPlatform.API:
        authorization = request.headers.get("authorization", "")
        supplied_token = authorization.removeprefix("Bearer ").strip() if authorization else request.headers.get("x-api-key", "").strip()
        if not supplied_token:
            raise HTTPException(status_code=401, detail="Envie a credencial no header Authorization: Bearer <token>")
        credential = db.query(ApiCredential).filter(
            ApiCredential.token_hash == ApiCredential.hash_token(supplied_token),
            ApiCredential.company_id == endpoint.company_id,
            ApiCredential.is_active.is_(True),
        ).first()
        if not credential:
            raise HTTPException(status_code=401, detail="Credencial inválida ou pertencente a outra conta")
        credential.last_used_at = datetime.utcnow()

    # Ler o body do POST
    try:
        payload = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Payload JSON inválido")

    logger.info(f"Webhook recebido: {platform}/{slug} | Endpoint: {endpoint.name}")

    # Parsear com o parser correto
    parser = PARSERS.get(platform_enum)
    if not parser:
        raise HTTPException(status_code=400, detail="Parser não disponível")

    delivery = WebhookDelivery(
        endpoint_id=endpoint.id,
        company_id=endpoint.company_id,
        platform=platform_enum.value,
        slug=slug,
        status="received",
        payload=payload,
    )
    db.add(delivery)
    db.flush()

    event = parser(payload)
    if not event:
        delivery.status = "error"
        delivery.http_status = 422
        delivery.error_message = "Não foi possível processar o payload recebido"
        db.commit()
        raise HTTPException(
            status_code=422,
            detail="Não foi possível processar o payload recebido",
        )

    # Ignorar emails de teste das plataformas (PayT: yoda@testsuser.com, Kiwify: johndoe@example.com)
    if is_test_email(event.customer_email):
        logger.info(f"Webhook ignorado: email de teste ({event.customer_email})")
        delivery.status = "ignored"
        delivery.http_status = 200
        delivery.processed_at = datetime.utcnow()
        db.commit()
        return {"status": "ok", "message": "Webhook de teste ignorado"}

    # Injetar o slug do endpoint para identificar a conta de origem
    event.webhook_slug = slug

    # Obter company_id do webhook endpoint (multi-tenant)
    company_id = endpoint.company_id

    # Processar o evento (salvar transação, customer, etc.)
    try:
        transaction = process_webhook_event(db, event, company_id=company_id)
        delivery.status = "processed"
        delivery.http_status = 200
        delivery.transaction_id = getattr(transaction, "id", None)
        delivery.processed_at = datetime.utcnow()
        db.commit()
    except Exception as exc:
        db.rollback()
        delivery = WebhookDelivery(
            endpoint_id=endpoint.id, company_id=endpoint.company_id,
            platform=platform_enum.value, slug=slug, status="error",
            http_status=500, error_message=str(exc)[:1000], payload=payload,
        )
        db.add(delivery)
        db.commit()
        logger.exception("Falha ao processar webhook")
        raise HTTPException(status_code=500, detail="Falha ao processar webhook")

    return {"status": "ok", "message": "Webhook processado com sucesso"}
