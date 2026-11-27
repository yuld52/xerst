# LomusTrack

**Sistema de Tracking e Gestão de Vendas para Moçambique**

Plataforma SaaS para rastreamento de vendas, automação de campanhas Meta Ads, relatórios agendados com IA e gestão multi-empresa.

- **Produção:** https://lomustrack.online

---

## Stack Tecnológico

- **Frontend:** React, TypeScript, TanStack Router, TanStack Query, TailwindCSS, shadcn/ui, Recharts, PWA (Service Worker).
- **Backend:** Python 3.12, FastAPI, SQLAlchemy, PostgreSQL (Supabase), OpenRouter AI, Meta Graph API (`v25.0`), Web Push (VAPID), Resend (email).
- **Deploy:** Vercel Services (`vercel.json` na raiz):
  - `app`: frontend TanStack Start (usa `/api` same-origin por padrão; manter `VITE_API_URL` vazio na Vercel).
  - `original-backend`: serviço FastAPI em `reference/original-backend/`.

---

## Setup Local

### 1. Variáveis de Ambiente

Copie os templates `.env.example` (raiz) e `reference/original-backend/.env.example` para `.env`.

Principais variáveis do **backend**:
- `DATABASE_URL`: string PostgreSQL (no Vercel/Supabase, usar **Transaction pooler**, porta `6543`, com caracteres especiais da senha em percent-encoding).
- `SECRET_KEY`: segredo forte para tokens de sessão.
- `CRON_SECRET`: token para proteger os endpoints de automação/cron.
- `OPENROUTER_API_KEY` (opcional `OPENROUTER_MODEL`, padrão `openrouter/free`): geração de relatórios com IA.
- `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_CLAIM_EMAIL`: notificações push.
- `RESEND_API_KEY`, `FROM_EMAIL`, `BASE_URL`: envio de emails e links de recuperação de senha.
- `CORS_ALLOWED_ORIGINS`: origens permitidas em cenários cross-origin.

Principais variáveis do **frontend** (`app`):
- `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` (browser).
- `SUPABASE_URL` e `SUPABASE_PUBLISHABLE_KEY` (SSR / middleware).
- Nunca expor `DATABASE_URL`, `SECRET_KEY`, `CRON_SECRET`, `OPENROUTER_API_KEY` ou `service_role` com prefixo `VITE_`.

### 2. Executar Localmente

```bash
# Backend
cd reference/original-backend
pip install -r requirements.txt
uvicorn app:app --host 0.0.0.0 --port 8000

# Frontend (na raiz)
npm install
npm run dev
```

---

## Banco de Dados (Supabase)

- **Banco novo:** execute `supabase/migrations/20261107000000_lomustrack_schema.sql` no SQL Editor do Supabase antes do deploy (o Vercel não roda migrações na inicialização por usar Transaction pooler). O script cria tabelas, índices, enums e habilita RLS bloqueando acesso direto de `anon` e `authenticated`.
- **Banco existente:** faça backup e aplique apenas as migrações pendentes em `reference/original-backend/database/migrations/`.
