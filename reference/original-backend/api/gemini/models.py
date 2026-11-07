"""Endpoint para listar modelos disponíveis no OpenRouter."""
from fastapi import APIRouter, Depends, Query, HTTPException
import httpx

from api.auth.deps import get_current_user

router = APIRouter(prefix="/gemini", tags=["gemini"])

OPENROUTER_MODELS_URL = "https://openrouter.ai/api/v1/models"


@router.get("/models")
async def list_gemini_models(
    api_key: str = Query(...),
    _=Depends(get_current_user),
):
    """Lista modelos disponíveis para a chave OpenRouter fornecida."""
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(
                OPENROUTER_MODELS_URL,
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "HTTP-Referer": "https://lomustrack.app",
                    "X-Title": "LomusTrack",
                },
            )

        if resp.status_code != 200:
            raise HTTPException(status_code=400, detail="API Key inválida ou erro na API do OpenRouter")

        data = resp.json()
        result = []
        for model in data.get("data", []):
            model_id = model.get("id", "")
            if model_id:
                result.append({
                    "id": model_id,
                    "name": model.get("name", model_id),
                    "description": model.get("description", ""),
                })
        return result
    except httpx.HTTPError as e:
        raise HTTPException(status_code=400, detail=f"Erro de conexão: {str(e)}")
