# Correções Necessárias no Backend

## ❌ Problema Atual
Os limites de subscrição não estão sendo respeitados. O backend está retornando valores incorretos:
- Uso maior que o limite (ex: 3/3, 4/3)
- Limites errados (ex: 1/1000 no plano Free quando deveria ser 1/100)

## ✅ O que o Frontend já faz corretamente
- Exibe os dados recebidos da API
- Bloqueia ações quando `isBlocked = true` (baseado nos dados do backend)
- Mostra avisos quando próximo do limite (>80%)
- Guard de subscrição em `SubscriptionGuard.tsx`
- Hook `useSubscriptionLimits.ts` com toda lógica de verificação

## 🔧 Correções Necessárias no Backend

### 1. Endpoint de Subscrição: `/api/company/subscription`

#### Estrutura atual retornada:
```json
{
  "plan_id": "free",
  "plan": {
    "id": "free",
    "name": "Free",
    "monthly_price": 0,
    "sales_limit": 100,
    "webhook_limit": 3,
    "ad_account_limit": 3
  },
  "usage": {
    "approved_sales_this_month": 1,
    "webhooks": 3,
    "ad_accounts": 3
  },
  "expires_at": "2025-01-22T00:00:00",
  "started_at": "2024-12-22T00:00:00",
  "pending_plan_request": null,
  "available_plans": [...]
}
```

#### Correções necessárias:

**A. Cálculo correto de `usage.approved_sales_this_month`**
- Contar apenas vendas com `status = 'approved'`
- Filtrar apenas o mês atual
- Query sugerida:
```sql
SELECT COUNT(*) 
FROM sales 
WHERE company_id = ? 
  AND status = 'approved'
  AND MONTH(created_at) = MONTH(CURRENT_DATE())
  AND YEAR(created_at) = YEAR(CURRENT_DATE())
```

**B. Cálculo correto de `usage.webhooks`**
- Contar webhooks ativos da empresa
- Query sugerida:
```sql
SELECT COUNT(*) 
FROM webhooks 
WHERE company_id = ? 
  AND active = true
```

**C. Cálculo correto de `usage.ad_accounts`**
- Contar contas de anúncio ativas da empresa
- Query sugerida:
```sql
SELECT COUNT(*) 
FROM ad_accounts 
WHERE company_id = ? 
  AND active = true
```

**D. Limites corretos por plano**
Atualizar tabela `subscription_plans`:

```sql
-- Free
UPDATE subscription_plans 
SET monthly_price = 0,
    sales_limit = 100,
    webhook_limit = 3,
    ad_account_limit = 3
WHERE id = 'free';

-- Premium
UPDATE subscription_plans 
SET monthly_price = 500,
    sales_limit = 1000,
    webhook_limit = 10,
    ad_account_limit = 10
WHERE id = 'premium';

-- Monster
UPDATE subscription_plans 
SET monthly_price = 2000,
    sales_limit = NULL,  -- Ilimitado
    webhook_limit = NULL,  -- Ilimitado
    ad_account_limit = NULL  -- Ilimitado
WHERE id = 'monster';
```

### 2. Validação de Limites nas Operações

#### A. Criar Webhook
Arquivo: `app/routers/webhooks.py`

```python
@router.post("/webhooks")
async def create_webhook(webhook_data: WebhookCreate, db: Session, company: Company):
    # Verificar limite
    subscription = get_company_subscription(db, company.id)
    current_webhooks = db.query(Webhook).filter(
        Webhook.company_id == company.id,
        Webhook.active == True
    ).count()
    
    webhook_limit = subscription.plan.webhook_limit
    if webhook_limit is not None and current_webhooks >= webhook_limit:
        raise HTTPException(
            status_code=403,
            detail=f"Limite de webhooks atingido ({webhook_limit}). Faça upgrade do plano."
        )
    
    # Criar webhook...
```

#### B. Adicionar Conta de Anúncio
Arquivo: `app/routers/ad_accounts.py`

```python
@router.post("/ad-accounts")
async def create_ad_account(account_data: AdAccountCreate, db: Session, company: Company):
    # Verificar limite
    subscription = get_company_subscription(db, company.id)
    current_accounts = db.query(AdAccount).filter(
        AdAccount.company_id == company.id,
        AdAccount.active == True
    ).count()
    
    account_limit = subscription.plan.ad_account_limit
    if account_limit is not None and current_accounts >= account_limit:
        raise HTTPException(
            status_code=403,
            detail=f"Limite de contas de anúncio atingido ({account_limit}). Faça upgrade do plano."
        )
    
    # Criar conta...
```

#### C. Registrar Venda (via Webhook)
Arquivo: `app/routers/webhooks.py` (handler)

```python
@router.post("/webhooks/{webhook_id}/receive")
async def receive_webhook(webhook_id: str, data: dict, db: Session):
    webhook = get_webhook(db, webhook_id)
    company = webhook.company
    
    # Verificar limite de vendas
    subscription = get_company_subscription(db, company.id)
    current_sales = db.query(Sale).filter(
        Sale.company_id == company.id,
        Sale.status == 'approved',
        extract('month', Sale.created_at) == datetime.now().month,
        extract('year', Sale.created_at) == datetime.now().year
    ).count()
    
    sales_limit = subscription.plan.sales_limit
    if sales_limit is not None and current_sales >= sales_limit:
        # Registrar venda mas marcar como "blocked_by_limit"
        # OU retornar erro 403
        raise HTTPException(
            status_code=403,
            detail=f"Limite de vendas atingido ({sales_limit}). Faça upgrade para continuar."
        )
    
    # Processar venda...
```

### 3. Função Auxiliar para Verificar Limites

Criar em `app/services/subscription_service.py`:

```python
from typing import Optional
from sqlalchemy.orm import Session
from app.models import Company, Sale, Webhook, AdAccount, SubscriptionPlan
from datetime import datetime

def check_sales_limit(db: Session, company_id: int) -> tuple[bool, Optional[str]]:
    """
    Verifica se a empresa atingiu o limite de vendas.
    Retorna (can_proceed, error_message)
    """
    subscription = get_company_subscription(db, company_id)
    sales_limit = subscription.plan.sales_limit
    
    if sales_limit is None:
        return (True, None)  # Ilimitado
    
    current_sales = db.query(Sale).filter(
        Sale.company_id == company_id,
        Sale.status == 'approved',
        extract('month', Sale.created_at) == datetime.now().month,
        extract('year', Sale.created_at) == datetime.now().year
    ).count()
    
    if current_sales >= sales_limit:
        return (False, f"Limite de {sales_limit} vendas atingido. Faça upgrade.")
    
    return (True, None)

def check_webhook_limit(db: Session, company_id: int) -> tuple[bool, Optional[str]]:
    """Verifica se pode criar mais webhooks"""
    subscription = get_company_subscription(db, company_id)
    webhook_limit = subscription.plan.webhook_limit
    
    if webhook_limit is None:
        return (True, None)
    
    current_webhooks = db.query(Webhook).filter(
        Webhook.company_id == company_id,
        Webhook.active == True
    ).count()
    
    if current_webhooks >= webhook_limit:
        return (False, f"Limite de {webhook_limit} webhooks atingido.")
    
    return (True, None)

def check_ad_account_limit(db: Session, company_id: int) -> tuple[bool, Optional[str]]:
    """Verifica se pode adicionar mais contas de anúncio"""
    subscription = get_company_subscription(db, company_id)
    account_limit = subscription.plan.ad_account_limit
    
    if account_limit is None:
        return (True, None)
    
    current_accounts = db.query(AdAccount).filter(
        AdAccount.company_id == company_id,
        AdAccount.active == True
    ).count()
    
    if current_accounts >= account_limit:
        return (False, f"Limite de {account_limit} contas atingido.")
    
    return (True, None)
```

### 4. Middleware de Bloqueio Global (Opcional)

Criar middleware que bloqueia TODAS as requisições quando limite de vendas é atingido:

```python
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware

class SubscriptionLimitMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Excluir rotas públicas e de autenticação
        if request.url.path in ["/api/auth/login", "/api/auth/register"]:
            return await call_next(request)
        
        # Se usuário autenticado, verificar limites
        company_id = getattr(request.state, "company_id", None)
        if company_id:
            can_proceed, error = check_sales_limit(request.state.db, company_id)
            if not can_proceed:
                return JSONResponse(
                    status_code=403,
                    content={"detail": error}
                )
        
        return await call_next(request)
```

## 📊 Tabela de Preços Atualizada (Metical)

| Plano    | Preço/mês | Vendas         | Webhooks   | Contas     | Regras | Excedente        |
|----------|-----------|----------------|------------|------------|--------|------------------|
| Free     | 0 MT      | até 100        | até 3      | até 3      | ❌     | Bloqueado        |
| Premium  | 500 MT    | até 1.000      | até 10     | até 10     | ✅     | 0,50 MT/venda    |
| Monster  | 2.000 MT  | Ilimitadas     | Ilimitados | Ilimitados | ✅     | N/A              |

## 🔍 Como Testar

1. **Criar conta free com 100+ vendas**
   - Verificar que `usage.approved_sales_this_month` reflete o valor correto
   - Verificar que novas vendas são bloqueadas ao atingir 100

2. **Criar 3 webhooks no plano free**
   - Verificar que o 4º webhook é bloqueado com erro 403

3. **Fazer upgrade para Premium**
   - Verificar que limites aumentam para 1000 vendas, 10 webhooks, 10 contas

4. **Teste de excedente no Premium**
   - Criar 1001 vendas
   - Verificar que sistema calcula overage corretamente
   - Verificar que próxima venda custa 0,50 MT adicional

## 📝 Checklist de Implementação

- [ ] Corrigir cálculo de `usage.approved_sales_this_month`
- [ ] Corrigir cálculo de `usage.webhooks`
- [ ] Corrigir cálculo de `usage.ad_accounts`
- [ ] Atualizar preços na tabela `subscription_plans` para Metical
- [ ] Criar função `check_sales_limit()`
- [ ] Criar função `check_webhook_limit()`
- [ ] Criar função `check_ad_account_limit()`
- [ ] Adicionar validação em POST `/webhooks`
- [ ] Adicionar validação em POST `/ad-accounts`
- [ ] Adicionar validação em webhook receiver (vendas)
- [ ] Testar bloqueio no plano Free (100 vendas)
- [ ] Testar bloqueio de webhooks (3 no Free, 10 no Premium)
- [ ] Testar cálculo de overage no Premium/Monster
- [ ] Atualizar testes automatizados

## 🚀 Deploy

Após implementar as correções:
1. Fazer backup do banco de dados
2. Executar migrations para atualizar tabela de planos
3. Testar em ambiente de staging
4. Deploy para produção
5. Monitorar logs de erro 403 (limite atingido)

---

**Nota:** O frontend já está 100% preparado para receber esses dados corretos do backend.
