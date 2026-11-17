from sqlalchemy import Column, Integer, String, Text, DateTime, UniqueConstraint
from database.core.connection import Base
from database.core.timezone import CREATED_AT_DEFAULT, UPDATED_AT_DEFAULT


class Product(Base):
    """
    Produto cadastrado pelo CEO.
    Um produto pode ter checkouts em múltiplas plataformas.
    """
    __tablename__ = "products"
    __table_args__ = (UniqueConstraint("company_id", "name", name="uq_products_company_name"),)

    id = Column(Integer, primary_key=True, autoincrement=True)
    company_id = Column(Integer, nullable=True, index=True)  # Multi-tenant
    name = Column(String(255), nullable=False)
    logo_url = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=CREATED_AT_DEFAULT)
    updated_at = Column(
        DateTime,
        server_default=UPDATED_AT_DEFAULT,
        onupdate=UPDATED_AT_DEFAULT,
    )
