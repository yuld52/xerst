# 📋 Páginas do Painel Admin - LomusTrack

## 🎯 Visão Geral

O LomusTrack possui **7 páginas administrativas** organizadas no painel `/admin/*`:

---

## 📊 1. Dashboard (`/admin/dashboard`)

**Rota:** `/_management.admin.dashboard.tsx`  
**Componente:** `src/features/lomustrack/admin-dashboard/`

### Funcionalidades:

#### Para Admin/Owner:
- **Resumo da Equipe** (3 cards):
  - 👥 Total de Usuários
  - ✅ Usuários Ativos
  - ⏳ Convites Pendentes

#### Para Superadmin:
- **Finanças da LomusTrack** (4 cards):
  - 👥 **Assinantes** - Total de empresas assinantes
  - 💳 **Pagos** - Empresas com assinatura paga
  - 💰 **Receita** - Receita total em MZN
  - 📈 **Lucro** - Lucro total em MZN

- **📧 Envio de Email em Massa**:
  - Toggle "Todos os usuários" ou email específico
  - Campo de assunto
  - Editor de mensagem
  - CTA opcional (texto + link)
  - Botão "Enviar Email"

**Endpoint:** `GET /superadmin/financials`, `POST /superadmin/settings/send-email`

---

## 👥 2. Usuários (`/admin/users`)

**Rota:** `/_management.admin.users.tsx`  
**Componente:** `src/features/lomustrack/admin-users/`

### Funcionalidades:
- Lista todos os usuários administrativos
- Adicionar novo admin
- Editar perfil de admin
- Remover admin
- Ver permissões e acessos

**Endpoint:** `GET /superadmin/admins`, `POST /superadmin/admins`, `PATCH /superadmin/admins/{id}`

---

## 💳 3. Assinaturas (`/admin/subscriptions`)

**Rota:** `/_management.admin.subscriptions.tsx`  
**Componente:** `src/features/lomustrack/admin-billing/`

### Funcionalidades:
- **Lista de pedidos de upgrade** de empresas
- Ver detalhes da solicitação:
  - Nome da empresa
  - Email de contato
  - Plano solicitado
  - Data do pedido
  - Status atual
- **Ações:**
  - ✅ Aprovar assinatura
  - ❌ Rejeitar assinatura
- Histórico de aprovações/rejeições

**Endpoint:** `GET /superadmin/companies`, `PATCH /superadmin/subscription-requests/{id}`

---

## ⚙️ 4. Configurações (`/admin/settings`)

**Rota:** `/_management.admin.settings.tsx`  
**Componente:** `src/features/lomustrack/admin-settings/`

### Funcionalidades:
- Configurações gerais do sistema
- Parâmetros de plataforma
- Personalizações globais
- Integrações de terceiros

**Endpoint:** `GET /superadmin/settings`, `PATCH /superadmin/settings`

---

## 🔄 5. Operações (`/admin/operations`)

**Rota:** `/_management.admin.operations.tsx`  
**Componente:** `src/features/lomustrack/admin-operations/`

### Funcionalidades:
- Monitoramento de operações do sistema
- Logs de atividades críticas
- Status de serviços
- Métricas operacionais

**Endpoint:** `GET /superadmin/operations`

---

## 🏆 6. Prêmios (`/admin/awards`)

**Rota:** `/_management.admin.awards.tsx`  
**Componente:** `src/features/lomustrack/admin-awards/`

### Funcionalidades:
- Gerenciar sistema de gamificação
- Criar/editar prêmios
- Ver histórico de conquistas
- Configurar regras de prêmios

**Endpoint:** `GET /superadmin/awards`, `POST /superadmin/awards`

---

## 🤖 7. OpenRouter/Gemini (`/admin/gemini`)

**Rota:** `/_management.admin.gemini.tsx`  
**Componente:** `src/features/lomustrack/admin-gemini/`

### Funcionalidades:
- Configuração de API do OpenRouter
- Gerenciar modelos de IA
- Monitorar uso de créditos
- Logs de requisições à IA

**Endpoint:** `GET /superadmin/gemini-settings`, `PATCH /superadmin/gemini-settings`

---

## 🔐 Níveis de Acesso

### 1. **Owner** (dono da empresa)
- Acesso limitado ao dashboard da própria empresa
- Vê apenas "Resumo da Equipe"
- Não vê finanças globais

### 2. **Admin** (administrador da empresa)
- Mesmo nível que Owner
- Gerencia usuários da própria empresa

### 3. **Superadmin** (administrador da plataforma)
- Acesso total a todas as 7 páginas
- Vê finanças globais da plataforma
- Aprova/rejeita assinaturas
- Envia emails em massa
- Não está vinculado a nenhuma empresa (`company_id = NULL`)

---

## 🗺️ Estrutura de Rotas

```
/_management (Layout Admin)
├── /admin/dashboard      → Dashboard principal
├── /admin/users          → Gestão de usuários admin
├── /admin/subscriptions  → Pedidos de upgrade
├── /admin/settings       → Configurações gerais
├── /admin/operations     → Operações do sistema
├── /admin/awards         → Sistema de prêmios
└── /admin/gemini         → OpenRouter/IA
```

---

## 🎨 Layout Compartilhado

Todas as páginas usam o mesmo layout:

**Componente:** `src/components/layout/AdminLayout.tsx`

**Inclui:**
- Sidebar com navegação
- Header com perfil do admin
- Breadcrumbs
- Notificações
- Tema claro/escuro

---

## 📱 Navegação Principal

A sidebar do admin contém:

1. 📊 Dashboard
2. 👥 Usuários
3. 💳 Assinaturas (apenas superadmin)
4. ⚙️ Configurações
5. 🔄 Operações
6. 🏆 Prêmios
7. 🤖 OpenRouter

---

## 🚀 Como Acessar

### URL base:
```
https://seu-dominio.com/admin/login
```

### Depois do login:
```
https://seu-dominio.com/admin/dashboard
```

---

## ⚡ Features Recentes Adicionadas

### ✅ Dashboard Superadmin
- Cards de receita e lucro com emojis
- EmailSender com toggle de destinatários
- Integração com endpoint `/superadmin/financials`

### ✅ Página de Assinaturas
- Já existia, agora visível para superadmin
- Botões de aprovar/rejeitar funcionais

### ✅ Sistema de Emails
- Envio individual ou em massa
- CTA configurável
- Preview antes de enviar

---

## 📖 Guias Relacionados

- **COMO_VIRAR_SUPERADMIN.md** - Como promover conta para superadmin
- **GUIA_COMPLETO_AUTOMACAO.md** - Configurar automação de regras e relatórios
- **CRON_JOBS_SETUP.md** - Setup de cron jobs no cron-job.org

---

## 🔧 Troubleshooting

### Não vejo as páginas de superadmin
**Solução:** Execute o SQL para promover sua conta:
```sql
UPDATE admins 
SET role = 'superadmin', company_id = NULL 
WHERE email = 'seu-email@exemplo.com';
```

### Erro 403 ao acessar endpoints
**Solução:** Verifique se o token JWT contém `role: 'superadmin'`

### Cards de receita não aparecem
**Solução:** Faça logout, limpe cache, faça login novamente

---

## 📊 Resumo de Endpoints

| Página | Método | Endpoint | Descrição |
|--------|--------|----------|-----------|
| Dashboard | GET | `/superadmin/financials` | Dados financeiros |
| Dashboard | POST | `/superadmin/settings/send-email` | Enviar email |
| Usuários | GET | `/superadmin/admins` | Listar admins |
| Assinaturas | GET | `/superadmin/companies` | Listar empresas |
| Assinaturas | PATCH | `/superadmin/subscription-requests/{id}` | Aprovar/rejeitar |
| Configurações | GET/PATCH | `/superadmin/settings` | Config globais |
| Operações | GET | `/superadmin/operations` | Logs operacionais |
| Prêmios | GET/POST | `/superadmin/awards` | Gerenciar prêmios |
| OpenRouter | GET/PATCH | `/superadmin/gemini-settings` | Config IA |

---

**Última atualização:** 22 de novembro de 2026  
**Versão:** 1.0.0  
**Mantido por:** Equipe LomusTrack
