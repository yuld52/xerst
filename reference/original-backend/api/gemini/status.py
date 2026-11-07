"""
Endpoint para verificar o status da configuração do Gemini.
Retorna se há contas configuradas e qual está ativa.
"""
from fastapi import APIRouter, Depends
from api.auth.deps import get_current_user
from ai.openrouter_config import get_openrouter_config

router = APIRouter(prefix="/gemini", tags=["gemini"])


@router.get("/status")
def get_gemini_status(_=Depends(get_current_user)):
    """
    Retorna o status da configuração do Gemini:
    - Se há conta configurada
    - Quantas contas existem
    - Qual modelo está ativo
    """
    api_key, model = get_openrouter_config()
    return {
        "configured": bool(api_key),
        "account_count": 1 if api_key else 0,
        "active_model": model if api_key else None,
        "active_account_name": "OpenRouter global" if api_key else None,
    }
