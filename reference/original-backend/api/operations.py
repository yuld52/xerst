import csv
import io
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy import func
from sqlalchemy.orm import Session

from api.auth.deps import get_company_id, get_current_user, require_role
from database.core.connection import get_db
from database.models.admin import Admin, UserRole
from database.models.api_credential import ApiCredential
from database.models.audit_log import AuditLog
from database.models.facebook_account import FacebookAccount
from database.models.stripe_account import StripeAccount
from database.models.transaction import Transaction, TransactionStatus
from database.models.webhook_delivery import WebhookDelivery
from database.models.notification_delivery import NotificationDelivery
from database.models.notification_retry import NotificationRetry
from services.push_notifications import enqueue_notification_retry
from database.models.webhook_endpoint import WebhookEndpoint
from database.models.webhook_endpoint import WebhookPlatform
from database.models.company import CompanySettings
from integrations.meta_ads.service import MetaAdsService
from database.core.timezone import now_sp
from api.superadmin.companies import LOMUS_PLANS
from integrations.webhook.hotmart import parse_hotmart_webhook
from integrations.webhook.kiwify import parse_kiwify_webhook
from integrations.webhook.payt import parse_payt_webhook
from integrations.webhook.api_direct import parse_api_webhook
from integrations.webhook.processor import process_webhook_event

router = APIRouter(tags=["operations"])

WEBHOOK_PARSERS = {
    "hotmart": parse_hotmart_webhook,
    "kiwify": parse_kiwify_webhook,
    "payt": parse_payt_webhook,
    "api": parse_api_webhook,
}


def _audit(db: Session, actor: Admin | None, action: str, resource_type: str,
           resource_id: str | None = None, details: dict | None = None):
    db.add(AuditLog(
        company_id=actor.company_id if actor else None,
        actor_id=actor.id if actor else None,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        details=details or {},
    ))


@router.get("/awards/progress")
def awards_progress(
    db: Session = Depends(get_db),
    company_id: int = Depends(get_company_id),
):
    """Faturamento aprovado real da conta, sem valores demonstrativos."""
    total = db.query(func.coalesce(func.sum(Transaction.amount_mzn), 0)).filter(
        Transaction.company_id == company_id,
        Transaction.status == TransactionStatus.APPROVED,
    ).scalar()
    if total is None or float(total) == 0:
        total = db.query(func.coalesce(func.sum(Transaction.amount), 0)).filter(
            Transaction.company_id == company_id,
            Transaction.status == TransactionStatus.APPROVED,
        ).scalar()
    users = db.query(Admin).filter(Admin.company_id == company_id).order_by(Admin.id).all()
    return {
        "currency": "MT",
        "total_revenue": float(total or 0),
        "attribution": "company",
        "users": [{"id": user.id, "name": user.name, "email": user.email, "revenue": float(total or 0)} for user in users],
    }


@router.get("/webhooks/history")
def webhook_history(
    limit: int = Query(100, ge=1, le=500),
    status: str | None = Query(None),
    db: Session = Depends(get_db),
    company_id: int = Depends(get_company_id),
):
    query = db.query(WebhookDelivery).filter(WebhookDelivery.company_id == company_id)
    if status and status != "all":
        query = query.filter(WebhookDelivery.status == status)
    rows = query.order_by(WebhookDelivery.received_at.desc()).limit(limit).all()
    return [{
        "id": row.id, "platform": row.platform, "slug": row.slug,
        "status": row.status, "http_status": row.http_status,
        "error": row.error_message, "attempts": row.attempts,
        "transaction_id": row.transaction_id,
        "received_at": row.received_at.isoformat() if row.received_at else None,
        "processed_at": row.processed_at.isoformat() if row.processed_at else None,
    } for row in rows]


@router.post("/webhooks/history/{delivery_id}/retry")
def retry_webhook(
    delivery_id: int,
    db: Session = Depends(get_db),
    current_user: Admin = Depends(get_current_user),
    company_id: int = Depends(get_company_id),
):
    delivery = db.query(WebhookDelivery).filter(
        WebhookDelivery.id == delivery_id,
        WebhookDelivery.company_id == company_id,
    ).first()
    if not delivery:
        raise HTTPException(status_code=404, detail="Evento não encontrado")
    if delivery.status not in ("error", "retry_queued"):
        raise HTTPException(status_code=409, detail="Somente eventos com erro podem ser reprocessados.")
    endpoint = db.query(WebhookEndpoint).filter(
        WebhookEndpoint.id == delivery.endpoint_id,
        WebhookEndpoint.company_id == company_id,
    ).first()
    parser = WEBHOOK_PARSERS.get(delivery.platform.lower())
    if not endpoint or not parser or not isinstance(delivery.payload, dict):
        raise HTTPException(status_code=422, detail="O endpoint, parser ou payload original não está disponível.")

    delivery.attempts = (delivery.attempts or 0) + 1
    delivery.status = "processing"
    delivery.error_message = None
    db.commit()
    try:
        event = parser(delivery.payload)
        if not event:
            raise ValueError("Payload não reconhecido pelo parser da plataforma.")
        event.webhook_slug = delivery.slug
        transaction = process_webhook_event(db, event, company_id=company_id)
        delivery.status = "processed"
        delivery.http_status = 200
        delivery.transaction_id = transaction.id if transaction else None
        delivery.processed_at = datetime.utcnow()
        delivery.error_message = None
        _audit(db, current_user, "webhook.retry", "webhook_delivery", str(delivery.id), {"result": "processed"})
        db.commit()
        return {"status": "processed", "message": "Evento reprocessado com sucesso"}
    except Exception as exc:
        db.rollback()
        delivery = db.query(WebhookDelivery).filter(
            WebhookDelivery.id == delivery_id,
            WebhookDelivery.company_id == company_id,
        ).first()
        if delivery:
            delivery.status = "error"
            delivery.http_status = 500
            delivery.error_message = str(exc)[:1000]
            delivery.processed_at = datetime.utcnow()
            _audit(db, current_user, "webhook.retry", "webhook_delivery", str(delivery.id), {"result": "failed"})
            db.commit()
        raise HTTPException(status_code=500, detail="Falha ao reprocessar evento: " + str(exc)[:300])


@router.get("/integrations/status")
def integrations_status(db: Session = Depends(get_db), company_id: int = Depends(get_company_id)):
    webhooks = db.query(WebhookEndpoint).filter(WebhookEndpoint.company_id == company_id).all()
    facebook = db.query(FacebookAccount).filter(FacebookAccount.company_id == company_id).all()
    hotmart_event = db.query(WebhookDelivery).filter(
        WebhookDelivery.company_id == company_id,
        WebhookDelivery.platform == "hotmart",
    ).order_by(WebhookDelivery.received_at.desc()).first()
    stripe = db.query(StripeAccount).filter(StripeAccount.company_id == company_id).first()
    api_credentials = db.query(ApiCredential).filter(
        ApiCredential.company_id == company_id, ApiCredential.is_active.is_(True)
    ).count()
    return [
        {"platform": "Hotmart", "connected": any(w.platform.value == "hotmart" for w in webhooks), "last_sync": hotmart_event.received_at.isoformat() if hotmart_event and hotmart_event.received_at else None, "error": hotmart_event.error_message if hotmart_event and hotmart_event.status == "error" else None},
        {"platform": "Meta Ads", "connected": any(bool(a.token_valid) and a.is_active for a in facebook), "last_sync": max((a.last_sync_at.isoformat() for a in facebook if a.last_sync_at), default=None), "error": "Token inválido" if facebook and not any(bool(a.token_valid) for a in facebook) else ("Nenhuma conta configurada" if not facebook else None)},
        {"platform": "API", "connected": api_credentials > 0, "last_sync": None, "error": None if api_credentials else "Nenhuma credencial ativa"},
        {"platform": "Stripe", "connected": stripe is not None, "last_sync": None, "error": None if stripe else "Nenhuma conta configurada"},
    ]


@router.get("/audit/logs")
def audit_logs(limit: int = Query(100, ge=1, le=500), db: Session = Depends(get_db), company_id: int = Depends(get_company_id)):
    rows = db.query(AuditLog, Admin.name).outerjoin(Admin, Admin.id == AuditLog.actor_id).filter(AuditLog.company_id == company_id).order_by(AuditLog.created_at.desc()).limit(limit).all()
    return [{"id": row.id, "action": row.action, "actor": actor_name or "Sistema", "resource_type": row.resource_type, "resource_id": row.resource_id, "details": row.details, "created_at": row.created_at.isoformat() if row.created_at else None} for row, actor_name in rows]


@router.get("/notifications/history")
def notification_history(limit: int = Query(100, ge=1, le=500), db: Session = Depends(get_db), company_id: int = Depends(get_company_id)):
    rows = db.query(NotificationDelivery).filter(NotificationDelivery.company_id == company_id).order_by(NotificationDelivery.created_at.desc()).limit(limit).all()
    return [{"id": row.id, "title": row.title, "body": row.body, "status": row.status, "sent_count": row.sent_count, "failed_count": row.failed_count, "created_at": row.created_at.isoformat() if row.created_at else None} for row in rows]


@router.post("/notifications/history/{delivery_id}/retry", status_code=202)
def retry_notification(delivery_id: int, db: Session = Depends(get_db), company_id: int = Depends(get_company_id), current_user: Admin = Depends(get_current_user)):
    delivery = db.query(NotificationDelivery).filter(
        NotificationDelivery.id == delivery_id,
        NotificationDelivery.company_id == company_id,
        NotificationDelivery.status.in_(("failed", "partial", "retry_pending", "no_subscribers")),
    ).first()
    if not delivery:
        raise HTTPException(status_code=404, detail="Notificação com falha não encontrada")
    delivery_data = delivery.data or {}
    job = db.query(NotificationRetry).filter(
        NotificationRetry.company_id == company_id,
        NotificationRetry.title == delivery.title,
        NotificationRetry.body == delivery.body,
        NotificationRetry.status == "pending",
    ).first()
    if not job:
        job = enqueue_notification_retry(
            db, company_id, delivery.title, delivery.body, delivery_data,
            delivery_data.get("delivered_subscription_ids", []),
        )
    db.add(AuditLog(company_id=company_id, actor_id=current_user.id, action="notification.retry", resource_type="notification_delivery", resource_id=str(delivery.id), details={"retry_id": job.id}))
    delivery.status = "retry_queued"
    db.commit()
    return {"status": "queued", "retry_id": job.id}


@router.get("/admin/export/{kind}")
async def export_data(kind: str, db: Session = Depends(get_db), company_id: int = Depends(get_company_id)):
    output = io.StringIO()
    writer = csv.writer(output)
    if kind == "sales":
        writer.writerow(["id", "external_id", "status", "platform", "original_amount", "original_currency", "amount_mzn", "product", "email", "created_at"])
        rows = db.query(Transaction).filter(Transaction.company_id == company_id).order_by(Transaction.created_at.desc()).all()
        for row in rows:
            writer.writerow([row.id, row.external_id, row.status.value, row.platform.value, row.original_amount if row.original_amount is not None else row.amount, row.original_currency or "BRL", row.amount_mzn or 0, row.product_name or "", row.customer_email or "", row.created_at.isoformat() if row.created_at else ""])
    elif kind == "customers":
        from database.models.customer import Customer
        writer.writerow(["id", "name", "email", "total_spent_stored", "total_orders"])
        for row in db.query(Customer).filter(Customer.company_id == company_id).order_by(Customer.id).all():
            writer.writerow([row.id, row.name or "", row.email or "", row.total_spent or 0, row.total_orders or 0])
    elif kind == "profit":
        now = now_sp()
        start = now - timedelta(days=29)
        ds, de = start.strftime("%Y-%m-%d"), now.strftime("%Y-%m-%d")
        approved = db.query(func.coalesce(func.sum(func.coalesce(Transaction.amount_mzn, Transaction.amount * 13)), 0)).filter(
            Transaction.company_id == company_id,
            Transaction.status == TransactionStatus.APPROVED,
            Transaction.created_at >= start,
            Transaction.created_at <= now,
        ).scalar() or 0
        ad_spend_base = 0.0
        for account in db.query(FacebookAccount).filter(
            FacebookAccount.company_id == company_id,
            FacebookAccount.is_active.is_(True),
            FacebookAccount.token_valid.is_(True),
        ).all():
            service = MetaAdsService(account.access_token, account.account_id, account.currency or "BRL")
            try:
                ad_spend_base += float((await service.get_account_summary(ds, de)).spend or 0)
            finally:
                await service.close()
        ad_spend_mzn = ad_spend_base * 13
        settings = db.query(CompanySettings).filter(CompanySettings.company_id == company_id).first()
        tax_rate = float(settings.tax_rate or 0) if settings else 0
        costs = settings.operational_costs or [] if settings else []
        fixed_costs = sum(float(item.get("amount", 0) or 0) for item in costs if isinstance(item, dict))
        tax_estimate = float(approved) * tax_rate / 100
        net_estimate = float(approved) - ad_spend_mzn - tax_estimate - fixed_costs
        writer.writerow(["metric", "value", "currency", "period"])
        writer.writerow(["approved_revenue", float(approved), "MT", f"{ds}..{de}"])
        writer.writerow(["meta_ads_spend", ad_spend_mzn, "MT", f"{ds}..{de}"])
        writer.writerow(["configured_tax_estimate", tax_estimate, "MT", f"{ds}..{de}"])
        writer.writerow(["configured_operating_costs", fixed_costs, "MT", "valor cadastrado nas configurações"])
        writer.writerow(["estimated_net_profit", net_estimate, "MT", "estimativa após anúncios, taxa e custos cadastrados"])
    elif kind == "awards":
        approved = db.query(func.coalesce(func.sum(Transaction.amount_mzn), 0)).filter(Transaction.company_id == company_id, Transaction.status == TransactionStatus.APPROVED).scalar() or 0
        writer.writerow(["milestone", "achieved", "revenue", "currency"])
        for milestone in (10_000, 100_000, 1_000_000, 5_000_000, 10_000_000):
            writer.writerow([milestone, float(approved) >= milestone, float(approved), "MT"])
    elif kind == "subscriptions":
        owner = db.query(Admin).filter(Admin.company_id == company_id, Admin.role == UserRole.owner).order_by(Admin.id).first()
        plan_id = owner.subscription_plan if owner and owner.subscription_plan in LOMUS_PLANS else "free"
        plan = LOMUS_PLANS[plan_id]
        writer.writerow(["company_id", "plan_id", "plan_name", "monthly_price", "currency", "expires_at", "member_email", "member_role", "member_active"])
        members = db.query(Admin).filter(Admin.company_id == company_id).order_by(Admin.id).all()
        for member in members:
            writer.writerow([company_id, plan_id, plan["name"], plan["monthly_price"], "USD", owner.subscription_expires_at.isoformat() if owner and owner.subscription_expires_at else "", member.email or "", member.role.value, bool(member.is_active)])
    else:
        raise HTTPException(status_code=400, detail="Exportação inválida")
    return Response(content=output.getvalue(), media_type="text/csv", headers={"Content-Disposition": f"attachment; filename=lomus-{kind}.csv"})
