"""
Endpoint de chat com a AI — recebe pergunta e retorna resposta do agente.
"""
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel
import json
import asyncio

from database.core.connection import get_db
from database.models.company import CompanySettings
from api.auth.deps import get_company_id
from api.campaigns.actions import fetch_learning_data
from ai.service import run_agent
from ai.openrouter_config import get_openrouter_config

router = APIRouter(prefix="/gemini", tags=["gemini"])


class ChatRequest(BaseModel):
    message: str
    history: list[dict] = []
    account_id: int | None = None
    page_context: str | None = None


class ChatResponse(BaseModel):
    response: str


@router.post("/chat", response_model=ChatResponse)
async def chat_with_ai(
    payload: ChatRequest,
    db: Session = Depends(get_db),
    company_id: int = Depends(get_company_id),
):
    """Envia mensagem para a AI e retorna resposta."""
    api_key, model = get_openrouter_config()
    if not api_key:
        raise HTTPException(
            status_code=400,
            detail="OPENROUTER_API_KEY não configurada no servidor."
        )

    # Buscar instruções personalizadas do usuário
    settings = db.query(CompanySettings).filter(
        CompanySettings.company_id == company_id,
    ).first()
    ai_instructions = settings.ai_instructions if settings else None

    # Buscar dados de aprendizado (ações do CEO)
    learning_data = fetch_learning_data(db, company_id=company_id)

    try:
        response = await run_agent(
            api_key=api_key,
            model=model,
            user_message=payload.message,
            history=payload.history,
            page_context=payload.page_context,
            ai_instructions=ai_instructions,
            learning_data=learning_data,
        )
        return ChatResponse(response=response)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro na AI: {str(e)}")
