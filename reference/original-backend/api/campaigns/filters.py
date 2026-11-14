from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database.core.connection import get_db
from database.models.product import Product
from database.models.transaction import Transaction
from api.auth.deps import get_company_id

router = APIRouter(prefix="/campaigns", tags=["campaigns"])


@router.get("/filter-options")
def campaign_filter_options(
    db: Session = Depends(get_db),
    company_id: int = Depends(get_company_id),
):
    """Opções dinâmicas para os filtros de campanhas."""
    products = (
        db.query(Product.id, Product.name)
        .filter(Product.company_id == company_id)
        .order_by(Product.name)
        .all()
    )
    platforms = (
        db.query(Transaction.platform)
        .filter(
            Transaction.company_id == company_id,
            Transaction.platform.isnot(None),
        )
        .distinct()
        .all()
    )

    platform_labels = {"kiwify": "Kiwify", "payt": "PayT", "hotmart": "Hotmart", "api": "API"}

    return {
        "products": [{"id": p.id, "name": p.name} for p in products],
        "platforms": [
            {"value": p[0].value, "label": platform_labels.get(p[0].value, p[0].value)}
            for p in platforms
        ],
    }
