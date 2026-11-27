# LomusTrack

**Sistema de Tracking e Gestão de Vendas para Moçambique**

Plataforma completa de rastreamento de vendas, automação de campanhas e análise de métricas para empresas em Moçambique.

**Live app**: https://lomustrack.online

---

## 🚀 Início Rápido

### Para Deploy e Configuração:
👉 **[COMANDOS_PARA_EXECUTAR.md](COMANDOS_PARA_EXECUTAR.md)** - Comece aqui!

### Documentação Completa:
📚 **[INDICE_DOCUMENTACAO.md](INDICE_DOCUMENTACAO.md)** - Índice de todos os guias

---

## 📦 O que é o LomusTrack?

LomusTrack é uma plataforma SaaS que oferece:

- 📊 **Dashboard em Tempo Real** - Métricas de vendas e campanhas
- 🤖 **Automação de Campanhas** - Regras automáticas para Facebook Ads
- 📱 **Notificações Push** - Relatórios agendados automáticos
- 👥 **Multi-empresa** - Gerenciamento de múltiplas empresas
- 🎯 **Rastreamento UTM** - Tracking completo de campanhas
- 💰 **Gestão de Subscrições** - Planos Free, Premium e Monster
- 🤝 **Integração Facebook Ads** - Gestão completa de campanhas

---

## 🛠️ Stack Tecnológico

### Frontend:
- **React** + **TypeScript**
- **TanStack Router** (file-based routing)
- **TailwindCSS** + **shadcn/ui**
- **Tanstack Query** (React Query)
- **PWA** com Service Worker
- **Inter Variable** font

### Backend:
- **Python** + **FastAPI**
- **PostgreSQL** (Supabase)
- **SQLAlchemy** ORM
- **OpenRouter AI** (relatórios automáticos)
- **Meta Ads API** (Facebook/Instagram)

### Automação:
- **cron-job.org** (execução a cada 10 minutos)
- **Push Notifications** (VAPID)
- **Campaign Rules Engine**

---

## ⚙️ Configuração

### 1. Variáveis de Ambiente

Copie o template:
```bash
cp reference/original-backend/.env.example reference/original-backend/.env
```

Preencha as variáveis obrigatórias:
```bash
DATABASE_URL=postgresql://...
CRON_SECRET=seu-token-secreto-forte
CORS_ALLOWED_ORIGINS=https://lomustrack.online,https://api.cron-job.org
OPENROUTER_API_KEY=sk-or-v1-...
```

### 2. Backend

```bash
cd reference/original-backend
pip install -r requirements.txt
uvicorn app:app --host 0.0.0.0 --port 8000
```

### 3. Frontend

```bash
npm install
npm run dev
```

---

## 📚 Documentação Principal

| Documento | Descrição |
|-----------|-----------|
| [COMANDOS_PARA_EXECUTAR.md](COMANDOS_PARA_EXECUTAR.md) | 🔥 Comandos prontos para setup |
| [COMO_CONFIGURAR_CRON_JOB_ORG.md](COMO_CONFIGURAR_CRON_JOB_ORG.md) | Configuração do cron-job.org |
| [GUIA_COMPLETO_AUTOMACAO.md](GUIA_COMPLETO_AUTOMACAO.md) | Guia técnico completo (891 linhas) |
| [INDICE_DOCUMENTACAO.md](INDICE_DOCUMENTACAO.md) | Índice completo de todos os guias |

**Total**: 24+ documentos, ~7.500 linhas de documentação

---

## 🤖 Automação

A plataforma executa automaticamente **a cada 10 minutos** (144x por dia):

1. ✅ **Regras de Campanha** - Ativa/pausa/ajusta orçamentos baseado em métricas
2. 📊 **Relatórios Agendados** - Envia notificações push (08:00, 12:00, 18:00, 23:00 UTC)
3. 🔄 **Retry de Notificações** - Reenvia notificações que falharam

Configurado via **cron-job.org** → ver [COMO_CONFIGURAR_CRON_JOB_ORG.md](COMO_CONFIGURAR_CRON_JOB_ORG.md)

---

## 💰 Planos e Preços

| Plano | Preço | Limite de Vendas |
|-------|-------|------------------|
| **Free** | 0 MT | 100 vendas |
| **Premium** | 500 MT/mês | 1.000 vendas |
| **Monster** | 2.000 MT/mês | Ilimitado |

---

## 👨‍💼 Superadmin

**Email**: `suporte@lomustrack.online`  
**Senha**: `yuld0000`

Apenas este email pode fazer login como superadmin. Owners e admins normais podem usar qualquer email.

Ver: [RESTRICAO_EMAIL_ADMIN.md](RESTRICAO_EMAIL_ADMIN.md)

---

## 📊 Status do Projeto

| Componente | Status |
|------------|--------|
| Frontend | ✅ 100% |
| Backend Code | ✅ 100% |
| Documentação | ✅ 100% |
| Deploy Backend | ⏳ Pendente |
| Automação Setup | ⏳ Pendente |

**Projeto 95% completo** - Código 100% pronto, aguardando deploy.

---

## 🔧 Troubleshooting

Ver seção de troubleshooting em:
- [CONFIGURACAO_CRON_JOB_ORG.md](CONFIGURACAO_CRON_JOB_ORG.md) - Seção 8
- [COMANDOS_PARA_EXECUTAR.md](COMANDOS_PARA_EXECUTAR.md) - Seção 7

---

## 📞 Suporte

- **Email**: suporte@lomustrack.online
- **Documentação**: Ver [INDICE_DOCUMENTACAO.md](INDICE_DOCUMENTACAO.md)

---

## 🌟 Built with Lovable

Imported website: https://github.com/yuldchissico-alt/jkddj.git

This project was built with [Lovable](https://lovable.dev)

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/3c527fad-56e0-4def-98ad-7011ef4a0e0c).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
