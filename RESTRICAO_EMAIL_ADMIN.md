# 🔐 Restrição de Email Administrativo - LomusTrack

## 🎯 Configuração de Segurança

**Apenas o email oficial da LomusTrack pode acessar o painel administrativo:**

### ✅ Email Permitido:
```
suporte@lomustrack.online
```

Qualquer outro email **NÃO** poderá fazer login como admin, owner ou superadmin, mesmo que tenha essas roles no banco de dados.

---

## 🔒 Como Funciona

### 1. Backend - Validação no Login
**Arquivo:** `reference/original-backend/api/auth/login.py`

Quando um usuário tenta fazer login, o sistema verifica:

```python
# Apenas suporte@lomustrack.online pode ser admin/superadmin
if admin.role.value in ["admin", "owner", "superadmin"]:
    if admin.email != "suporte@lomustrack.online":
        raise HTTPException(
            status_code=403, 
            detail="Acesso administrativo restrito. Apenas o email oficial pode acessar o painel admin."
        )
```

**Resultado:**
- ✅ `suporte@lomustrack.online` → Login permitido
- ❌ Qualquer outro email → HTTP 403 (acesso negado)

---

### 2. Frontend - Indicação Visual
**Arquivo:** `src/features/lomustrack/admin-login/index.tsx`

A página de login mostra claramente:
- Título: "Painel Administrativo"
- Descrição: **"Acesso exclusivo: suporte@lomustrack.online"**
- Placeholder do input: `suporte@lomustrack.online`

---

## 📋 Tipos de Usuário

### 🔵 Usuários Normais (Companies)
**Email:** Qualquer email  
**Roles:** `user`, `team_member`  
**Login:** `/login`  
**Dashboard:** `/dashboard`  
**Restrição:** ❌ Nenhuma

### 🔴 Administradores LomusTrack
**Email:** `suporte@lomustrack.online` **apenas**  
**Roles:** `admin`, `owner`, `superadmin`  
**Login:** `/admin-login`  
**Dashboard:** `/admin/dashboard`  
**Restrição:** ✅ Email fixo obrigatório

---

## 🚀 Setup Inicial

### 1. Criar conta superadmin no banco de dados

```sql
-- Inserir o único admin permitido
INSERT INTO admins (
    name, 
    email, 
    password_hash, 
    role, 
    company_id, 
    is_active,
    is_email_verified,
    created_at
) VALUES (
    'Suporte LomusTrack',
    'suporte@lomustrack.online',
    '$2b$12$HASH_DA_SENHA_AQUI',  -- Usar bcrypt para gerar
    'superadmin',
    NULL,  -- Superadmin não pertence a nenhuma empresa
    1,
    1,
    NOW()
);
```

### 2. Gerar hash da senha

**Python:**
```python
import bcrypt

password = "SuaSenhaSegura123!"
hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
print(hashed.decode('utf-8'))
```

**Node.js:**
```javascript
const bcrypt = require('bcrypt');

const password = 'SuaSenhaSegura123!';
const hash = bcrypt.hashSync(password, 12);
console.log(hash);
```

---

## 🔧 Atualizar Email Existente

Se você já tem uma conta admin com outro email, atualize para o email oficial:

```sql
-- Atualizar email de admin existente
UPDATE admins 
SET email = 'suporte@lomustrack.online'
WHERE role IN ('admin', 'owner', 'superadmin');

-- Garantir que é superadmin e sem empresa vinculada
UPDATE admins 
SET role = 'superadmin', company_id = NULL
WHERE email = 'suporte@lomustrack.online';
```

---

## 🛡️ Segurança

### Vantagens desta Abordagem:

✅ **Email único e controlado**  
- Apenas 1 email pode ser superadmin
- Fácil de auditar e monitorar

✅ **Proteção contra acesso não autorizado**  
- Mesmo com senha correta, email errado = bloqueado
- Impossível criar múltiplos superadmins acidentalmente

✅ **Separação clara de responsabilidades**  
- Usuários normais: qualquer email
- Administradores: apenas email oficial

✅ **Facilita compliance e auditoria**  
- Todos os logs administrativos apontam para 1 único email
- Rastreabilidade total de ações críticas

---

## 📊 Fluxo de Login

### Login de Usuário Normal (/login):
```
1. Usuário acessa /login
2. Digita email (qualquer): user@empresa.com
3. Digita senha
4. Sistema valida credenciais
5. ✅ Login aprovado → /dashboard
```

### Login de Admin (/admin-login):
```
1. Admin acessa /admin-login
2. Digita email: suporte@lomustrack.online
3. Digita senha
4. Sistema valida credenciais
5. Sistema verifica: email === "suporte@lomustrack.online"?
   - ✅ SIM → Login aprovado → /admin/dashboard
   - ❌ NÃO → HTTP 403 (acesso negado)
```

---

## ⚠️ Mensagens de Erro

### Erro 403 - Email Incorreto:
```
"Acesso administrativo restrito. Apenas o email oficial pode acessar o painel admin."
```

**Quando ocorre:**
- Email não é `suporte@lomustrack.online`
- Role é admin/owner/superadmin

### Erro 401 - Credenciais Inválidas:
```
"Invalid credentials"
```

**Quando ocorre:**
- Email ou senha incorretos
- Conta não existe

---

## 🔄 Recuperação de Senha

Apenas `suporte@lomustrack.online` pode recuperar senha de admin:

1. Acessar `/forgot-password`
2. Digitar `suporte@lomustrack.online`
3. Receber email com link de recuperação
4. Criar nova senha

**Outros emails:** Podem recuperar senha normalmente (para acessar como usuário comum).

---

## 📧 Configuração de Email

Para que o sistema envie emails (recuperação de senha, notificações), configure:

**Arquivo:** `.env`
```env
# Email de envio
FROM_EMAIL=suporte@lomustrack.online
VAPID_CLAIM_EMAIL=suporte@lomustrack.online

# API de email (Resend, SendGrid, etc.)
RESEND_API_KEY=re_xxxxxxxxxxxxx
```

---

## 🧪 Testes

### Testar Login Válido:
```bash
curl -X POST https://seu-backend.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "suporte@lomustrack.online",
    "password": "SuaSenha123"
  }'
```

**Resposta esperada:** HTTP 200 com token

---

### Testar Login Inválido (email errado):
```bash
curl -X POST https://seu-backend.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "outro@email.com",
    "password": "SuaSenha123"
  }'
```

**Resposta esperada:** HTTP 403
```json
{
  "detail": "Acesso administrativo restrito. Apenas o email oficial pode acessar o painel admin."
}
```

---

## 📖 Documentação Relacionada

- **COMO_VIRAR_SUPERADMIN.md** - Como configurar conta superadmin (atualizado)
- **PAGINAS_ADMIN.md** - Páginas do painel admin
- **GUIA_COMPLETO_AUTOMACAO.md** - Automação de regras e relatórios

---

## ❓ FAQ

### Posso adicionar outros emails como admin?
**Não.** O sistema está configurado para aceitar apenas `suporte@lomustrack.online`. Para adicionar outro email, você precisaria:
1. Alterar o código em `login.py`
2. Fazer deploy do backend atualizado

### E se eu perder acesso ao email suporte@lomustrack.online?
Você precisaria:
1. Acessar diretamente o banco de dados
2. Atualizar o email ou resetar a senha manualmente
3. Ou alterar o código para permitir outro email

### Posso ter múltiplos superadmins?
**Não com emails diferentes.** Apenas `suporte@lomustrack.online` pode ser superadmin. Mas você pode ter múltiplas sessões ativas do mesmo email em dispositivos diferentes.

### Usuários normais são afetados?
**Não.** Esta restrição **só** afeta roles administrativas (`admin`, `owner`, `superadmin`). Usuários com role `user` ou `team_member` podem usar qualquer email normalmente.

---

**Data de implementação:** 22 de novembro de 2026  
**Email oficial:** suporte@lomustrack.online  
**Status:** ✅ Ativo e funcional
