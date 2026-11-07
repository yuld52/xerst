import csv
import io
import logging
import unicodedata

from integrations.csv_import.schemas import ImportRow

logger = logging.getLogger(__name__)

HOTMART_STATUS_MAP = {
    "approved": "approved",
    "purchase_approved": "approved",
    "completed": "approved",
    "refunded": "refunded",
    "purchase_refunded": "refunded",
    "chargeback": "chargeback",
    "purchase_chargeback": "chargeback",
    "pending": "pending",
    "waiting_payment": "pending",
    "canceled": "pending",
    "cancelled": "pending",
}


def _normalize(value: str) -> str:
    value = unicodedata.normalize("NFKD", value or "")
    return "".join(char for char in value if not unicodedata.combining(char)).strip().lower()


def _safe_float(value: str | None) -> float:
    if not value:
        return 0.0
    raw = value.strip().replace("R$", "").replace("MT", "").replace(" ", "")
    try:
        if "," in raw and "." in raw:
            raw = raw.replace(".", "").replace(",", ".")
        else:
            raw = raw.replace(",", ".")
        return float(raw)
    except ValueError:
        return 0.0


def _value(row: dict[str, str], *names: str) -> str:
    normalized = {_normalize(key): value for key, value in row.items() if key}
    for name in names:
        value = normalized.get(_normalize(name), "")
        if value and value.strip():
            return value.strip()
    return ""


def parse_hotmart_csv(file_content: bytes) -> list[ImportRow]:
    """Parseia exportações de vendas da Hotmart em CSV.

    A Hotmart oferece nomes de colunas diferentes conforme o idioma do painel;
    por isso o parser aceita aliases em português e inglês.
    """
    text = file_content.decode("utf-8-sig", errors="replace")
    sample = text[:4096]
    try:
        delimiter = csv.Sniffer().sniff(sample, delimiters=";,\t,").delimiter
    except csv.Error:
        delimiter = ";" if ";" in sample else ","

    reader = csv.DictReader(io.StringIO(text), delimiter=delimiter)
    rows: list[ImportRow] = []

    for raw in reader:
        product_name = _value(raw, "Produto", "Product", "Nome do produto", "Product name")
        if not product_name:
            continue

        status_raw = _normalize(_value(raw, "Status", "Event", "Evento", "Transaction status"))
        status = HOTMART_STATUS_MAP.get(status_raw, "pending")
        amount = _safe_float(_value(raw, "Valor", "Amount", "Preço", "Price", "Net amount"))
        product_id = _value(raw, "Código do produto", "Product ID", "Product code") or product_name
        external_id = _value(raw, "Transação", "Transaction", "Transaction ID", "ID da venda", "Purchase ID")

        rows.append(ImportRow(
            external_id=external_id,
            status=status,
            product_name=product_name,
            product_external_id=product_id,
            product_ticket=_safe_float(_value(raw, "Preço", "Price", "Product price")) or amount,
            amount=amount,
            customer_name=_value(raw, "Nome", "Name", "Nome do comprador") or None,
            customer_email=_value(raw, "E-mail", "Email", "Buyer email"),
            customer_phone=_value(raw, "Telefone", "Phone", "Buyer phone") or None,
            checkout_name=_value(raw, "Oferta", "Offer", "Offer name") or None,
            utm_source=_value(raw, "UTM Source", "utm_source") or None,
            utm_medium=_value(raw, "UTM Medium", "utm_medium") or None,
            utm_campaign=_value(raw, "UTM Campaign", "utm_campaign") or None,
            utm_content=_value(raw, "UTM Content", "utm_content") or None,
            utm_term=_value(raw, "UTM Term", "utm_term") or None,
            created_at=_value(raw, "Data da transação", "Transaction date", "Date") or None,
        ))

    logger.info("Hotmart CSV: %s linhas parseadas", len(rows))
    return rows

