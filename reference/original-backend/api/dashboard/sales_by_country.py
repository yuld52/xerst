from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import date
from typing import Optional
from database.session import get_db
from database.models.transaction import Transaction  # adjust import path as needed
from auth.dependencies import get_current_user

router = APIRouter()

@router.get("/dashboard/sales-by-country")
def sales_by_country(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """
    Returns sales aggregated by buyer country.
    Buyer country is read from Transaction.customer_country (or similar field).
    If the field does not exist on the model, add it as a nullable String column.
    """
    q = (
        db.query(
            # NOTE: replace 'customer_country' with the actual column name
            # from the Transaction model if it differs.
            Transaction.customer_country.label("country_code"),
            func.count(Transaction.id).label("sales"),
            func.sum(Transaction.amount).label("revenue"),
        )
        .filter(Transaction.user_id == current_user.id)
        .filter(Transaction.status == "approved")
    )
    if start_date:
        q = q.filter(Transaction.created_at >= start_date)
    if end_date:
        q = q.filter(Transaction.created_at <= end_date)
    q = q.group_by(Transaction.customer_country).order_by(func.count(Transaction.id).desc())

    # Map ISO code to display name (extend as needed)
    COUNTRY_NAMES = {
        "BR": "Brasil", "PT": "Portugal", "AO": "Angola", "MZ": "Moçambique",
        "US": "Estados Unidos", "DE": "Alemanha", "FR": "França", "ES": "Espanha",
        "GB": "Reino Unido", "AR": "Argentina", "CO": "Colômbia", "MX": "México",
    }

    return [
        {
            "country_code": row.country_code or "XX",
            "country_name": COUNTRY_NAMES.get(row.country_code or "", row.country_code or "Desconhecido"),
            "sales": row.sales,
            "revenue": float(row.revenue or 0),
        }
        for row in q.all()
        if row.country_code  # skip null/empty country
    ]
