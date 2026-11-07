import csv
import io
from datetime import datetime
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
from database.models.webhook_endpoint import WebhookEndpoint

router = APIRouter(tags=["operations"])


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
def retry_webhook(delivery_id: int, db: Session = Depends(get_db), current_user: Admin = Depends(get_current_user)):
    delivery = db.query(WebhookDelivery).filter(
        WebhookDelivery.id == delivery_id,
        WebhookDelivery.company_id == current_user.company_id,
    ).first()
    if not delivery:
        raise HTTPException(status_code=404, detail="Evento não encontrado")
    delivery.status = "retry_queued"
    delivery.attempts = (delivery.attempts or 0) + 1
    _audit(db, current_user, "webhook.retry", "webhook_delivery", str(delivery.id))
    db.commit()
    return {"status": "retry_queued", "message": "Evento marcado para reprocessamento"}


@router.get("/integrations/status")
def integrations_status(db: Session = Depends(get_db), company_id: int = Depends(get_company_id)):
    webhooks = db.query(WebhookEndpoint).filter(WebhookEndpoint.company_id == company_id).all()
    facebook = db.query(FacebookAccount).filter(FacebookAccount.company_id == company_id).all()
    stripe = db.query(StripeAccount).first()
    api_credentials = db.query(ApiCredential).filter(
        ApiCredential.company_id == company_id, ApiCredential.is_active.is_(True)
    ).count()
    return [
        {"platform": "Hotmart", "connected": any(w.platform.value == "hotmart" for w in webhooks), "last_sync": None, "error": None},
        {"platform": "Meta Ads", "connected": any(bool(a.token_valid) for a in facebook), "last_sync": None, "error": None if facebook else "Nenhuma conta configurada"},
        {"platform": "Google Ads", "connected": False, "last_sync": None, "error": "Integração ainda não configurada"},
        {"platform": "API", "connected": api_credentials > 0, "last_sync": None, "error": None if api_credentials else "Nenhuma credencial ativa"},
        {"platform": "Stripe", "connected": stripe is not None, "last_sync": None, "error": None if stripe else "Nenhuma conta configurada"},
    ]


@router.get("/audit/logs")
def audit_logs(limit: int = Query(100, ge=1, le=500), db: Session = Depends(get_db), company_id: int = Depends(get_company_id)):
    rows = db.query(AuditLog).filter(AuditLog.company_id == company_id).order_by(AuditLog.created_at.desc()).limit(limit).all()
    return [{"id": row.id, "action": row.action, "resource_type": row.resource_type, "resource_id": row.resource_id, "details": row.details, "created_at": row.created_at.isoformat() if row.created_at else None} for row in rows]


@router.get("/notifications/history")
def notification_history(limit: int = Query(100, ge=1, le=500), db: Session = Depends(get_db), company_id: int = Depends(get_company_id)):
    rows = db.query(NotificationDelivery).filter(NotificationDelivery.company_id == company_id).order_by(NotificationDelivery.created_at.desc()).limit(limit).all()
    return [{"id": row.id, "title": row.title, "body": row.body, "status": row.status, "sent_count": row.sent_count, "failed_count": row.failed_count, "created_at": row.created_at.isoformat() if row.created_at else None} for row in rows]


@router.get("/admin/export/{kind}")
def export_data(kind: str, db: Session = Depends(get_db), company_id: int = Depends(get_company_id)):
    output = io.StringIO()
    writer = csv.writer(output)
    if kind == "sales":
        writer.writerow(["id", "external_id", "status", "platform", "amount", "currency", "product", "email", "created_at"])
        rows = db.query(Transaction).filter(Transaction.company_id == company_id).order_by(Transaction.created_at.desc()).all()
        for row in rows:
            writer.writerow([row.id, row.external_id, row.status.value, row.platform.value, row.amount, row.original_currency or "BRL", row.product_name or "", row.customer_email or "", row.created_at.isoformat() if row.created_at else ""])
    elif kind == "customers":
        from database.models.customer import Customer
        writer.writerow(["id", "name", "email", "total_spent", "total_orders"])
        for row in db.query(Customer).filter(Customer.company_id == company_id).order_by(Customer.id).all():
            writer.writerow([row.id, row.name or "", row.email or "", row.total_spent or 0, row.total_orders or 0])
    elif kind == "profit":
        approved = db.query(func.coalesce(func.sum(Transaction.amount_mzn), 0)).filter(Transaction.company_id == company_id, Transaction.status == TransactionStatus.APPROVED).scalar() or 0
        writer.writerow(["metric", "value", "currency"])
        writer.writerow(["approved_revenue", float(approved), "MT"])
        writer.writerow(["ad_spend", "unavailable", "MT"])
        writer.writerow(["net_profit", "requires_ad_spend", "MT"])
    elif kind == "awards":
        approved = db.query(func.coalesce(func.sum(Transaction.amount_mzn), 0)).filter(Transaction.company_id == company_id, Transaction.status == TransactionStatus.APPROVED).scalar() or 0
        writer.writerow(["milestone", "achieved", "revenue", "currency"])
        for milestone in (10_000, 100_000, 1_000_000, 5_000_000, 10_000_000):
            writer.writerow([milestone, float(approved) >= milestone, float(approved), "MT"])
    elif kind == "subscriptions":
        writer.writerow(["status", "message"])
        writer.writerow(["pending", "Sincronização de assinaturas depende da conta Stripe configurada"])
    else:
        raise HTTPException(status_code=400, detail="Exportação inválida")
    return Response(content=output.getvalue(), media_type="text/csv", headers={"Content-Disposition": f"attachment; filename=lomus-{kind}.csv"})
