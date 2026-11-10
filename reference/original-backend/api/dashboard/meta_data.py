"""
Busca dados da Meta Ads para o dashboard.
Suporta múltiplas contas de anúncios da empresa, agregando métricas e campanhas.
Captura erros de autenticação e invalida tokens no banco.
"""
import asyncio
import logging
from typing import Optional
from sqlalchemy.orm import Session

from database.models.facebook_account import FacebookAccount
from integrations.meta_ads.service import MetaAdsService
from integrations.meta_ads.client import MetaAuthError
from integrations.meta_ads.schemas import AccountInsightsSummary, CampaignInsights

logger = logging.getLogger(__name__)


def get_fb_accounts(db: Session, company_id: Optional[int] = None) -> list[FacebookAccount]:
    """Retorna todas as contas FB válidas e ativas da empresa (ou globais caso company_id seja None)."""
    q = db.query(FacebookAccount).filter(
        FacebookAccount.token_valid.is_(True),
        FacebookAccount.is_active != False,
    )
    if company_id is not None:
        q = q.filter(FacebookAccount.company_id == company_id)
    return q.all()


def _mark_token_invalid(db: Session, account: FacebookAccount) -> None:
    """Marca a conta como token inválido para suprimir futuras chamadas."""
    account.token_valid = False
    db.commit()
    logger.warning(
        f"Token da conta Facebook '{account.label}' ({account.account_id}) "
        "marcado como inválido. Atualize o token na página de integrações."
    )


async def fetch_meta_account_summary(
    db: Session,
    date_start: str,
    date_end: str,
    company_id: Optional[int] = None,
) -> tuple[Optional[AccountInsightsSummary], Optional[str]]:
    """
    Busca métricas agregadas de TODAS as contas Meta Ads ativas da empresa.
    Retorna (summary_combinado, error_message).
    """
    accounts = get_fb_accounts(db, company_id)
    if not accounts:
        # Verifica se existe conta mas com token inválido
        q_inv = db.query(FacebookAccount).filter(FacebookAccount.token_valid.is_(False))
        if company_id is not None:
            q_inv = q_inv.filter(FacebookAccount.company_id == company_id)
        if q_inv.first():
            return None, "token_invalid"
        return None, None

    combined_summary = AccountInsightsSummary()
    has_success = False
    auth_errors = []

    async def _fetch_one(acc: FacebookAccount):
        service = MetaAdsService(acc.access_token, acc.account_id, currency=acc.currency or "BRL")
        if not acc.currency:
            try:
                detected = await service.detect_currency()
                if detected:
                    acc.currency = detected
                    db.commit()
            except Exception:
                pass
        try:
            summary = await service.get_account_summary(date_start, date_end)
            return summary, None
        except MetaAuthError:
            _mark_token_invalid(db, acc)
            return None, "token_invalid"
        except Exception as e:
            logger.error(f"Erro ao buscar account summary da Meta para conta {acc.id}: {e}")
            return None, str(e)
        finally:
            await service.close()

    tasks = [_fetch_one(acc) for acc in accounts]
    results = await asyncio.gather(*tasks)

    for summary, err in results:
        if err == "token_invalid":
            auth_errors.append(err)
        if summary:
            has_success = True
            combined_summary.spend += summary.spend
            combined_summary.clicks += summary.clicks
            combined_summary.impressions += summary.impressions
            combined_summary.landing_page_views += summary.landing_page_views
            combined_summary.initiate_checkout += summary.initiate_checkout

    if not has_success and auth_errors and len(auth_errors) == len(accounts):
        return None, "token_invalid"

    if has_success:
        combined_summary.spend = round(combined_summary.spend, 2)
        combined_summary.cpc = (
            round(combined_summary.spend / combined_summary.clicks, 2)
            if combined_summary.clicks > 0
            else 0.0
        )
        combined_summary.ctr = (
            round((combined_summary.clicks / combined_summary.impressions) * 100, 2)
            if combined_summary.impressions > 0
            else 0.0
        )
        return combined_summary, None

    return None, None


async def fetch_meta_campaigns_for_dashboard(
    db: Session,
    date_start: str,
    date_end: str,
    company_id: Optional[int] = None,
) -> list[CampaignInsights]:
    """Busca campanhas de TODAS as contas Meta Ads para top campaigns e gráfico diário."""
    accounts = get_fb_accounts(db, company_id)
    if not accounts:
        return []

    all_campaigns: list[CampaignInsights] = []

    async def _fetch_one_camps(acc: FacebookAccount):
        service = MetaAdsService(acc.access_token, acc.account_id, currency=acc.currency or "BRL")
        try:
            camps = await service.get_campaigns(date_start, date_end)
            for c in camps:
                c.account_id = str(acc.id)
                c.account_name = acc.label
            return camps
        except MetaAuthError:
            _mark_token_invalid(db, acc)
            return []
        except Exception as e:
            logger.error(f"Erro ao buscar campanhas da Meta para conta {acc.id}: {e}")
            return []
        finally:
            await service.close()

    tasks = [_fetch_one_camps(acc) for acc in accounts]
    results = await asyncio.gather(*tasks)

    for camps in results:
        all_campaigns.extend(camps)

    return all_campaigns
