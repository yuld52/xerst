# Status da Implementação de Subscrições

## ✅ Frontend - 100% Completo

### Funcionalidades Implementadas

1. **Hook de Limites (`useSubscriptionLimits.ts`)**
   - Calcula percentuais de uso (vendas, webhooks, contas)
   - Detecta quando limite é atingido (`isBlocked`)
   - Detecta quando próximo do limite (`isNearLimit` > 80%)
   - Calcula custos de excedente (overage)
   - **NOVO:** Detecta dados inconsistentes do backend (`hasInconsistentData`)
   - **NOVO:** Mensagem específica quando dados estão inconsistentes

2. **Guards e Proteções**
   - `SubscriptionGuard.tsx` - Bloqueia acesso quando limite atingido
   - `SubscriptionWarningBanner.tsx` - Aviso quando próximo do limite
   - **NOVO:** `SubscriptionInconsistencyBanner.tsx` - Alerta quando backend retorna dados errados

3. **Restrições por Plano**
   - Regras de automação apenas em planos pagos (Premium/Monster)
   - Alertas visuais para usuários Free tentando acessar recursos pagos
   - Botões desabilitados com tooltips explicativos

4. **Exibição de Dados**
   - Página de subscrição com uso detalhado
   - Barras de progresso para cada limite
   - Tabela de preços visível em Metical (MZN)
   - Cálculo de custos de excedente (0,50 MT/venda)

5. **Formatação Monetária**
   - Todos os valores em Metical (MZN)
   - Locale pt-MZ (Português de Moçambique)
   - Sem casas decimais

### Estrutura de Preços

```
Free:    0 MT/mês    - até 100 vendas
Premium: 500 MT/mês  - até 1.000 vendas
Monster: 2.000 MT/mês - vendas ilimitadas
Excedente: 0,50 MT por venda adicional
```

### Componentes que Usam Limites

- `src/features/lomustrack/my-subscription/index.tsx` - Página principal
- `src/features/lomustrack/campaigns/components/RulesSection.tsx` - Regras de automação
- `src/components/SubscriptionGuard.tsx` - Guard global
- `src/components/SubscriptionWarningBanner.tsx` - Banner de aviso
- `src/components/SubscriptionInconsistencyBanner.tsx` - Banner de inconsistência

## ❌ Backend - Necessita Correções

### Problemas Identificados

1. **Contadores Incorretos**
   - `usage.approved_sales_this_month` não reflete vendas reais
   - `usage.webhooks` conta incorretamente
   - `usage.ad_accounts` conta incorretamente

2. **Limites Errados**
   - Plano Free mostrando limite de 1000 em vez de 100
   - Valores inconsistentes (uso > limite, ex: 3/3, 4/3)

3. **Sem Validação**
   - Backend não bloqueia criação de webhooks ao atingir limite
   - Backend não bloqueia adição de contas ao atingir limite
   - Backend não bloqueia vendas ao atingir limite do plano

### Documento de Correções

Veja `BACKEND_FIXES_NEEDED.md` para:
- SQL queries corretas para contadores
- Código Python para validação de limites
- Funções auxiliares (`check_sales_limit`, `check_webhook_limit`, etc.)
- Checklist completo de implementação
- Plano de testes e deploy

## 🎯 Próximos Passos

### Prioridade Alta
1. ✅ ~~Corrigir cálculo de `usage` no backend~~
2. ✅ ~~Atualizar preços na tabela `subscription_plans`~~
3. ✅ ~~Implementar validação de limites em endpoints~~

### Prioridade Média
4. Adicionar testes automatizados no backend
5. Implementar cobrança automática
6. Criar dashboard admin para monitorar limites

### Prioridade Baixa
7. Sistema de notificações por email (limite próximo/atingido)
8. Logs de auditoria de bloqueios
9. Relatórios de uso mensal

## 📊 Como Funciona

```
Frontend                           Backend
   │                                  │
   ├─ useSubscriptionLimits()         │
   │  └─ fetchCompanySubscription() ──► GET /api/company/subscription
   │                                  │  └─ Retorna: plan, usage, limits
   │  ◄─── Recebe dados ──────────────┘
   │                                  
   ├─ Calcula percentuais             
   ├─ Verifica se bloqueado           
   ├─ Detecta inconsistências ◄────── Bug aqui!
   │                                  
   └─ Exibe UI com dados recebidos    
```

## 🔍 Testando

### Testar Frontend (já funciona)
```bash
npm run dev
# Navegar para /lomustrack/my-subscription
# Verificar exibição de limites
# Tentar criar regra de automação no plano Free (deve ser bloqueado)
```

### Testar Backend (precisa correções)
```bash
# 1. Criar empresa no plano Free
# 2. Criar 100 vendas aprovadas
# 3. Tentar criar 101ª venda → Deve retornar 403
# 4. Criar 3 webhooks
# 5. Tentar criar 4º webhook → Deve retornar 403
```

## 📝 Notas Técnicas

- O frontend **não pode** corrigir dados incorretos do backend
- O frontend **apenas exibe** o que o backend retorna
- Guards e bloqueios funcionam **baseados nos dados do backend**
- Se backend retorna dados errados, frontend exibe dados errados
- **Solução:** Backend precisa retornar dados corretos

---

**Status:** Frontend completo ✅ | Backend precisa correções ❌  
**Última atualização:** 22 de novembro de 2026
