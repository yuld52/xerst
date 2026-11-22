from sqlalchemy.orm import Session
from database.models.company import CompanySettings

def get_company_by_mcp_key(api_key: str, db: Session):
    """Look up CompanySettings by mcp_api_key where mcp_enabled=True."""
    return (
        db.query(CompanySettings)
        .filter(CompanySettings.mcp_api_key == api_key, CompanySettings.mcp_enabled == True)
        .first()
    )
