"""
Agregações para o dashboard: revenue diário, plataformas, vendas por hora.
"""
from sqlalchemy import func, extract
from datetime import datetime, timedelta

from database.models.transaction import Transaction, TransactionStatus
def _daily_revenue(base, db, meta_daily_spend: dict[str, float] | None = None,
                   date_start: str = None, date_end: str = None):
    """Agrupa vendas e gasto real da Meta por dia no intervalo selecionado."""
    approved = base.filter(Transaction.status == TransactionStatus.APPROVED)
    rows = (
        approved.with_entities(
            func.date(Transaction.created_at).label("day"),
            func.sum(Transaction.amount).label("revenue"),
            func.count(Transaction.id).label("sales"),
        )
        .group_by(func.date(Transaction.created_at))
        .order_by(func.date(Transaction.created_at))
        .all()
    )

    revenue_by_day = {str(row.day): row for row in rows}
    spend_by_day = meta_daily_spend or {}
    result = []
    try:
        first_day = datetime.strptime(date_start, "%Y-%m-%d").date()
        last_day = datetime.strptime(date_end, "%Y-%m-%d").date()
    except (TypeError, ValueError):
        first_day = min((row.day for row in rows), default=None)
        last_day = max((row.day for row in rows), default=None)

    days = []
    if first_day and last_day:
        current = first_day
        while current <= last_day:
            days.append(current.isoformat())
            current += timedelta(days=1)

    for day in days or sorted(revenue_by_day):
        row = revenue_by_day.get(day)
        rev = float(row.revenue or 0) if row else 0.0
        day_spend = float(spend_by_day.get(day, 0) or 0)
        result.append({
            "date": day,
            "revenue": rev,
            "spend": round(day_spend, 2),
            "profit": round(rev - day_spend, 2),
            "sales": int(row.sales or 0) if row else 0,
        })

    return result


def _platform_dist(base, db):
    """Distribuição de faturamento por plataforma."""
    approved = base.filter(Transaction.status == TransactionStatus.APPROVED)
    rows = (
        approved.with_entities(
            Transaction.platform,
            func.sum(Transaction.amount).label("value"),
            func.count(Transaction.id).label("sales"),
        )
        .group_by(Transaction.platform)
        .all()
    )
    colors = {"kiwify": "var(--color-chart-1)", "payt": "var(--color-chart-2)", "api": "var(--color-chart-3)"}
    labels = {"kiwify": "Kiwify", "payt": "PayT", "api": "API"}
    return [
        {
            "name": labels.get(r.platform.value, r.platform.value),
            "value": float(r.value or 0),
            "sales": int(r.sales or 0),
            "fill": colors.get(r.platform.value, "var(--color-chart-4)"),
        }
        for r in rows
    ]


def _payment_method_dist(base, db):
    """Distribuição do faturamento aprovado por método de pagamento."""
    approved = base.filter(Transaction.status == TransactionStatus.APPROVED)
    rows = (
        approved.with_entities(
            Transaction.payment_method,
            func.sum(Transaction.amount).label("value"),
        )
        .group_by(Transaction.payment_method)
        .all()
    )

    totals = {"Pix": 0.0, "Cartão": 0.0, "Boleto": 0.0, "Outros": 0.0}
    for row in rows:
        method = str(row.payment_method or "").strip().lower()
        if any(token in method for token in ("pix",)):
            label = "Pix"
        elif any(token in method for token in ("card", "cart", "credit", "debit", "credito", "debito")):
            label = "Cartão"
        elif any(token in method for token in ("boleto", "bank_slip", "bank slip", "slip")):
            label = "Boleto"
        else:
            label = "Outros"
        totals[label] += float(row.value or 0)

    return [{"name": name, "value": round(value, 2)} for name, value in totals.items()]


def _hourly_sales(base, db):
    """Vendas por hora do dia."""
    approved = base.filter(Transaction.status == TransactionStatus.APPROVED)
    rows = (
        approved.with_entities(
            extract("hour", Transaction.created_at).label("hour"),
            func.count(Transaction.id).label("sales"),
            func.sum(Transaction.amount).label("revenue"),
        )
        .group_by(extract("hour", Transaction.created_at))
        .order_by(extract("hour", Transaction.created_at))
        .all()
    )
    hour_map = {int(r.hour): r for r in rows}
    result = []
    for h in range(0, 24, 2):
        entry = hour_map.get(h)
        s1 = int(entry.sales) if entry else 0
        r1 = float(entry.revenue) if entry else 0
        entry2 = hour_map.get(h + 1)
        s2 = int(entry2.sales) if entry2 else 0
        r2 = float(entry2.revenue) if entry2 else 0
        result.append({
            "hour": f"{h:02d}h",
            "sales": s1 + s2,
            "revenue": r1 + r2,
        })
    return result
