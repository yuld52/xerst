# Planos, Status e Pendências

## Planos e Preços (MZN)

| Plano | Preço Mensal | Limite de Vendas | Recursos |
|-------|--------------|------------------|----------|
| **Free** | 0 MT | 100 vendas | Tracking básico |
| **Premium** | 500 MT/mês | 1.000 vendas | Regras de automação e relatórios |
| **Monster** | 2.000 MT/mês | Ilimitado | Todos os recursos |

- **Excedente:** `0,50 MT` por venda adicional.
- **Formatação:** valores exibidos em Metical (MZN), locale `pt-MZ`.

---

## O que já está implementado

- **Frontend:**
  - Dashboard completo com KPIs, gráficos (Performance Diária, Vendas por Pagamento, Vendas por Hora, Campanhas, Localização), filtros e builder de widgets.
  - Guards e banners de limite de subscrição (`useSubscriptionLimits`, `SubscriptionGuard`, `SubscriptionWarningBanner`, `SubscriptionInconsistencyBanner`).
  - Bloqueio de automação para plano Free e fluxo de upgrade em `my-subscription`.
  - Painel `/admin/*` e autenticação (login, cadastro, verificação de email e reset de senha).
- **Backend & Infra:**
  - Endpoints `/api/health` e `/api/automation/run` operacionais com autenticação por `CRON_SECRET`.
  - Remoção de credenciais hardcoded do código-fonte (devem ficar apenas em `.env` local ou variáveis da Vercel).

---

## Pontos de Atenção e Pendências

1. **Consistência de Limites no Backend:** garantir que `usage.approved_sales_this_month`, `usage.webhooks` e `usage.ad_accounts` retornem contagens reais e bloqueiem criações ao atingir o limite do plano (ex.: Free = 100 vendas).
2. **Preços e Timezone em Produção:** confirmar que o backend em produção está atualizado com os preços atuais (`500 MT` / `2.000 MT`) e timezone correto nos relatórios agendados.
3. **Fontes (`public/fonts`):** confirmar a presença dos arquivos `UberMove-{Regular,Medium,Bold}.{woff,woff2}` se desejar usar UberMove em vez do fallback `Inter`.
4. **Rotação de Credenciais:** se o repositório foi usado anteriormente com credenciais antigas no histórico Git, rotacionar senha do PostgreSQL e par de chaves VAPID nos provedores.
