# 🔄 Guia: Migrar Admins Antigos - LomusTrack

## 🎯 Objetivo

Transformar admins antigos em usuários normais, mantendo apenas `suporte@lomustrack.online` como superadmin.

---

## ⚠️ IMPORTANTE: Faça Backup Primeiro!

```sql
-- Criar backup da tabela admins
CREATE TABLE admins_backup_20261122 AS 
SELECT * FROM admins;
```

**Para restaurar (se necessário):**
```sql
DELETE FROM admins;
INSERT INTO admins SELECT * FROM admins_backup_20261122;
```

---

## 📊 Passo 1: Ver Admins Atuais

```sql
SELECT 
    id,
    name,
    email,
    role,
    company_id,
    is_active
FROM admins
WHERE role IN ('admin', 'owner', 'superadmin')
ORDER BY id;
```

**Resultado exemplo:**
```
 id |      name      |           email            |    role    | company_id | is_active
----+----------------+----------------------------+------------+------------+-----------
  1 | Admin Antigo   | admin@exemplo.com          | superadmin |       NULL |         1
  2 | Outro Admin    | outro@exemplo.com          | admin      |          5 |         1
  3 | Suporte Lomus  | suporte@lomustrack.online  | superadmin |       NULL |         1
```

---

## 🔀 Opções de Migração

### **Opção A: Transformar em Visualizador (Recomendado)**

Mantém o acesso mas remove permissões administrativas:

```sql
UPDATE admins 
SET role = 'viewer'
WHERE 
    email != 'suporte@lomustrack.online'
    AND role IN ('admin', 'owner', 'superadmin');
```

**Resultado:**
- ✅ Email oficial continua como superadmin
- 👁️ Admins antigos viram `viewer` (apenas visualização)
- 🔓 Podem fazer login mas sem acesso admin

---

### **Opção B: Desativar Contas**

Bloqueia acesso completamente mas mantém dados:

```sql
UPDATE admins 
SET 
    is_active = 0,      -- Desativa
    role = 'viewer'     -- Remove permissões
WHERE 
    email != 'suporte@lomustrack.online'
    AND role IN ('admin', 'owner', 'superadmin');
```

**Resultado:**
- ✅ Email oficial continua como superadmin ativo
- 🚫 Admins antigos ficam desativados (não podem fazer login)
- 💾 Dados preservados no banco

---

### **Opção C: Deletar Permanentemente**

⚠️ **CUIDADO:** Não pode ser desfeito!

```sql
DELETE FROM admins 
WHERE 
    email != 'suporte@lomustrack.online'
    AND role IN ('admin', 'owner', 'superadmin');
```

**Resultado:**
- ✅ Email oficial continua como superadmin
- 🗑️ Admins antigos removidos do banco
- ⚠️ **IRREVERSÍVEL** (use apenas se tiver certeza)

---

### **Opção D: Mover para Empresas**

Transforma admins em owners de empresas específicas:

```sql
-- Admin vira owner da empresa ID 1
UPDATE admins 
SET 
    role = 'owner',
    company_id = 1
WHERE email = 'admin@exemplo.com';

-- Outro admin vira owner da empresa ID 2
UPDATE admins 
SET 
    role = 'owner',
    company_id = 2
WHERE email = 'outro@exemplo.com';
```

**Resultado:**
- ✅ Email oficial continua como superadmin (company_id = NULL)
- 🏢 Cada admin antigo vira owner de uma empresa
- 🔐 Podem gerenciar apenas sua própria empresa

---

## ✅ Verificar Resultado

Depois de executar qualquer opção, verifique:

```sql
SELECT 
    id,
    name,
    email,
    role,
    company_id,
    is_active,
    CASE 
        WHEN email = 'suporte@lomustrack.online' THEN '✅ SUPERADMIN OFICIAL'
        WHEN role = 'viewer' THEN '👁️ VISUALIZADOR'
        WHEN is_active = 0 THEN '🚫 DESATIVADO'
        WHEN role = 'owner' AND company_id IS NOT NULL THEN '🏢 OWNER DE EMPRESA'
        ELSE '👤 USUÁRIO'
    END as status
FROM admins
ORDER BY 
    CASE WHEN email = 'suporte@lomustrack.online' THEN 0 ELSE 1 END,
    id;
```

**Resultado esperado:**
```
 id |        name        |           email           |    role    | company_id | is_active |       status
----+--------------------+---------------------------+------------+------------+-----------+---------------------
  3 | Suporte LomusTrack | suporte@lomustrack.online | superadmin |       NULL |         1 | ✅ SUPERADMIN OFICIAL
  1 | Admin Antigo       | admin@exemplo.com         | viewer     |       NULL |         1 | 👁️ VISUALIZADOR
  2 | Outro Admin        | outro@exemplo.com         | viewer     |          5 |         1 | 👁️ VISUALIZADOR
```

---

## 🔄 Fluxo Recomendado

### Para migração segura:

```sql
-- 1. BACKUP
CREATE TABLE admins_backup_20261122 AS SELECT * FROM admins;

-- 2. VER QUEM EXISTE
SELECT id, name, email, role, company_id FROM admins 
WHERE role IN ('admin', 'owner', 'superadmin');

-- 3. TRANSFORMAR EM VIEWER (ou escolher outra opção)
UPDATE admins 
SET role = 'viewer'
WHERE 
    email != 'suporte@lomustrack.online'
    AND role IN ('admin', 'owner', 'superadmin');

-- 4. VERIFICAR RESULTADO
SELECT id, name, email, role, company_id, is_active FROM admins;

-- 5. TESTAR LOGIN
-- Tente fazer login com suporte@lomustrack.online
-- Deve funcionar e acessar /admin/dashboard

-- 6. SE TUDO OK, remover backup (opcional)
-- DROP TABLE admins_backup_20261122;
```

---

## 📋 Comparação de Opções

| Opção | Mantém Dados | Pode Fazer Login | Acesso Admin | Reversível |
|-------|--------------|------------------|--------------|------------|
| **A. Viewer** | ✅ Sim | ✅ Sim | ❌ Não | ✅ Fácil |
| **B. Desativar** | ✅ Sim | ❌ Não | ❌ Não | ✅ Fácil |
| **C. Deletar** | ❌ Não | ❌ Não | ❌ Não | ❌ Não |
| **D. Mover** | ✅ Sim | ✅ Sim | 🏢 Empresa | ✅ Médio |

---

## 🛡️ Segurança

### Garantir que apenas suporte@lomustrack.online é admin:

```sql
-- Ver todos os admins/superadmins
SELECT email, role 
FROM admins 
WHERE role IN ('admin', 'owner', 'superadmin')
AND email != 'suporte@lomustrack.online';
```

**Resultado esperado:**
```
 email | role
-------+------
(0 rows)
```

Se retornar alguma linha, significa que ainda existem admins antigos. Execute a migração apropriada.

---

## 🧪 Testar Restrição de Email

Depois da migração, teste que a restrição está funcionando:

### Teste 1: Login com email oficial (deve funcionar)
```bash
curl -X POST https://seu-backend.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "suporte@lomustrack.online",
    "password": "yuld0000"
  }'
```

**Resultado esperado:** HTTP 200 com token

---

### Teste 2: Login com email antigo (deve falhar)
```bash
curl -X POST https://seu-backend.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@exemplo.com",
    "password": "senha123"
  }'
```

**Resultado esperado:** HTTP 403
```json
{
  "detail": "Acesso administrativo restrito. Apenas o email oficial pode acessar o painel admin."
}
```

---

## ❓ FAQ

### Posso ter múltiplos superadmins?
**Não.** O sistema permite apenas `suporte@lomustrack.online` como superadmin.

### E se eu precisar dar acesso admin para outra pessoa?
Compartilhe as credenciais de `suporte@lomustrack.online` ou altere o código do backend para permitir outro email.

### Os admins antigos perdem todos os dados?
Depende da opção:
- **Viewer/Desativar:** Dados preservados
- **Deletar:** Dados removidos
- **Mover:** Dados preservados e vinculados a empresa

### Posso reverter a migração?
Sim, se tiver feito backup:
```sql
DELETE FROM admins;
INSERT INTO admins SELECT * FROM admins_backup_20261122;
```

---

## 📖 Documentação Relacionada

- **SQL_CORRETO_CRIAR_SUPERADMIN.sql** - Criar superadmin oficial
- **RESTRICAO_EMAIL_ADMIN.md** - Explicação da restrição
- **PAGINAS_ADMIN.md** - Páginas do painel admin

---

**Recomendação:** Use a **Opção A (Viewer)** por ser a mais segura e reversível. 🎯
