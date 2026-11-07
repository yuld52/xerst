import os
import uuid
from datetime import datetime, timedelta
from datetime import timezone as datetime_timezone
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from fastapi import APIRouter, Depends, Header, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from sqlalchemy import text

from ai.daily_report_data import collect_daily_data, format_daily_context
from ai.openrouter_config import get_openrouter_config
from ai.prompt import DAILY_REPORT_PROMPT
from ai.service import _build_user_instructions_block, _extract_text, build_llm_no_tools
from api.auth.deps import get_company_id
from api.campaigns.actions import record_campaign_action
from database.core.connection import get_db, engine
from database.core.timezone import now_sp
from database.models.audit_log import AuditLog
from database.models.campaign_action import ActionType
from database.models.campaign_rule import CampaignRule
from database.models.company import CompanySettings
from database.models.facebook_account import FacebookAccount
from database.models.notification_delivery import NotificationDelivery
from database.models.notification_retry import NotificationRetry
from database.models.push_subscription import PushSubscription
from integrations.meta_ads.manage import toggle_entity_status, update_budget
from integrations.meta_ads.service import MetaAdsService
from services.push_notifications import enqueue_notification_retry, push_service
from langchain_core.messages import HumanMessage, SystemMessage

router = APIRouter(tags=["automation"])


class CampaignRulePayload(BaseModel):
    id: str = Field(min_length=1, max_length=80)
    name: str = Field(min_length=2, max_length=120)
    product: str = "any"
    account: str = "all"
    scope: str = "active"
    nameFilter: str = "any"
    action: str
    conditions: list[dict]
    period: str = "today"
    frequency: str = "15m"
    interval: str = "any"
    dailyLimit: str = "none"
    actionValue: float = Field(default=10, ge=1, le=90)
    enabled: bool = True


class CampaignRuleUpdate(BaseModel):
    enabled: bool | None = None
    definition: CampaignRulePayload | None = None


@router.get("/campaigns/rules")
def list_campaign_rules(db: Session = Depends(get_db), company_id: int = Depends(get_company_id)):
    rows = db.query(CampaignRule).filter(CampaignRule.company_id == company_id).order_by(CampaignRule.id).all()
    return [{"id": row.rule_id, "enabled": row.enabled, "definition": row.definition} for row in rows]


@router.post("/campaigns/rules", status_code=201)
def create_campaign_rule(payload: CampaignRulePayload, db: Session = Depends(get_db), company_id: int = Depends(get_company_id)):
    if payload.action not in {"activate", "pause", "increase_budget", "decrease_budget"}:
        raise HTTPException(status_code=422, detail="Ação de regra inválida")
    if not payload.conditions:
        raise HTTPException(status_code=422, detail="Adicione ao menos uma condição")
    if db.query(CampaignRule).filter(CampaignRule.company_id == company_id, CampaignRule.rule_id == payload.id).first():
        raise HTTPException(status_code=409, detail="Já existe uma regra com esse identificador")
    row = CampaignRule(company_id=company_id, rule_id=payload.id, definition=payload.model_dump(), enabled=payload.enabled)
    db.add(row)
    db.add(AuditLog(company_id=company_id, action="campaign_rule.create", resource_type="campaign_rule", resource_id=payload.id, details={"name": payload.name}))
    db.commit()
    return {"id": row.rule_id, "enabled": row.enabled, "definition": row.definition}


@router.patch("/campaigns/rules/{rule_id}")
def update_campaign_rule(rule_id: str, payload: CampaignRuleUpdate, db: Session = Depends(get_db), company_id: int = Depends(get_company_id)):
    row = db.query(CampaignRule).filter(CampaignRule.company_id == company_id, CampaignRule.rule_id == rule_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Regra não encontrada")
    if payload.enabled is not None:
        row.enabled = payload.enabled
        row.definition = {**row.definition, "enabled": payload.enabled}
    if payload.definition is not None:
        row.definition = payload.definition.model_dump()
        row.enabled = payload.definition.enabled
    db.add(AuditLog(company_id=company_id, action="campaign_rule.update", resource_type="campaign_rule", resource_id=rule_id, details={"enabled": row.enabled}))
    db.commit()
    return {"id": row.rule_id, "enabled": row.enabled, "definition": row.definition}


@router.delete("/campaigns/rules/{rule_id}", status_code=204)
def delete_campaign_rule(rule_id: str, db: Session = Depends(get_db), company_id: int = Depends(get_company_id)):
    row = db.query(CampaignRule).filter(CampaignRule.company_id == company_id, CampaignRule.rule_id == rule_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Regra não encontrada")
    db.add(AuditLog(company_id=company_id, action="campaign_rule.delete", resource_type="campaign_rule", resource_id=rule_id, details={"name": row.definition.get("name")}))
    db.delete(row)
    db.commit()


def _cron_auth(authorization: str | None) -> None:
    expected = os.getenv("CRON_SECRET")
    if not expected:
        raise HTTPException(status_code=503, detail="CRON_SECRET não configurado")
    if authorization != f"Bearer {expected}":
        raise HTTPException(status_code=401, detail="Não autorizado")


def _matches(value: float, operator: str, expected: float) -> bool:
    return {
        "gt": value > expected,
        "gte": value >= expected,
        "lt": value < expected,
        "lte": value <= expected,
        "eq": value == expected,
    }.get(operator, False)


def _period_dates(period: str, now: datetime) -> tuple[str, str]:
    today = now.date()
    start = today
    if period == "yesterday":
        start = today - timedelta(days=1)
        end = start
    elif period == "7d":
        start = today - timedelta(days=6)
        end = today
    elif period == "30d":
        start = today - timedelta(days=29)
        end = today
    else:
        end = today
    return start.isoformat(), end.isoformat()


async def _run_campaign_rules(db: Session, now: datetime) -> dict:
    due = db.query(CampaignRule).filter(CampaignRule.enabled.is_(True)).all()
    processed = actions_count = errors = 0
    for row in due:
        definition = row.definition or {}
        frequency = definition.get("frequency", "15m")
        minutes = {"15m": 15, "30m": 30, "1h": 60, "daily": 1440}.get(frequency, 15)
        if row.last_checked_at and (now - row.last_checked_at) < timedelta(minutes=minutes):
            continue
        if row.execution_date != now.date():
            row.executions_today = 0
            row.execution_date = now.date()
        interval = definition.get("interval", "any")
        if interval == "business" and not (9 <= now.hour < 17):
            row.last_checked_at = now
            continue
        if interval == "morning" and not (5 <= now.hour < 12):
            row.last_checked_at = now
            continue
        if interval == "evening" and not (18 <= now.hour < 24):
            row.last_checked_at = now
            continue
        limit = definition.get("dailyLimit", "none")
        if limit != "none" and row.executions_today >= int(limit):
            row.last_checked_at = now
            continue

        start, end = _period_dates(definition.get("period", "today"), now)
        accounts = db.query(FacebookAccount).filter(
            FacebookAccount.company_id == row.company_id,
            FacebookAccount.token_valid.is_(True),
            FacebookAccount.is_active.is_(True),
        ).all()
        row.last_checked_at = now
        try:
            already_executed = db.query(AuditLog.resource_id, AuditLog.details).filter(
                AuditLog.company_id == row.company_id,
                AuditLog.action == "campaign_rule.execute",
                AuditLog.resource_type == "campaign",
                AuditLog.created_at >= now.replace(hour=0, minute=0, second=0, microsecond=0),
            ).all()
            executed_campaign_ids = {
                campaign_id for campaign_id, details in already_executed
                if isinstance(details, dict) and details.get("rule_id") == row.rule_id
            }
            for account in accounts:
                service = MetaAdsService(account.access_token, account.account_id, account.currency or "BRL")
                try:
                    campaigns = await service.get_campaigns(start, end)
                finally:
                    await service.close()
                for campaign in campaigns:
                    if campaign.id in executed_campaign_ids:
                        continue
                    if definition.get("scope") == "active" and campaign.status.upper() not in {"ACTIVE", "1"}:
                        continue
                    name = (campaign.name or "").lower()
                    name_filter = definition.get("nameFilter", "any")
                    if name_filter == "sales" and not any(term in name for term in ("sales", "venda", "convers", "purchase")):
                        continue
                    if name_filter == "remarketing" and not any(term in name for term in ("remarketing", "retarget", "remark")):
                        continue
                    metrics = {
                        "spend": float(campaign.spend),
                        "cpa": float(campaign.cpa),
                        "ctr": float(campaign.ctr),
                        "roas": float(campaign.roas),
                        "sales": float(campaign.sales),
                    }
                    conditions = definition.get("conditions") or []
                    if not conditions or not all(
                        condition.get("field") in metrics
                        and _matches(metrics[condition["field"]], condition.get("operator", "gt"), float(condition.get("value", 0)))
                        for condition in conditions
                    ):
                        continue
                    action = definition.get("action")
                    if action == "activate" and campaign.status.upper() in {"ACTIVE", "1"}:
                        continue
                    if action == "pause" and campaign.status.upper() not in {"ACTIVE", "1"}:
                        continue
                    result = {"success": False, "error": "Ação não suportada"}
                    before = float(campaign.budget or 0)
                    after = before
                    if action in {"activate", "pause"}:
                        result = await toggle_entity_status(account.access_token, campaign.id, "campaign", "ACTIVE" if action == "activate" else "PAUSED")
                    elif action in {"increase_budget", "decrease_budget"}:
                        if campaign.budget_type != "daily" or before <= 0:
                            continue
                        # `budget` is normalized to the system base. Convert it back
                        # into the ad account currency before sending cents to Meta.
                        change = min(max(float(definition.get("actionValue", 10)), 1), 90) / 100
                        factor = 1 + change if action == "increase_budget" else 1 - change
                        target_amount = before * factor
                        result = await update_budget(account.access_token, campaign.id, "campaign", target_amount)
                        after = target_amount
                    if not result.get("success"):
                        errors += 1
                        continue
                    action_type = {
                        "activate": ActionType.ACTIVATE,
                        "pause": ActionType.PAUSE,
                        "increase_budget": ActionType.BUDGET_INCREASE,
                        "decrease_budget": ActionType.BUDGET_DECREASE,
                    }[action]
                    record_campaign_action(
                        db, row.company_id, campaign.id, "campaign", campaign.name, action_type,
                        metrics, before, after,
                    )
                    db.add(AuditLog(company_id=row.company_id, action="campaign_rule.execute", resource_type="campaign", resource_id=campaign.id, details={"rule_id": row.rule_id, "rule_name": definition.get("name"), "action": action, "metrics": metrics}))
                    row.executions_today += 1
                    actions_count += 1
                    limit = definition.get("dailyLimit", "none")
                    if limit != "none" and row.executions_today >= int(limit):
                        break
            processed += 1
        except Exception as exc:
            errors += 1
            definition["last_error"] = str(exc)[:500]
            row.definition = definition
        db.commit()
    return {"rules_checked": processed, "actions_executed": actions_count, "errors": errors}


async def _send_scheduled_reports(db: Session, now: datetime) -> dict:
    api_key, model = get_openrouter_config()
    if not api_key:
        return {"reports_sent": 0, "error": "OPENROUTER_API_KEY não configurada"}
    settings_rows = db.query(CompanySettings).filter(CompanySettings.company_id.isnot(None)).all()
    sent = failed = 0
    for settings in settings_rows:
        prefs = settings.notification_preferences or {}
        try:
            local_now = datetime.now(datetime_timezone.utc).astimezone(ZoneInfo(prefs.get("timezone", "Africa/Maputo")))
        except (ZoneInfoNotFoundError, ValueError):
            local_now = datetime.now(datetime_timezone.utc).astimezone(ZoneInfo("Africa/Maputo"))
        hour_key = f"{local_now.hour:02d}:00"
        if not (prefs.get("reportHours") or {}).get(hour_key, False):
            continue
        title = f"Relatório LomusTrack {local_now.date().isoformat()} {hour_key}"
        if db.query(NotificationDelivery.id).filter(
            NotificationDelivery.company_id == settings.company_id,
            NotificationDelivery.title == title,
        ).first():
            continue
        subscriptions = db.query(PushSubscription).filter(
            PushSubscription.company_id == settings.company_id,
            PushSubscription.is_active.is_(True),
        ).all()
        if not subscriptions:
            db.add(NotificationDelivery(company_id=settings.company_id, title=title, body="Nenhum dispositivo inscrito para receber relatórios.", status="no_subscribers", data={"kind": "scheduled_report", "hour": hour_key}))
            db.commit()
            continue
        try:
            data = collect_daily_data(db, company_id=settings.company_id)
            context = format_daily_context(data)
            llm = build_llm_no_tools(api_key, model)
            template_instruction = {
                "profit": "Formato Status de Lucro: destaque faturamento líquido, gasto com anúncios, ROAS e lucro líquido, com valores em MT.",
                "summary": "Formato Resumo Detalhado da Operação: inclua vendas, investimento, ROI/ROAS, desempenho de campanhas e alertas relevantes.",
                "creative": "Formato criativo: escreva uma mensagem curta, bem-humorada e diferente das anteriores, sem perder os números reais do relatório.",
            }.get(prefs.get("template", "profit"), "Formato Status de Lucro com valores em MT.")
            if prefs.get("template") == "creative":
                previous = db.query(NotificationDelivery.body).filter(
                    NotificationDelivery.company_id == settings.company_id,
                    NotificationDelivery.data["kind"].astext == "scheduled_report",
                ).order_by(NotificationDelivery.created_at.desc()).limit(10).all()
                recent_texts = [item[0] for item in previous if item[0]]
                if recent_texts:
                    template_instruction += " Evite repetir estas mensagens recentes: " + " | ".join(recent_texts)[:1500]
            answer = await llm.ainvoke([
                SystemMessage(content=DAILY_REPORT_PROMPT + _build_user_instructions_block(settings.ai_instructions) + "\n\n" + template_instruction),
                HumanMessage(content=f"Gere o relatório da operação com os dados abaixo:\n\n{context}"),
            ])
            body = (_extract_text(answer.content) or "Relatório indisponível.")[:1900]
            ok = errors = 0
            delivered_ids = []
            for subscription in subscriptions:
                if push_service.send_notification(subscription, title, body, {"url": "/dashboard", "kind": "scheduled_report"}):
                    ok += 1
                    delivered_ids.append(subscription.id)
                else:
                    errors += 1
            report_data = {"url": "/dashboard", "kind": "scheduled_report", "hour": hour_key, "target_subscription_ids": [item.id for item in subscriptions], "delivered_subscription_ids": delivered_ids}
            report_status = "partial" if ok and errors else ("sent" if ok else "failed")
            db.add(NotificationDelivery(company_id=settings.company_id, title=title, body=body, status=report_status, sent_count=ok, failed_count=errors, data=report_data))
            if errors:
                enqueue_notification_retry(db, settings.company_id, title, body, report_data, delivered_ids)
            db.commit()
            sent += ok
            failed += errors
        except Exception as exc:
            db.rollback()
            db.add(NotificationDelivery(company_id=settings.company_id, title=title, body=str(exc)[:1900], status="failed", failed_count=len(subscriptions), data={"kind": "scheduled_report", "hour": hour_key}))
            db.commit()
            failed += len(subscriptions)
    return {"reports_sent": sent, "reports_failed": failed}


def _retry_notifications(db: Session, now: datetime) -> dict:
    jobs = db.query(NotificationRetry).filter(
        NotificationRetry.status == "pending",
        NotificationRetry.next_attempt_at <= datetime.utcnow(),
    ).order_by(NotificationRetry.id).limit(100).all()
    retried = delivered_count = failed_count = 0
    for job in jobs:
        targets = set((job.data or {}).get("target_subscription_ids") or [])
        already_delivered = set(job.delivered_subscription_ids or [])
        subscriptions = db.query(PushSubscription).filter(
            PushSubscription.company_id == job.company_id,
            PushSubscription.is_active.is_(True),
        ).all()
        remaining = [item for item in subscriptions if (not targets or item.id in targets) and item.id not in already_delivered]
        sent_now = []
        failures = 0
        for subscription in remaining:
            if push_service.send_notification(subscription, job.title, job.body, job.data or {}):
                sent_now.append(subscription.id)
            else:
                failures += 1
        job.delivered_subscription_ids = list(already_delivered.union(sent_now))
        job.attempts += 1
        expected_targets = targets or {item.id for item in subscriptions}
        complete = expected_targets.issubset(set(job.delivered_subscription_ids))
        if complete:
            job.status = "sent"
            delivered_count += len(sent_now)
        elif job.attempts >= job.max_attempts:
            job.status = "failed"
            failed_count += failures or len(expected_targets - set(job.delivered_subscription_ids))
        else:
            job.next_attempt_at = datetime.utcnow() + timedelta(minutes=min(5 * (2 ** job.attempts), 240))
        db.add(NotificationDelivery(
            company_id=job.company_id,
            title=job.title,
            body=job.body,
            status="retry_sent" if complete else ("failed" if job.status == "failed" else "retry_pending"),
            sent_count=len(sent_now),
            failed_count=failures,
            data={"retry_id": job.id, "attempt": job.attempts, "kind": (job.data or {}).get("kind", "sale")},
        ))
        db.commit()
        retried += 1
    return {"notification_jobs_retried": retried, "notification_deliveries_sent": delivered_count, "notification_jobs_failed": failed_count}


@router.get("/automation/run")
async def run_scheduled_automation(
    authorization: str | None = Header(default=None),
    db: Session = Depends(get_db),
):
    _cron_auth(authorization)
    lock_connection = _acquire_cron_lock(712034)
    try:
        now = now_sp()
        rules = await _run_campaign_rules(db, now)
        notifications = _retry_notifications(db, now)
        reports = await _send_scheduled_reports(db, now)
        return {"ok": True, **rules, **notifications, **reports}
    finally:
        _release_cron_lock(lock_connection, 712034)


def _acquire_cron_lock(lock_id: int) -> str:
    lock_token = uuid.uuid4().hex
    with engine.begin() as connection:
        acquired = connection.execute(text("""
            INSERT INTO automation_locks (lock_key, lock_token, locked_until)
            VALUES (:lock_id, :lock_token, NOW() + INTERVAL '45 minutes')
            ON CONFLICT (lock_key) DO UPDATE
                SET lock_token = EXCLUDED.lock_token,
                    locked_until = EXCLUDED.locked_until
                WHERE automation_locks.locked_until <= NOW()
            RETURNING lock_token
        """), {"lock_id": lock_id, "lock_token": lock_token}).scalar_one_or_none()
    if acquired is None:
        raise HTTPException(status_code=409, detail="A automação anterior ainda está em execução")
    return lock_token


def _release_cron_lock(lock_token: str, lock_id: int) -> None:
    with engine.begin() as connection:
        connection.execute(text("DELETE FROM automation_locks WHERE lock_key = :lock_id AND lock_token = :lock_token"), {
            "lock_id": lock_id,
            "lock_token": lock_token,
        })


@router.get("/automation/rules/run")
async def run_campaign_rules_cron(
    authorization: str | None = Header(default=None),
    db: Session = Depends(get_db),
):
    _cron_auth(authorization)
    lock_connection = _acquire_cron_lock(712034)
    try:
        now = now_sp()
        return {"ok": True, **await _run_campaign_rules(db, now), **_retry_notifications(db, now)}
    finally:
        _release_cron_lock(lock_connection, 712034)


@router.get("/automation/reports/run")
async def run_scheduled_reports_cron(
    authorization: str | None = Header(default=None),
    db: Session = Depends(get_db),
):
    _cron_auth(authorization)
    lock_connection = _acquire_cron_lock(712035)
    try:
        return {"ok": True, **await _send_scheduled_reports(db, now_sp())}
    finally:
        _release_cron_lock(lock_connection, 712035)
