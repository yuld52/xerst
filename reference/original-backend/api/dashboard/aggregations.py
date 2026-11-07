"""
Agregações para o dashboard: revenue diário, plataformas, vendas por hora.
"""
from sqlalchemy import func, extract
from datetime import datetime, timedelta

from database.models.transaction import Transaction, TransactionStatus
from integrations.meta_ads.schemas import CampaignInsights


def _daily_revenue(base, db, meta_campaigns: list[CampaignInsights] = None,
                   date_start: str = None, date_end: str = None):
    """Agrupa revenue/profit por dia, incluindo spend da Meta Ads."""
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

    # Calcular spend total da Meta para distribuir proporcionalmente por dia
    total_meta_spend = sum(c.spend for c in meta_campaigns) if meta_campaigns else 0
    total_revenue_all = sum(float(r.revenue or 0) for r in rows)

    result = []
    for r in rows:
        rev = float(r.revenue or 0)
        # Distribuir spend proporcionalmente à receita de cada dia
        if total_meta_spend > 0 and total_revenue_all > 0:
            day_spend = total_meta_spend * (rev / total_revenue_all)
        elif total_meta_spend > 0 and len(rows) > 0:
            day_spend = total_meta_spend / len(rows)
        else:
            day_spend = 0

        result.append({
            "date": str(r.day),
            "revenue": rev,
            "spend": round(day_spend, 2),
            "profit": round(rev - day_spend, 2),
            "sales": int(r.sales or 0),
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
