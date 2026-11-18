import math
from typing import Any, Dict, Optional
import logging
from integrations.webhook.schemas import StandardizedWebhookEvent
from database.models.transaction import TransactionStatus, PaymentPlatform
from services.currency import normalize_currency_code, RATES_TO_MZN

logger = logging.getLogger(__name__)


def parse_api_webhook(payload: Dict[str, Any]) -> Optional[StandardizedWebhookEvent]:
    """
    Parser para a integração via API direta.
    O payload já deve ser enviado no formato padronizado (StandardizedWebhookEvent),
    portanto apenas valida e converte os campos sem nenhuma transformação.

    POST /api/webhook/api/{slug}
    Body: ver example_api.json na raiz do projeto
    """
    try:
        required_text_fields = (
            "external_id",
            "status",
            "product_external_id",
            "product_name",
            "customer_email",
        )
        if any(not isinstance(payload.get(field), str) or not payload[field].strip() for field in required_text_fields):
            raise ValueError("Campos obrigatórios ausentes ou vazios")

        external_id = payload["external_id"].strip()
        product_external_id = payload["product_external_id"].strip()
        product_name = payload["product_name"].strip()
        customer_email = payload["customer_email"].strip()
        if len(external_id) > 255 or len(product_name) > 255 or len(customer_email) > 255:
            raise ValueError("Um ou mais campos excedem o tamanho máximo aceito")

        status_raw = payload["status"].strip().lower()
        try:
            status = TransactionStatus(status_raw)
        except ValueError as exc:
            raise ValueError("Status inválido. Use approved, pending, refunded, chargeback ou trial") from exc

        raw_amount = payload.get("amount")
        if isinstance(raw_amount, bool) or raw_amount is None:
            raise ValueError("amount deve ser um número")
        amount = float(raw_amount)
        if not math.isfinite(amount) or amount < 0:
            raise ValueError("amount deve ser um número finito maior ou igual a zero")

        currency = normalize_currency_code(payload.get("currency") or "BRL")
        if currency not in RATES_TO_MZN:
            raise ValueError("Moeda não suportada. Use BRL, USD, EUR, MZN, MT, ZAR ou AOA")

        raw_product_price = payload.get("product_price", amount)
        if isinstance(raw_product_price, bool) or raw_product_price is None:
            raise ValueError("product_price deve ser um número")
        product_price = float(raw_product_price)
        if not math.isfinite(product_price) or product_price < 0:
            raise ValueError("product_price deve ser um número finito maior ou igual a zero")

        return StandardizedWebhookEvent(
            external_id=external_id,
            platform=PaymentPlatform.API,
            status=status,
            amount=amount,
            currency=currency,
            product_external_id=product_external_id,
            product_name=product_name,
            product_price=product_price,
            customer_email=customer_email,
            payment_method=payload.get("payment_method"),
            customer_name=payload.get("customer_name"),
            customer_cpf=payload.get("customer_cpf"),
            customer_phone=payload.get("customer_phone"),
            utm_source=payload.get("utm_source"),
            utm_medium=payload.get("utm_medium"),
            utm_campaign=payload.get("utm_campaign"),
            utm_content=payload.get("utm_content"),
            utm_term=payload.get("utm_term"),
            src=payload.get("src"),
            checkout_url=payload.get("checkout_url"),
            order_bumps=payload.get("order_bumps", []),
        )

    except Exception as e:
        logger.error(f"Erro ao parsear webhook via API direta: {e}", exc_info=True)
        return None
