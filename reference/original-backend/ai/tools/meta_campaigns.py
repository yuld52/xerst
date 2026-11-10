"""
Tool: Busca métricas do Meta Ads (campanhas, conjuntos, anúncios).
"""
import asyncio
from langchain_core.tools import tool

from database.core.connection import SessionLocal
from database.models.facebook_account import FacebookAccount
from integrations.meta_ads.service import MetaAdsService
from database.core.timezone import now_sp
from datetime import timedelta


def _get_active_fb_accounts(db):
    """Obtém todas as contas do Facebook válidas e ativas."""
    return db.query(FacebookAccount).filter(
        FacebookAccount.token_valid.is_(True),
        FacebookAccount.is_active != False,
    ).all()


@tool
def query_meta_campaigns(
    days_back: int = 30,
    level: str = "campaign",
    status: str = "all",
) -> str:
    """Busca métricas do Meta Ads: campanhas, conjuntos ou anúncios com spend, CPC, CTR.
    Agrega dados de todas as contas ativas conectadas.
    Use para responder sobre performance de campanhas, gastos, cliques, impressões.

    Args:
        days_back: Quantidade de dias para trás (default 30)
        level: Nível de detalhe: campaign, adset, ad
        status: status (active ou all)
    """
    db = SessionLocal()
    try:
        accounts = _get_active_fb_accounts(db)
        if not accounts:
            return "⚠️ Nenhuma conta do Facebook Ads configurada."

        now = now_sp()
        date_end = now.strftime("%Y-%m-%d")
        date_start = (now - timedelta(days=days_back)).strftime("%Y-%m-%d")

        async def _fetch_from_all():
            tasks = []
            services = []
            for acc in accounts:
                svc = MetaAdsService(acc.access_token, acc.account_id, currency=acc.currency or "BRL")
                services.append(svc)
                if level == "adset":
                    tasks.append(svc.get_adsets(date_start, date_end))
                elif level == "ad":
                    tasks.append(svc.get_ads(date_start, date_end))
                else:
                    tasks.append(svc.get_campaigns(date_start, date_end))
            try:
                results = await asyncio.gather(*tasks, return_exceptions=True)
                combined = []
                for res in results:
                    if isinstance(res, list):
                        combined.extend(res)
                return combined
            finally:
                for svc in services:
                    await svc.close()

        loop = asyncio.new_event_loop()
        try:
            data = loop.run_until_complete(_fetch_from_all())
        finally:
            loop.close()

        if not data:
            return f"Nenhum dado encontrado no nível '{level}' nos últimos {days_back} dias."

        if status == "active":
            data = [i for i in data if getattr(i, "status", "") == "active"]

        if not data:
            return f"Nenhum dado encontrado no nível '{level}' (filtro: {status})."

        # Ordena por spend desc
        data.sort(key=lambda x: x.spend, reverse=True)

        lines = [f"📊 Meta Ads — {level.upper()} (últimos {days_back} dias):\n"]
        total_spend = 0

        for item in data[:15]:
            total_spend += item.spend
            status_icon = "(ATIVA) 🟢" if getattr(item, "status", "") == "active" else "(DESATIVADA) 🟡"
            lines.append(
                f"{status_icon} {item.name}\n"
                f"   Spend: R$ {item.spend:,.2f} | Clicks: {item.clicks} | "
                f"CPC: R$ {item.cpc:,.2f} | CTR: {item.ctr:.2f}%\n"
                f"   LPV: {item.landing_page_views} | "
                f"Init Checkout: {item.initiate_checkout} | "
                f"Connect Rate: {item.connect_rate:.1f}%"
            )

        lines.append(f"\nTotal Spend: R$ {total_spend:,.2f}")
        lines.append(f"Total itens: {len(data)}")
        return "\n".join(lines)
    finally:
        db.close()
