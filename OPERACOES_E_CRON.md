# Operações, Automação, Cron & Admin

## Automação e Cron Jobs

A automação executa periodicamente via **cron-job.org** (ou Vercel Schedules) chamando os endpoints protegidos por `CRON_SECRET`.

### Endpoint Principal
- **URL:** `https://www.lomustrack.online/api/automation/run`
- **Método:** `GET`
- **Frequência recomendada:** `*/10 * * * *` (a cada 10 minutos — 144x/dia)
- **Header obrigatório:** `Authorization: Bearer <CRON_SECRET>`

O que ele executa:
1. **Regras de Campanhas:** avalia métricas (CPA, ROAS, orçamento) e ativa/pausa/ajusta campanhas no Meta Ads.
2. **Relatórios Agendados (Push + IA):** verifica horários configurados (`08:00`, `12:00`, `18:00`, `23:00` UTC) e envia resumos via Web Push (com suporte a OpenRouter AI).
3. **Retry de Notificações:** reenvia entregas pendentes/falhadas.

*(Alternativa em duas rotinas: `/api/automation/run` a cada 10–15 min e `/api/automation/reports/run` a cada 1 hora.)*

---

## Painel Administrativo (`/admin/*`)

O sistema possui rotas administrativas em `src/features/lomustrack/admin-*`:

1. **Dashboard (`/admin/dashboard`):**
   - **Owner/Admin:** resumo da equipe (total, ativos, convites pendentes).
   - **Superadmin:** finanças da plataforma (`/superadmin/financials`) e envio de email em massa (`POST /superadmin/settings/send-email`).
2. **Usuários (`/admin/users`):** gestão de administradores (`GET/POST/PATCH /superadmin/admins`).
3. **Assinaturas (`/admin/subscriptions`):** aprovação/rejeição de pedidos de upgrade (`GET /superadmin/companies`, `PATCH /superadmin/subscription-requests/{id}`).
4. **Configurações (`/admin/settings`):** parâmetros globais da plataforma (`GET/PATCH /superadmin/settings`).
5. **Operações (`/admin/operations`):** monitoramento e logs críticos.

---

## Superadmin

- **Restrição:** apenas o email `suporte@lomustrack.online` possui acesso de superadmin. Owners e admins normais utilizam seus próprios emails normalmente.
- Caso o superadmin ainda não exista no banco, crie o registro na tabela `admins` com `role = 'superadmin'`, `company_id = NULL`, `is_active = 1` e `is_email_verified = TRUE` utilizando um hash bcrypt válido.
