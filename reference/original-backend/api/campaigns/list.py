"""
API principal de campanhas: cruza dados Meta Ads com transações do DB.
Retorna campanhas com métricas de Ad Spend + Vendas unificadas.
Suporta agregação de múltiplas contas do Facebook Ads da mesma empresa.
"""
import asyncio
import logging
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from api.auth.deps import get_company_id
from api.campaigns.merge import merge_campaigns
from database.core.connection import get_db
from database.models.facebook_account import FacebookAccount
from database.models.transaction import Transaction, TransactionStatus
from integrations.meta_ads.client import MetaAuthError
from integrations.meta_ads.schemas import AdInsights, AdSetInsights, CampaignInsights
from integrations.meta_ads.service import MetaAdsService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/campaigns", tags=["campaigns"])


@router.get("/data")
async def get_campaigns_data(
    date_start: str = Query(..., description="YYYY-MM-DD"),
    date_end: str = Query(..., description="YYYY-MM-DD"),
    account_id: Optional[int] = Query(None),
    status_filter: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    company_id: int = Depends(get_company_id),
):
    """
    Endpoint principal: busca dados do Meta Ads + transações.
    Cruza campanhas com vendas pelo utm_campaign (name|id).
    Se account_id for informado, filtra por essa conta.
    Se account_id não for informado, agrega os dados de TODAS as contas Meta Ads ativas da empresa.
    """
    fb_accounts = _get_fb_accounts(db, account_id, company_id)
    if not fb_accounts:
        # Se nenhuma conta válida existir, verifica se há contas com token inválido
        has_invalid = db.query(FacebookAccount).filter(
            FacebookAccount.company_id == company_id,
            FacebookAccount.token_valid.is_(False),
        ).first()
        err_msg = "token_invalid" if has_invalid else None
        return {
            "campaigns": [],
            "unidentified": _build_unidentified(db, date_start, date_end, company_id),
            "error": err_msg,
        }

    all_meta_campaigns: list[CampaignInsights] = []
    all_meta_adsets: list[AdSetInsights] = []
    all_meta_ads: list[AdInsights] = []
    auth_errors = []

    async def _fetch_one_account(acc: FacebookAccount):
        service = MetaAdsService(acc.access_token, acc.account_id, currency=acc.currency or "BRL")
        try:
            c, a, ads = await service.get_all_levels(date_start, date_end)
            for item in c:
                item.account_id = str(acc.id)
                item.account_name = acc.label
            for item in a:
                item.account_id = str(acc.id)
                item.account_name = acc.label
            for item in ads:
                item.account_id = str(acc.id)
                item.account_name = acc.label

            acc.last_sync_at = datetime.utcnow()
            return c, a, ads, None
        except MetaAuthError:
            acc.token_valid = False
            return [], [], [], "token_invalid"
        except Exception as e:
            logger.error(f"Erro ao buscar dados do Meta Ads para conta {acc.id}: {e}")
            return [], [], [], str(e)
        finally:
            await service.close()

    tasks = [_fetch_one_account(acc) for acc in fb_accounts]
    results = await asyncio.gather(*tasks)
    db.commit()

    for c, a, ads, err in results:
        if err == "token_invalid":
            auth_errors.append(err)
        all_meta_campaigns.extend(c)
        all_meta_adsets.extend(a)
        all_meta_ads.extend(ads)

    # Se todas as contas retornaram erro de autenticação e nenhuma campanha veio
    if auth_errors and not all_meta_campaigns and len(auth_errors) == len(fb_accounts):
        return {
            "campaigns": [],
            "unidentified": _build_unidentified(db, date_start, date_end, company_id),
            "error": "token_invalid",
        }

    # 3. Buscar transações aprovadas no período com utm_source=FB
    transactions = _get_fb_transactions(db, date_start, date_end, company_id)

    # 4. Fazer o merge
    campaigns = merge_campaigns(all_meta_campaigns, all_meta_adsets, all_meta_ads, transactions)

    # 5. Filtrar por status se necessário
    if status_filter and status_filter != "all":
        campaigns = [c for c in campaigns if c["status"] == status_filter]

    # 6. Vendas sem UTM (não identificadas)
    unidentified = _build_unidentified(db, date_start, date_end, company_id)

    return {"campaigns": campaigns, "unidentified": unidentified}


def _get_fb_accounts(db: Session, account_id: Optional[int], company_id: int) -> list[FacebookAccount]:
    """Retorna a conta FB selecionada ou TODAS ativas com token válido da empresa."""
    if account_id:
        acc = db.query(FacebookAccount).filter(
            FacebookAccount.id == account_id,
            FacebookAccount.company_id == company_id,
            FacebookAccount.token_valid.is_(True),
        ).first()
        return [acc] if acc else []
    return db.query(FacebookAccount).filter(
        FacebookAccount.company_id == company_id,
        FacebookAccount.token_valid.is_(True),
        FacebookAccount.is_active != False,
    ).all()


def _get_fb_transactions(db: Session, date_start: str, date_end: str, company_id: int) -> list[Transaction]:
    """Busca transações aprovadas no período."""
    query = db.query(Transaction).filter(
        Transaction.company_id == company_id,
        Transaction.status == TransactionStatus.APPROVED,
        Transaction.created_at >= date_start,
        Transaction.created_at <= f"{date_end} 23:59:59",
    )
    return query.all()


def _build_unidentified(db: Session, date_start: str, date_end: str, company_id: int) -> dict:
    """Vendas aprovadas sem utm_campaign (não atribuídas a nenhuma campanha)."""
    unid = db.query(Transaction).filter(
        Transaction.company_id == company_id,
        Transaction.status == TransactionStatus.APPROVED,
        Transaction.created_at >= date_start,
        Transaction.created_at <= f"{date_end} 23:59:59",
        (Transaction.utm_campaign.is_(None)) | (Transaction.utm_campaign == ""),
    ).all()

    revenue = sum(t.amount for t in unid)

    # Agrupar por produto para permitir filtro no frontend
    products_map: dict[str, dict] = {}
    for t in unid:
        pname = t.product_name or "Sem produto"
        if pname not in products_map:
            products_map[pname] = {"name": pname, "sales": 0, "revenue": 0.0}
        products_map[pname]["sales"] += 1
        products_map[pname]["revenue"] += t.amount

    return {
        "id": "unidentified",
        "name": "Não identificado",
        "status": "unidentified",
        "objective": "",
        "budget_type": "CBO",
        "sales": len(unid),
        "revenue": revenue,
        "profit": revenue,
        "spend": 0, "budget": 0, "clicks": 0, "impressions": 0,
        "cpc": 0, "ctr": 0, "cpa": 0, "roas": 0,
        "landing_page_views": 0, "initiate_checkout": 0,
        "connect_rate": 0, "no_id_sales": 0,
        "products": list(products_map.values()),
    }
