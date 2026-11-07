"""
Endpoint para verificar o status da configuração do Gemini.
Retorna se há contas configuradas e qual está ativa.
"""
from fastapi import APIRouter, Depends
from database.core.connection import get_db
from api.auth.deps import get_company_id
from ai.openrouter_config import get_openrouter_config

router = APIRouter(prefix="/gemini", tags=["gemini"])


@router.get("/status")
def get_gemini_status(
    db=Depends(get_db),
    company_id: int = Depends(get_company_id),
):
    """
    Retorna o status da configuração do Gemini:
    - Se há conta configurada
    - Quantas contas existem
    - Qual modelo está ativo
    """
    # Por enquanto, GeminiAccount não tem company_id (migração futura)
    # Então vamos buscar todas e retornar a primeira
    api_key, model = get_openrouter_config()
    return {
        "configured": bool(api_key),
        "account_count": 1 if api_key else 0,
        "active_model": model if api_key else None,
        "active_account_name": "OpenRouter global" if api_key else None,
    }
