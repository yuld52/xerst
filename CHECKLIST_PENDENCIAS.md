# ✅ Checklist de Pendências - LomusTrack

## 🎯 O que ainda precisa ser feito/configurado

---

## 🔴 CRÍTICO - Backend Não Deployado

### ❌ Backend com mudanças não está em produção

**Problema:**
- Código atualizado no GitHub
- Backend NÃO foi deployado
- Usuários ainda usam versão antiga

**Mudanças pendentes de deploy:**
1. ✅ Restrição de email para superadmin
2. ✅ Correção de preços (500 MT, 2.000 MT)
3. ✅ Fix timezone UTC nos relatórios
4. ✅ Login corrigido para owners/admins normais

**Solução:**
```bash
# Deploy do backend no Render/Railway/Vercel
# O backend está em: reference/original-backend/
```

**Status:** 🔴 **BLOQUEADOR** - Sem deploy, as correções não funcionam

---

## 🟡 IMPORTANTE - Fonte UberMove

### ❌ Arquivos da fonte não adicionados

**Problema:**
- Código CSS configurado ✅
- Arquivos `.woff2` e `.woff` FALTANDO ❌

**Solução:**
1. Criar pasta `public/fonts/`
2. Adicionar 6 arquivos:
   - UberMove-Regular.woff2
   - UberMove-Regular.woff
   - UberMove-Medium.woff2
   - UberMove-Medium.woff
   - UberMove-Bold.woff2
   - UberMove-Bold.woff

**Status:** 🟡 **VISUAL** - App funciona mas usa fonte fallback (Inter)

---

## 🟡 IMPORTANTE - Automação de Regras e Relatórios

### ❌ Cron jobs não configurados

**Problema:**
- Backend tem endpoints prontos ✅
- Documentação completa ✅
- Cron jobs no cron-job.org NÃO CRIADOS ❌

**O que configurar:**

#### Cron Job 1: Regras de Campanhas
```
Frequência: */10 * * * * (cada 10 minutos)
URL: https://seu-backend.com/api/automation/run
Method: GET
Headers: Authorization: Bearer SEU_TOKEN
```

#### Cron Job 2: Relatórios Push
```
Frequência: 0 */1 * * * (cada hora)
URL: https://seu-backend.com/api/automation/reports/run
Method: GET
Headers: Authorization: Bearer SEU_TOKEN
```

**Documentação:** `GUIA_COMPLETO_AUTOMACAO.md`

**Status:** 🟡 **FUNCIONALIDADE** - Sem isso, automação não funciona

---

## 🟡 IMPORTANTE - Superadmin no Banco de Dados

### ❌ Conta superadmin não criada

**Problema:**
- SQL pronto ✅
- Hash da senha gerado ✅
- NÃO EXECUTADO no banco de dados ❌

**SQL para executar:**
```sql
INSERT INTO admins (
    name, email, password_hash, role, company_id, 
    is_active, is_email_verified, two_factor_enabled,
    token_version, subscription_plan, preferences, created_at
) VALUES (
    'Suporte LomusTrack',
    'suporte@lomustrack.online',
    '$2b$12$PjHLusTkUC.V4.VIAwQ6teVti1rZWdBmsxINs9ve2wJ8SNOZZ2CUW',
    'superadmin',
    NULL,
    1, TRUE, FALSE, 1, 'free', '{}', NOW()
);
```

**Credenciais:**
- Email: `suporte@lomustrack.online`
- Senha: `yuld0000`

**Status:** 🟡 **ACESSO** - Sem isso, não acessa painel admin

---

## 🟢 OPCIONAL - Migração de Admins Antigos

### ⚠️ Admins antigos podem estar com roles erradas

**Problema:**
- Admins antigos podem ter `company_id` errado
- Dados da empresa podem ter "sumido"
- Roles podem estar incorretas

**Soluções disponíveis:**
- `SQL_TRANSFORMAR_ADMINS_EM_OWNERS.sql` - Transformar em owners
- `SQL_INVESTIGAR_DADOS_PERDIDOS.sql` - Encontrar dados perdidos
- `GUIA_RECUPERAR_DADOS.md` - Guia passo a passo

**Status:** 🟢 **CONFORME NECESSÁRIO** - Só se houver problema

---

## 🟢 OPCIONAL - Email de Produção

### ⚠️ Email pode não estar configurado

**Problema:**
- Recovery de senha usa email
- Notificações usam email
- Env vars podem não estar configuradas

**Verificar no backend (.env):**
```env
# Resend, SendGrid, ou outro
RESEND_API_KEY=re_xxxxxxxxxxxxx
FROM_EMAIL=suporte@lomustrack.online

# VAPID (push notifications)
VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
VAPID_CLAIM_EMAIL=suporte@lomustrack.online
```

**Status:** 🟢 **CONFORME USO** - Necessário se usar email/push

---

## 📊 Resumo por Status

### 🔴 CRÍTICO (Bloqueadores):
1. **Backend não deployado** - Correções não estão em produção

### 🟡 IMPORTANTE (Funcionalidades):
1. **Fonte UberMove** - Faltam arquivos
2. **Cron jobs** - Automação não configurada
3. **Superadmin** - Conta não criada no banco

### 🟢 OPCIONAL (Conforme necessário):
1. **Migração de admins** - Se houver problemas
2. **Email config** - Se usar email/push

---

## 🎯 Ordem Recomendada de Implementação

### 1️⃣ PRIMEIRO: Deploy do Backend
```bash
# No Render, Railway, Vercel, etc.
# Apontar para: reference/original-backend/
```

**Por quê:** Sem isso, nenhuma correção funciona em produção

---

### 2️⃣ SEGUNDO: Criar Superadmin
```sql
-- Executar SQL no banco de dados
INSERT INTO admins (...) VALUES (...);
```

**Por quê:** Necessário para acessar painel admin

---

### 3️⃣ TERCEIRO: Configurar Cron Jobs
```
1. Criar conta em cron-job.org
2. Adicionar 2 cron jobs (regras + relatórios)
3. Testar execução
```

**Por quê:** Ativa automação de campanhas e relatórios

---

### 4️⃣ QUARTO: Adicionar Fonte UberMove
```bash
# Copiar arquivos .woff2 e .woff para public/fonts/
npm run build
```

**Por quê:** Melhora visual do app

---

### 5️⃣ QUINTO: Verificar Admins Antigos
```sql
-- Ver estrutura de admins
SELECT email, role, company_id FROM admins;

-- Corrigir se necessário
```

**Por quê:** Evita problemas de acesso e dados perdidos

---

## 🧪 Como Testar Cada Item

### ✅ Testar Backend Deployado:
```bash
curl https://seu-backend.com/health
# Resposta esperada: {"status": "ok"}
```

---

### ✅ Testar Superadmin:
1. Acesse: `https://www.lomustrack.online/admin-login`
2. Email: `suporte@lomustrack.online`
3. Senha: `yuld0000`
4. Deve entrar em `/admin/dashboard`

---

### ✅ Testar Cron Jobs:
1. Acesse cron-job.org
2. Veja histórico de execuções
3. Deve ter status: `200 OK`

---

### ✅ Testar Fonte UberMove:
1. Abra DevTools (F12)
2. Console: `document.fonts.check('1em UberMove')`
3. Deve retornar: `true`

---

### ✅ Testar Login de Owner Normal:
1. Acesse: `https://www.lomustrack.online/login`
2. Use email de owner da empresa
3. Deve entrar em `/dashboard`

---

## 📖 Documentação de Referência

| Pendência | Documento |
|-----------|-----------|
| Backend deploy | README (criar) |
| Fonte UberMove | COMO_ADICIONAR_UBERMOVE.md |
| Automação | GUIA_COMPLETO_AUTOMACAO.md |
| Superadmin | SQL_CORRETO_CRIAR_SUPERADMIN.sql |
| Cron jobs | CRON_JOBS_SETUP.md |
| Dados perdidos | GUIA_RECUPERAR_DADOS.md |
| Login corrigido | CORRIGIDO_LOGIN.md |
| Preços | CORRECAO_PRECOS.md |

---

## 📅 Timeline Sugerida

### Hoje (Essencial):
- [ ] Deploy do backend
- [ ] Criar superadmin no banco

### Esta Semana:
- [ ] Configurar cron jobs
- [ ] Adicionar fonte UberMove
- [ ] Verificar admins antigos

### Quando Necessário:
- [ ] Configurar email de produção
- [ ] Recuperar dados perdidos (se houver)
- [ ] Ajustar roles de usuários

---

## ❓ Perguntas para Priorizar

1. **Backend está deployado?** 🔴
   - Não → PRIORIDADE 1

2. **Consegue fazer login como superadmin?** 🟡
   - Não → PRIORIDADE 2

3. **Automação está funcionando?** 🟡
   - Não → PRIORIDADE 3

4. **Fonte UberMove aparece?** 🟢
   - Não → PRIORIDADE 4

5. **Usuários relatam problemas?** 🟢
   - Sim → Investigar com SQLs de recuperação

---

**Última atualização:** 22 de novembro de 2026  
**Versão:** 1.0.0
