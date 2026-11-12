from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database.core.connection import get_db
from database.models.transaction import Transaction
from database.models.customer import Customer
from database.models.customer_product import CustomerProduct
from database.models.product import Product
from database.models.product_alias import ProductAlias
from database.models.product_items import Checkout, OrderBump, Upsell
from api.auth.deps import require_role

router = APIRouter(prefix="/advanced-settings", tags=["advanced-settings"])


@router.delete("/reset-sales")
def reset_sales(
    db: Session = Depends(get_db),
    user=Depends(require_role("owner")),
):
    company_id = user.company_id
    if not company_id:
        raise HTTPException(status_code=400, detail="Empresa não identificada")

    try:
        # IDs de produtos da empresa
        product_ids = [p.id for p in db.query(Product.id).filter(Product.company_id == company_id).all()]
        # IDs de clientes da empresa
        customer_ids = [c.id for c in db.query(Customer.id).filter(Customer.company_id == company_id).all()]

        # 1. Filhos de customers da empresa
        if customer_ids:
            db.query(CustomerProduct).filter(
                CustomerProduct.customer_id.in_(customer_ids)
            ).delete(synchronize_session=False)

        # 2. Transactions da empresa
        db.query(Transaction).filter(
            Transaction.company_id == company_id
        ).delete(synchronize_session=False)

        # 3. Customers da empresa
        db.query(Customer).filter(
            Customer.company_id == company_id
        ).delete(synchronize_session=False)

        # 4. Filhos de products da empresa
        if product_ids:
            db.query(ProductAlias).filter(
                ProductAlias.product_id.in_(product_ids)
            ).delete(synchronize_session=False)
            db.query(Checkout).filter(
                Checkout.product_id.in_(product_ids)
            ).delete(synchronize_session=False)
            db.query(OrderBump).filter(
                OrderBump.product_id.in_(product_ids)
            ).delete(synchronize_session=False)
            db.query(Upsell).filter(
                Upsell.product_id.in_(product_ids)
            ).delete(synchronize_session=False)

        # 5. Products da empresa
        db.query(Product).filter(
            Product.company_id == company_id
        ).delete(synchronize_session=False)

        db.commit()

        return {"success": True}
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500, detail=f"Erro ao resetar vendas: {str(e)}"
        )
