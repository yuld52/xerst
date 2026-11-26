# 🔐 SQL para Criar Superadmin - LomusTrack

## ✅ SQL Corrigido (PostgreSQL)

### 1. Gerar Hash da Senha Primeiro

**Python:**
```python
import bcrypt

password = "SuaSenhaSegura123!"
hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
print(hashed.decode('utf-8'))
```

**Resultado exemplo:**
```
$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/Lez2.0lGKgAyFCfGK
```

---

### 2. Inserir Admin no Banco de Dados

**⚠️ IMPORTANTE:** Use `TRUE` (boolean) e não `1` (integer)

```sql
-- Inserir o superadmin oficial
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
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/Lez2.0lGKgAyFCfGK',  -- Substituir pelo hash real
    'superadmin',
    NULL,
    TRUE,   -- ✅ BOOLEAN, não 1
    TRUE,   -- ✅ BOOLEAN, não 1
    NOW()
);
```

---

### 3. Verificar se foi criado

```sql
SELECT id, name, email, role, company_id, is_active, is_email_verified
FROM admins 
WHERE email = 'suporte@lomustrack.online';
```

**Resultado esperado:**
```
 id |        name        |           email               |    role    | company_id | is_active | is_email_verified
----+--------------------+-------------------------------+------------+------------+-----------+-------------------
  1 | Suporte LomusTrack | suporte@lomustrack.online     | superadmin |       NULL |     t     |         t
```

---

## 🔄 Atualizar Admin Existente

Se você já tem um admin e quer transformá-lo em superadmin com o email correto:

```sql
-- Atualizar email, role e company_id de um admin existente
UPDATE admins 
SET 
    email = 'suporte@lomustrack.online',
    role = 'superadmin',
    company_id = NULL,
    is_active = 1,              -- INTEGER
    is_email_verified = TRUE    -- BOOLEAN
WHERE id = 1;  -- Substituir pelo ID do admin existente
```

---

## 🧪 Testar Login

Depois de criar/atualizar, teste o login:

```bash
curl -X POST https://seu-backend.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "suporte@lomustrack.online",
    "password": "SuaSenhaSegura123!"
  }'
```

**Resposta esperada (HTTP 200):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "name": "Suporte LomusTrack",
    "email": "suporte@lomustrack.online",
    "role": "superadmin"
  }
}
```

---

## ❌ Erros Comuns

### Erro: "column is of type integer but expression is of type boolean"

**Causa:** Campo `is_active` é INTEGER mas você passou TRUE/FALSE

**Solução:**
```sql
-- ❌ ERRADO
is_active = TRUE

-- ✅ CORRETO
is_active = 1
```

---

### Erro: "column is of type boolean but expression is of type integer"

**Causa:** Campo `is_email_verified` é BOOLEAN mas você passou 0/1

**Solução:**
```sql
-- ❌ ERRADO
is_email_verified = 1

-- ✅ CORRETO
is_email_verified = TRUE
```

---

### ⚠️ Resumo dos Tipos:

Este banco tem **tipos mistos**:
- `is_active` → **INTEGER** (use `1` ou `0`)
- `is_email_verified` → **BOOLEAN** (use `TRUE` ou `FALSE`)

---

### Erro: "duplicate key value violates unique constraint"

**Causa:** Email já existe no banco

**Solução:** Use UPDATE em vez de INSERT
```sql
UPDATE admins 
SET 
    role = 'superadmin',
    company_id = NULL,
    is_active = 1,              -- INTEGER
    is_email_verified = TRUE    -- BOOLEAN
WHERE email = 'suporte@lomustrack.online';
```

---

### Erro: "invalid input syntax for type user_role"

**Causa:** Valor de role inválido

**Solução:** Use exatamente `'superadmin'` (com aspas simples)
```sql
-- ✅ CORRETO
role = 'superadmin'

-- ❌ ERRADO
role = superadmin  -- Sem aspas
role = 'super_admin'  -- Nome errado
```

---

## 🔐 Resetar Senha de Admin Existente

Se você esqueceu a senha do superadmin:

### 1. Gerar novo hash:
```python
import bcrypt
new_password = "NovaSenhaSegura456!"
new_hash = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt())
print(new_hash.decode('utf-8'))
```

### 2. Atualizar no banco:
```sql
UPDATE admins 
SET 
    password_hash = '$2b$12$NOVO_HASH_AQUI',
    password_reset_token = NULL,
    password_reset_expires = NULL,
    token_version = COALESCE(token_version, 1) + 1  -- Invalida sessões antigas
WHERE email = 'suporte@lomustrack.online';
```

---

## 📊 Tipos de Dados dos Campos

| Campo | Tipo | Exemplo | Obrigatório |
|-------|------|---------|-------------|
| name | VARCHAR | 'Suporte LomusTrack' | ✅ |
| email | VARCHAR | 'suporte@lomustrack.online' | ✅ |
| password_hash | VARCHAR | '$2b$12$...' | ✅ |
| role | ENUM | 'superadmin' | ✅ |
| company_id | INTEGER | NULL | ❌ |
| is_active | INTEGER (0/1) | 1 | ✅ |
| is_email_verified | BOOLEAN (TRUE/FALSE) | TRUE | ✅ |
| created_at | TIMESTAMP | NOW() | ✅ |

---

## 🛡️ Checklist de Segurança

Antes de fazer deploy:

- [ ] Email é `suporte@lomustrack.online`
- [ ] Senha é forte (mínimo 8 caracteres, letras, números, símbolos)
- [ ] Hash foi gerado com bcrypt (não use senha em texto plano)
- [ ] `company_id` é NULL (superadmin não pertence a empresa)
- [ ] `is_email_verified` é TRUE
- [ ] Backend com restrição de email deployado
- [ ] Testou login via `/admin-login`
- [ ] Outros emails admin foram removidos/bloqueados

---

## 📖 Documentação Relacionada

- **RESTRICAO_EMAIL_ADMIN.md** - Explicação da restrição de email
- **COMO_VIRAR_SUPERADMIN.md** - Guia completo de superadmin
- **PAGINAS_ADMIN.md** - Páginas do painel admin

---

**Última atualização:** 22 de novembro de 2026  
**Email oficial:** suporte@lomustrack.online  
**Status:** ✅ SQL corrigido para PostgreSQL boolean
