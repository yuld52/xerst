# 📚 Índice da Documentação LomusTrack

## 🚀 Início Rápido

| Documento | Descrição | Quando Usar |
|-----------|-----------|-------------|
| [COMANDOS_PARA_EXECUTAR.md](COMANDOS_PARA_EXECUTAR.md) | Comandos prontos para copiar e colar | 🔥 **COMECE AQUI** - Setup inicial |
| [COMO_CONFIGURAR_CRON_JOB_ORG.md](COMO_CONFIGURAR_CRON_JOB_ORG.md) | Guia rápido em 3 passos | Setup do cron-job.org |
| [RESUMO_CONFIGURACAO_CRON.md](RESUMO_CONFIGURACAO_CRON.md) | Visão geral do que foi feito | Entender as mudanças |

---

## 🤖 Automação e Cron Jobs

| Documento | Linhas | Descrição |
|-----------|--------|-----------|
| [GUIA_COMPLETO_AUTOMACAO.md](GUIA_COMPLETO_AUTOMACAO.md) | ~891 | Guia técnico completo da automação |
| [CONFIGURACAO_CRON_JOB_ORG.md](CONFIGURACAO_CRON_JOB_ORG.md) | ~500 | Configuração detalhada do cron-job.org |
| [CRON_JOBS_SETUP.md](CRON_JOBS_SETUP.md) | - | Setup de cron jobs |
| [CRON_JOBS_CONFIGURADOS.md](CRON_JOBS_CONFIGURADOS.md) | - | Documentação da configuração atual (*/10) |
| [COMO_CONFIGURAR_AUTOMACAO.md](COMO_CONFIGURAR_AUTOMACAO.md) | - | Como configurar a automação |
| [README_AUTOMACAO.md](README_AUTOMACAO.md) | - | Readme da automação |

---

## 👨‍💼 Superadmin e Autenticação

| Documento | Descrição |
|-----------|-----------|
| [COMO_VIRAR_SUPERADMIN.md](COMO_VIRAR_SUPERADMIN.md) | Como criar conta superadmin |
| [SQL_CRIAR_SUPERADMIN.md](SQL_CRIAR_SUPERADMIN.md) | SQL para criar superadmin |
| [SQL_CORRETO_CRIAR_SUPERADMIN.sql](SQL_CORRETO_CRIAR_SUPERADMIN.sql) | Script SQL pronto |
| [RESTRICAO_EMAIL_ADMIN.md](RESTRICAO_EMAIL_ADMIN.md) | Restrição de email para superadmin |
| [CORRIGIDO_LOGIN.md](CORRIGIDO_LOGIN.md) | Correção do login para owners/admins |

---

## 🗄️ Migrações e SQL

| Documento | Descrição |
|-----------|-----------|
| [SQL_TRANSFORMAR_ADMINS_EM_OWNERS.sql](SQL_TRANSFORMAR_ADMINS_EM_OWNERS.sql) | Migrar admins antigos para owners |
| [SQL_MIGRAR_ADMINS_ANTIGOS.sql](SQL_MIGRAR_ADMINS_ANTIGOS.sql) | Transformar admins em users normais |
| [SQL_INVESTIGAR_DADOS_PERDIDOS.sql](SQL_INVESTIGAR_DADOS_PERDIDOS.sql) | Investigar dados perdidos após migração |
| [GUIA_RECUPERAR_DADOS.md](GUIA_RECUPERAR_DADOS.md) | Como recuperar dados perdidos |

---

## 💰 Preços e Subscrições

| Documento | Descrição |
|-----------|-----------|
| [CORRECAO_PRECOS.md](CORRECAO_PRECOS.md) | Correção dos preços (500/2000 MT) |

**Preços Corretos:**
- **Free**: 0 MT - 100 vendas
- **Premium**: 500 MT - 1.000 vendas
- **Monster**: 2.000 MT - Ilimitado

---

## 🎨 Frontend e UI

| Documento | Descrição |
|-----------|-----------|
| [FONTE_FINAL.md](FONTE_FINAL.md) | Decisão final sobre fonte (Inter Variable) |
| [UBERMOVE_FONTE_ANALISE.md](UBERMOVE_FONTE_ANALISE.md) | Análise da fonte UberMove |
| [COMO_ADICIONAR_UBERMOVE.md](COMO_ADICIONAR_UBERMOVE.md) | Tentativa de adicionar UberMove (descontinuado) |

---

## 🛠️ Admin Panel

| Documento | Descrição |
|-----------|-----------|
| [PAGINAS_ADMIN.md](PAGINAS_ADMIN.md) | Documentação de todas as 7 páginas do admin |

**Páginas Documentadas:**
1. Dashboard (`/admin-dashboard`)
2. Gerenciar Empresas (`/admin-companies`)
3. Gerenciar Usuários (`/admin-users`)
4. Subscrições e Métricas (`/admin-subscriptions`)
5. Configurações do Sistema (`/admin-settings`)
6. Operações e Logs (`/admin-operations`)
7. Configuração Gemini AI (`/admin-gemini`)

---

## ✅ Status e Verificações

| Documento | Descrição |
|-----------|-----------|
| [VERIFICACAO_FINAL_OK.md](VERIFICACAO_FINAL_OK.md) | Verificação de status (95% completo) |
| [CHECKLIST_PENDENCIAS.md](CHECKLIST_PENDENCIAS.md) | Checklist de pendências |
| [RESUMO_FINAL_PENDENCIAS.md](RESUMO_FINAL_PENDENCIAS.md) | Resumo das pendências finais |

---

## 📂 Arquivos de Configuração

| Arquivo | Localização | Descrição |
|---------|-------------|-----------|
| `.env.example` | `reference/original-backend/` | Template de variáveis de ambiente |
| `app.py` | `reference/original-backend/` | Configuração principal do FastAPI |
| `automation.py` | `reference/original-backend/api/` | Lógica de automação |
| `login.py` | `reference/original-backend/api/auth/` | Restrição de email superadmin |
| `subscription_limits.py` | `reference/original-backend/services/` | Limites e preços dos planos |

---

## 🔑 Credenciais Importantes

### Superadmin:
```
Email: suporte@lomustrack.online
Senha: yuld0000
```

### Token de Exemplo (CRON_SECRET):
```
LomusTrack_2024_AutomationSecretKey_XyZ123!
```

---

## 🌐 URLs Importantes

| Recurso | URL |
|---------|-----|
| Frontend | https://lomustrack.online |
| Admin Login | https://lomustrack.online/admin-login |
| API Health | https://lomustrack.online/api/health |
| Automação | https://lomustrack.online/api/automation/run |
| Console Cron | https://console.cron-job.org/ |

---

## 📊 Estatísticas da Documentação

| Métrica | Valor |
|---------|-------|
| **Total de Documentos** | 24 arquivos |
| **Linhas Totais** | ~7.500 linhas |
| **Guias de Automação** | 6 documentos |
| **Guias de SQL** | 4 documentos |
| **Guias de Admin** | 3 documentos |
| **Guias de Configuração** | 5 documentos |
| **Guias de Status** | 3 documentos |
| **Guias de Frontend** | 3 documentos |

---

## 🎯 Fluxo de Deploy Recomendado

1. ✅ **Ler documentação** → [COMANDOS_PARA_EXECUTAR.md](COMANDOS_PARA_EXECUTAR.md)
2. ⏳ **Configurar variáveis** → Ver seção "No Servidor de Produção"
3. ⏳ **Deploy backend** → `reference/original-backend/`
4. ⏳ **Criar superadmin** → [SQL_CORRETO_CRIAR_SUPERADMIN.sql](SQL_CORRETO_CRIAR_SUPERADMIN.sql)
5. ⏳ **Configurar cron-job.org** → [COMO_CONFIGURAR_CRON_JOB_ORG.md](COMO_CONFIGURAR_CRON_JOB_ORG.md)
6. ⏳ **Testar automação** → Aguardar 10 minutos
7. ⏳ **Verificar logs** → cron-job.org Execution History

---

## 🆘 Troubleshooting Rápido

| Problema | Documento |
|----------|-----------|
| Erro 401 no cron | [CONFIGURACAO_CRON_JOB_ORG.md](CONFIGURACAO_CRON_JOB_ORG.md) → Seção 8.1 |
| Erro de CORS | [CONFIGURACAO_CRON_JOB_ORG.md](CONFIGURACAO_CRON_JOB_ORG.md) → Seção 8.4 |
| Dados perdidos | [GUIA_RECUPERAR_DADOS.md](GUIA_RECUPERAR_DADOS.md) |
| Login não funciona | [CORRIGIDO_LOGIN.md](CORRIGIDO_LOGIN.md) |
| Preços errados | [CORRECAO_PRECOS.md](CORRECAO_PRECOS.md) |
| Lock travado | [COMANDOS_PARA_EXECUTAR.md](COMANDOS_PARA_EXECUTAR.md) → Seção 7 |

---

## 💡 Dica: Como Navegar

### Para Setup Inicial:
1. [COMANDOS_PARA_EXECUTAR.md](COMANDOS_PARA_EXECUTAR.md) (comandos prontos)
2. [COMO_CONFIGURAR_CRON_JOB_ORG.md](COMO_CONFIGURAR_CRON_JOB_ORG.md) (guia rápido)

### Para Entender Tecnicamente:
1. [GUIA_COMPLETO_AUTOMACAO.md](GUIA_COMPLETO_AUTOMACAO.md) (891 linhas técnicas)
2. [CONFIGURACAO_CRON_JOB_ORG.md](CONFIGURACAO_CRON_JOB_ORG.md) (500 linhas detalhadas)

### Para Troubleshooting:
1. [CONFIGURACAO_CRON_JOB_ORG.md](CONFIGURACAO_CRON_JOB_ORG.md) → Seção 8
2. [COMANDOS_PARA_EXECUTAR.md](COMANDOS_PARA_EXECUTAR.md) → Seção 7

### Para Verificar Status:
1. [VERIFICACAO_FINAL_OK.md](VERIFICACAO_FINAL_OK.md)
2. [RESUMO_CONFIGURACAO_CRON.md](RESUMO_CONFIGURACAO_CRON.md)

---

**Última atualização**: 2024
**Status do Projeto**: 95% completo - Backend 100% pronto, aguardando deploy
