# ✅ Correção de Preços - LomusTrack

## 🎯 Problema Identificado

Os arquivos do backend Python tinham valores **desatualizados** de preços dos planos.

---

## 📊 Valores Corretos (Atualizados)

### Tabela de Preços Oficial:

| Plano | Preço/mês | Vendas Aprovadas | Contas | Webhooks | Automação |
|-------|-----------|------------------|---------|----------|-----------|
| **Free** | 0 MT | até 100 | 1 | 1 | ❌ |
| **Premium** | 500 MT | até 1.000 | 3 | 3 | ✅ |
| **Monster** | 2.000 MT | ilimitadas | ilimitado | ilimitado | ✅ |

**Excedente:** 0,50 MT por venda adicional nos planos pagos

---

## 🔧 Arquivos Corrigidos

### 1. Backend - Subscription Limits
**Arquivo:** `reference/original-backend/services/subscription_limits.py`

**Antes:**
```python
LOMUS_PLANS = {
    "free": {"name": "Gratuito", "monthly_price": 0, "sales_limit": 80, ...},
    "premium": {"name": "Premium", "monthly_price": 29, "sales_limit": 1000, ...},
    "monster": {"name": "Monster", "monthly_price": 79, "sales_limit": 5000, ...},
}
```

**Depois:**
```python
LOMUS_PLANS = {
    "free": {"name": "Gratuito", "monthly_price": 0, "sales_limit": 100, ...},
    "premium": {"name": "Premium", "monthly_price": 500, "sales_limit": 1000, ...},
    "monster": {"name": "Monster", "monthly_price": 2000, "sales_limit": None, ...},
}
```

---

### 2. Backend - Superadmin Companies
**Arquivo:** `reference/original-backend/api/superadmin/companies.py`

**Antes:**
```python
LOMUS_PLANS = {
    "free": {"name": "Gratuito", "monthly_price": 0},
    "premium": {"name": "Premium", "monthly_price": 29},
    "monster": {"name": "Monster", "monthly_price": 79},
}
```

**Depois:**
```python
LOMUS_PLANS = {
    "free": {"name": "Gratuito", "monthly_price": 0},
    "premium": {"name": "Premium", "monthly_price": 500},
    "monster": {"name": "Monster", "monthly_price": 2000},
}
```

---

### 3. Backend - Subscription Metrics
**Arquivo:** `reference/original-backend/api/subscriptions/metrics.py`

**Antes:**
```python
LOMUS_PLANS = {
    "free": {"name": "Gratuito", "monthly_price": 0, "sales_limit": 80, ...},
    "premium": {"name": "Premium", "monthly_price": 29, "sales_limit": 1000, ...},
    "monster": {"name": "Monster", "monthly_price": 79, "sales_limit": 5000, ...},
}
```

**Depois:**
```python
LOMUS_PLANS = {
    "free": {"name": "Gratuito", "monthly_price": 0, "sales_limit": 100, ...},
    "premium": {"name": "Premium", "monthly_price": 500, "sales_limit": 1000, ...},
    "monster": {"name": "Monster", "monthly_price": 2000, "sales_limit": None, ...},
}
```

---

## 📝 Mudanças Específicas

### Plano Free:
- ❌ Vendas: 80 → ✅ 100 vendas/mês

### Plano Premium:
- ❌ Preço: 29 MT → ✅ 500 MT/mês
- ✅ Vendas: 1.000 (mantido)

### Plano Monster:
- ❌ Preço: 79 MT → ✅ 2.000 MT/mês
- ❌ Vendas: 5.000 → ✅ ilimitadas (None)

---

## ✅ Frontend (Já estava correto)

**Arquivo:** `src/features/lomustrack/my-subscription/index.tsx`

O frontend já tinha os valores corretos documentados no código:

```typescript
// Preços sugeridos em Metical (MZN) para o backend:
// Free: 0 MT/mês - até 100 vendas
// Premium: 500 MT/mês - até 1.000 vendas  
// Monster: 2.000 MT/mês - vendas ilimitadas
// Excedente: 0,50 MT por venda adicional nos planos pagos
```

E na tabela de preços exibida ao usuário:
- Free: 0 MT/mês - até 100 vendas ✅
- Premium: 500 MT/mês - até 1.000 vendas ✅
- Monster: 2.000 MT/mês - vendas ilimitadas ✅

---

## 🚀 Próximos Passos

### 1. Deploy do Backend Atualizado
Para que os novos preços entrem em vigor, você precisa:

```bash
# 1. Fazer deploy do backend Python atualizado
# 2. Verificar que os endpoints estão retornando os valores corretos:

curl https://seu-backend.com/api/subscriptions/plans
```

**Resposta esperada:**
```json
{
  "plans": [
    {"id": "free", "name": "Gratuito", "monthly_price": 0, "sales_limit": 100},
    {"id": "premium", "name": "Premium", "monthly_price": 500, "sales_limit": 1000},
    {"id": "monster", "name": "Monster", "monthly_price": 2000, "sales_limit": null}
  ]
}
```

---

### 2. Atualizar Banco de Dados (se necessário)

Se você tem uma tabela `plans` no banco de dados, atualize:

```sql
-- Atualizar preços dos planos
UPDATE plans SET monthly_price = 500 WHERE id = 'premium';
UPDATE plans SET monthly_price = 2000 WHERE id = 'monster';
UPDATE plans SET sales_limit = 100 WHERE id = 'free';
UPDATE plans SET sales_limit = NULL WHERE id = 'monster';
```

---

### 3. Comunicar Mudanças aos Usuários

Se já existem usuários pagantes com os preços antigos (29 MT, 79 MT), você precisa decidir:

**Opção A:** Manter preço antigo para clientes existentes (grandfathering)
```sql
-- Adicionar campo legacy_price nas assinaturas
ALTER TABLE subscriptions ADD COLUMN legacy_price DECIMAL(10,2);

-- Marcar assinaturas antigas
UPDATE subscriptions 
SET legacy_price = 29 
WHERE plan_id = 'premium' AND created_at < '2026-11-22';
```

**Opção B:** Atualizar todos para novo preço
- Enviar email via painel admin explicando a mudança
- Dar aviso prévio (30 dias)

---

## 📊 Comparação de Preços

| Item | Valor Antigo | Valor Novo | Variação |
|------|--------------|------------|----------|
| Premium | 29 MT | 500 MT | +1.624% |
| Monster | 79 MT | 2.000 MT | +2.432% |
| Free vendas | 80 | 100 | +25% |
| Monster vendas | 5.000 | ilimitadas | ♾️ |

---

## 🔍 Verificação

Para confirmar que tudo está correto:

1. ✅ Backend Python atualizado (3 arquivos)
2. ✅ Frontend já estava correto
3. ⏳ Deploy do backend pendente
4. ⏳ Atualização do banco de dados (se aplicável)
5. ⏳ Comunicação com usuários existentes (se aplicável)

---

## 📖 Documentação Relacionada

- **PAGINAS_ADMIN.md** - Páginas do painel admin
- **GUIA_COMPLETO_AUTOMACAO.md** - Automação de regras e relatórios
- **COMO_VIRAR_SUPERADMIN.md** - Como virar superadmin

---

**Data da correção:** 22 de novembro de 2026  
**Arquivos alterados:** 3 arquivos Python no backend  
**Status:** ✅ Código corrigido, aguardando deploy
