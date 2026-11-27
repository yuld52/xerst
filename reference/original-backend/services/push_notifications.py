import os
import json
import logging
from typing import Optional
from dotenv import load_dotenv
from pywebpush import webpush, WebPushException
from sqlalchemy.orm import Session
from database.models.push_subscription import PushSubscription
from database.models.notification_delivery import NotificationDelivery
from database.models.company import CompanySettings
from datetime import datetime, timedelta
from database.models.notification_retry import NotificationRetry

load_dotenv()
logger = logging.getLogger("push_notifications")

class PushNotificationService:
    """Serviço para enviar notificações push usando Web Push Protocol"""
    
    def __init__(self):
        self.vapid_private_key = os.getenv("VAPID_PRIVATE_KEY")
        self.vapid_public_key = os.getenv("VAPID_PUBLIC_KEY")
        self.vapid_claims = {
            "sub": f"mailto:{os.getenv('VAPID_CLAIM_EMAIL', 'admin@lomustrack.app')}"
        }
        
        if not self.vapid_private_key or not self.vapid_public_key:
            logger.warning("VAPID keys nao configuradas. Push notifications desabilitadas.")

    def has_vapid_config(self) -> bool:
        return bool(self.vapid_private_key and self.vapid_public_key)

    def get_public_key(self) -> str | None:
        return self.vapid_public_key
    
    def send_notification(
        self,
        subscription: PushSubscription,
        title: str,
        body: str,
        data: Optional[dict] = None
    ) -> bool:
        """
        Envia uma notificação push para uma subscrição específica.
        
        Args:
            subscription: Objeto PushSubscription do banco
            title: Título da notificação
            body: Corpo da notificação
            data: Dados adicionais (opcional)
        
        Returns:
            True se enviado com sucesso, False caso contrário
        """
        if not self.vapid_private_key or not self.vapid_public_key:
            logger.warning("VAPID keys nao configuradas")
            return False
        
        try:
            subscription_info = {
                "endpoint": subscription.endpoint,
                "keys": {
                    "p256dh": subscription.p256dh,
                    "auth": subscription.auth
                }
            }
            
            payload = {
                "title": title,
                "body": body,
                "data": data or {}
            }
            
            webpush(
                subscription_info=subscription_info,
                data=json.dumps(payload),
                vapid_private_key=self.vapid_private_key,
                vapid_claims=self.vapid_claims
            )
            
            return True
            
        except WebPushException as e:
            logger.error(f"Erro ao enviar push notification: {e}")
            if e.response is not None and e.response.status_code in [404, 410]:
                subscription.is_active = False
            return False
        except Exception as e:
            logger.error(f"Erro inesperado ao enviar notificacao: {e}")
            return False
    
    def send_sale_notification(
        self,
        db: Session,
        amount: float,
        product_name: str = "Produto",
        customer_name: Optional[str] = None,
        company_id: int = 1,
        amount_mzn: Optional[float] = None,
        status: str = "approved",
        original_amount: Optional[float] = None,
        currency_code: str = "BRL",
        campaign_value: Optional[str] = None,
    ):
        """
        Envia notificação de venda para todas as subscrições ativas,
        preservando o valor e a moeda originais da plataforma de vendas (sem conversão).
        """
        settings = db.query(CompanySettings).filter(CompanySettings.company_id == company_id).first()
        preferences = (settings.notification_preferences if settings else None) or {}
        pref_key = "pendingSales" if status == "pending" else "approvedSales"
        if preferences.get(pref_key, "show" if status == "approved" else "hide") != "show":
            return

        value = original_amount if original_amount is not None else amount
        code = (currency_code or "BRL").upper()
        formatted_amount = f"{value:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".") + f" {code}"
        status_label = "Venda Pendente!" if status == "pending" else "Venda Aprovada!"
        lines = []
        if preferences.get("saleValue", "show") == "show":
            lines.append(f"Valor: {formatted_amount}")
        if preferences.get("productName", "hide") == "show" and product_name:
            lines.append(f"Produto: {product_name}")
        if preferences.get("campaignValue", "hide") == "show" and campaign_value:
            lines.append(f"Campanha: {campaign_value}")
        body = "\n".join(lines) if lines else "Confira os detalhes da venda."
        
        # Buscar todas as subscrições ativas DA MESMA EMPRESA
        subscriptions = db.query(PushSubscription).filter(
            PushSubscription.is_active == True,
            PushSubscription.company_id == company_id
        ).all()
        
        if not subscriptions:
            logger.info("Nenhuma subscricao ativa encontrada")
            db.add(NotificationDelivery(company_id=company_id, title=status_label, body=body, status="no_subscribers", data={"status": status}))
            db.commit()
            return
        
        # Enviar para cada subscrição
        success_count = 0
        failed_count = 0
        delivered_subscription_ids = []
        
        for sub in subscriptions:
            success = self.send_notification(
                subscription=sub,
                title=status_label,
                body=body,
                data={
                    "url": "/sales",
                    "amount": formatted_amount,
                    "product": product_name,
                    "campaign": campaign_value,
                    "status": status,
                }
            )
            
            if success:
                success_count += 1
                delivered_subscription_ids.append(sub.id)
                # Atualizar timestamp de último uso
                sub.last_used_at = datetime.utcnow()
                db.commit()
            else:
                failed_count += 1
        
        logger.info(f"Notificacoes enviadas: {success_count} sucesso, {failed_count} falhas")
        delivery_data = {
            "url": "/sales", "status": status, "amount": formatted_amount,
            "product": product_name, "campaign": campaign_value,
            "target_subscription_ids": [sub.id for sub in subscriptions],
            "delivered_subscription_ids": delivered_subscription_ids,
        }
        delivery_status = "partial" if success_count and failed_count else ("sent" if success_count else "failed")
        db.add(NotificationDelivery(company_id=company_id, title=status_label, body=body, status=delivery_status, sent_count=success_count, failed_count=failed_count, data=delivery_data))
        if failed_count:
            enqueue_notification_retry(db, company_id, status_label, body, {
                "url": "/sales", "amount": formatted_amount, "product": product_name,
                "campaign": campaign_value, "status": status,
                "target_subscription_ids": [sub.id for sub in subscriptions],
            }, delivered_subscription_ids)
        db.commit()


# Instância global do serviço
push_service = PushNotificationService()


def enqueue_notification_retry(
    db: Session,
    company_id: int,
    title: str,
    body: str,
    data: dict,
    delivered_subscription_ids: list[int] | None = None,
) -> NotificationRetry:
    job = NotificationRetry(
        company_id=company_id,
        title=title,
        body=body,
        data=data,
        delivered_subscription_ids=delivered_subscription_ids or [],
        attempts=0,
        max_attempts=3,
        status="pending",
        # Hobby's scheduler runs once per day; retry on the next daily run.
        next_attempt_at=datetime.utcnow() + timedelta(days=1),
    )
    db.add(job)
    return job
