# Correções Aplicadas no Backend

## ✅ Implementado

### 1. Atualização de Preços e Limites

**Arquivo:** `reference/original-backend/api/subscriptions/metrics.py`

Planos atualizados para Metical (MZN):

```python
LOMUS_PLANS = {
    "free": {
        "name": "Free", 
        "monthly_price": 0,  # 0 MT (antes: 0 USD)
        "sales_limit": 100,  # 100 vendas (antes: 80)
        "ad_account_limit": 3,  # 3 contas (antes: 1)
        "webhook_limit": 3  # 3 webhooks (antes: 1)
    },
    "premium": {
        "name": "Premium",
        "monthly_price": 500,  # 500 MT (antes: 29 USD)
        "sales_limit": 1000,  # 1000 vendas (mantido)
        "ad_account_limit": 10,  # 10 contas (antes: 3)
        "webhook_limit": 10  # 10 webhooks (antes: 3)
    },
    "monster": {
        "name": "Monster",
        "monthly_price": 2000,  # 2000 MT (antes: 79 USD)
        "sales_limit": None,  # Ilimitado (antes: 5000)
        "ad_account_limit": None,  # Ilimitado
        "webhook_limit": None  # Ilimitado
    },
}
```

### 2. Serviço de Validação de Limites

**Arquivo criado:** `reference/original-backend/services/subscription_limits.py`

Funções implementadas:
- `get_company_plan(db, company_id)` - Retorna plano atual da empresa
- `check_sales_limit(db, company_id)` - Verifica limite de vendas
- `check_webhook_limit(db, company_id)` - Verifica limite de webhooks
- `check_ad_account_limit(db, company_id)` - Verifica limite de contas
- `enforce_sales_limit(db, company_id)` - Força erro 403 se limite atingido
- `enforce_webhook_limit(db, company_id)` - Força erro 403 se limite atingido
- `enforce_ad_account_limit(db, company_id)` - Força erro 403 se limite atingido

### 3. Validação em Criação de Webhooks

**Arquivo:** `reference/original-backend/api/platforms/webhooks.py`

Adicionado:
```python
from services.subscription_limits import enforce_webhook_limit

@router.post("/webhooks", ...)
def create_webhook(...):
    # Check subscription limits before creating webhook
    enforce_webhook_limit(db, company_id)
    # ... resto do código
```

**Comportamento:**
- Plano Free: Bloqueia criação do 4º webhook (limite: 3)
- Plano Premium: Bloqueia criação do 11º webhook (limite: 10)
- Plano Monster: Permite ilimitado

### 4. Validação em Criação de Contas de Anúncio

**Arquivo:** `reference/original-backend/api/facebook/accounts.py`

Adicionado em `create_account()`:
```python
from services.subscription_limits import enforce_ad_account_limit

# Check subscription limits before creating new account
enforce_ad_account_limit(db, company_id)
```

Adicionado em `create_accounts_bulk()`:
- Conta quantas contas NOVAS serão criadas
- Verifica se ultrapassará o limite
- Retorna erro 403 com mensagem clara

**Comportamento:**
- Plano Free: Bloqueia criação da 4ª conta (limite: 3)
- Plano Premium: Bloqueia criação da 11ª conta (limite: 10)
- Plano Monster: Permite ilimitado

### 5. Validação em Processamento de Vendas

**Arquivo:** `reference/original-backend/integrations/webhook/processor.py`

Adicionado:
```python
from services.subscription_limits import check_sales_limit

def process_webhook_event(...):
    # Check if this is a NEW approved sale
    existing_tx = db.query(Transaction).filter(...).first()
    
    # Only check sales limit for NEW approved sales
    if not existing_tx and event.status == TransactionStatus.APPROVED:
        can_proceed, error_message = check_sales_limit(db, company_id)
        if not can_proceed:
            # Save as PENDING transaction (blocked)
            # Raise HTTPException 403
```

**Comportamento:**
- Plano Free: Bloqueia 101ª venda (limite: 100)
- Plano Premium: Bloqueia 1001ª venda (limite: 1000)
- Plano Monster: Permite ilimitado
- Venda bloqueada é salva como PENDING para auditoria
- Webhook retorna erro 403 para plataforma de pagamento

## 📊 Comparação Antes vs Depois

| Plano | Atributo | Antes | Depois |
|-------|----------|-------|--------|
| **Free** | Preço | 0 USD | 0 MT |
| | Vendas | 80 | 100 |
| | Webhooks | 1 | 3 |
| | Contas | 1 | 3 |
| **Premium** | Preço | 29 USD | 500 MT |
| | Vendas | 1000 | 1000 |
| | Webhooks | 3 | 10 |
| | Contas | 3 | 10 |
| **Monster** | Preço | 79 USD | 2000 MT |
| | Vendas | 5000 | Ilimitado |
| | Webhooks | Ilimitado | Ilimitado |
| | Contas | Ilimitado | Ilimitado |

## 🔒 Endpoints com Validação

| Endpoint | Método | Validação | Erro |
|----------|--------|-----------|------|
| `/platforms/webhooks` | POST | `enforce_webhook_limit` | 403 |
| `/facebook/accounts` | POST | `enforce_ad_account_limit` | 403 |
| `/facebook/accounts/bulk` | POST | Validação personalizada | 403 |
| `/webhook/{platform}/{slug}` | POST | `check_sales_limit` | 403 |

## 🎯 Lógica de Validação

### Vendas
1. Conta vendas APROVADAS do mês atual
2. Compara com `sales_limit` do plano
3. Se `sales_limit` é `None` → permite (ilimitado)
4. Se `current_sales >= sales_limit` → bloqueia

### Webhooks
1. Conta todos webhooks da empresa (tabela `webhook_endpoints`)
2. Compara com `webhook_limit` do plano
3. Se `webhook_limit` é `None` → permite (ilimitado)
4. Se `current_webhooks >= webhook_limit` → bloqueia

### Contas de Anúncio
1. Conta todas contas da empresa (tabela `facebook_accounts`)
2. Compara com `ad_account_limit` do plano
3. Se `ad_account_limit` é `None` → permite (ilimitado)
4. Se `current_accounts >= ad_account_limit` → bloqueia

## 🚀 Como Deploy

### 1. Preparação
```bash
# Navegar para o backend
cd reference/original-backend

# Instalar dependências (se necessário)
pip install -r requirements.txt
```

### 2. Variáveis de Ambiente
Garantir que estão configuradas:
```env
DATABASE_URL=postgresql://...  # Supabase Transaction Pooler
SECRET_KEY=...
CRON_SECRET=...
```

### 3. Testar Localmente
```bash
# Iniciar backend
python app.py

# Testar endpoints:
# - GET /api/subscriptions/current (verificar limites corretos)
# - POST /api/platforms/webhooks (testar bloqueio)
# - POST /api/facebook/accounts (testar bloqueio)
```

### 4. Deploy no Vercel/Render
O backend está configurado para deploy em Vercel ou Render.
Apenas faça push das mudanças e o deploy automático irá aplicar.

## ✅ Checklist de Verificação Pós-Deploy

- [ ] GET `/api/subscriptions/current` retorna limites corretos (100 vendas no Free)
- [ ] Plano Free mostra preços em Metical (0 MT, 500 MT, 2000 MT)
- [ ] Criar 3 webhooks no Free funciona
- [ ] Criar 4º webhook no Free retorna erro 403
- [ ] Criar 3 contas no Free funciona
- [ ] Criar 4ª conta no Free retorna erro 403
- [ ] Processar 100 vendas no Free funciona
- [ ] Processar 101ª venda no Free retorna erro 403
- [ ] Plano Premium permite 10 webhooks e 10 contas
- [ ] Plano Monster não tem limites

## 📝 Notas Importantes

1. **Contadores Estão Corretos**: Os contadores já estavam corretos no código original (`approved_sales_this_month`, `webhooks`, `ad_accounts`)

2. **Apenas Limites Estavam Errados**: O problema era que os limites na constante `LOMUS_PLANS` estavam desatualizados

3. **Validações Adicionadas**: O código original NÃO validava limites antes de criar recursos. Agora valida.

4. **Vendas Bloqueadas São Salvas**: Para auditoria, vendas que ultrapassam o limite são salvas como PENDING

5. **Frontend Já Está Pronto**: O frontend já exibe tudo corretamente e mostra alertas quando dados estão inconsistentes

## 🐛 Testes Recomendados

### Teste 1: Limite de Vendas
1. Criar empresa no plano Free
2. Enviar 100 webhooks de vendas aprovadas
3. Enviar 101º webhook → Deve retornar erro 403

### Teste 2: Limite de Webhooks
1. Criar 3 webhooks via `/api/platforms/webhooks`
2. Tentar criar 4º → Deve retornar erro 403

### Teste 3: Limite de Contas
1. Adicionar 3 contas via `/api/facebook/accounts`
2. Tentar adicionar 4ª → Deve retornar erro 403

### Teste 4: Upgrade de Plano
1. Fazer upgrade para Premium
2. Verificar que limites aumentam (10 webhooks, 10 contas, 1000 vendas)

---

**Status:** Backend corrigido ✅  
**Próximo passo:** Deploy e testes em produção
