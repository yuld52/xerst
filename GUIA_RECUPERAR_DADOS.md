# 🔍 Recuperar Dados da Empresa que "Sumiram"

## 🎯 O que aconteceu?

Quando você transformou o admin em owner, o `company_id` pode ter mudado, fazendo seus dados (campanhas, clientes, vendas) "desaparecerem".

---

## 🔍 Passo 1: Descobrir o Problema

### Ver sua conta atual:
```sql
SELECT 
    id,
    name,
    email,
    role,
    company_id
FROM admins
WHERE email = 'seu-email@exemplo.com';  -- ⚠️ Seu email aqui
```

**Anote o `company_id` que aparece!**

---

## 🔎 Passo 2: Encontrar Seus Dados

### Ver onde estão suas campanhas:
```sql
SELECT 
    id,
    company_id,
    name,
    created_at
FROM campaigns
ORDER BY created_at DESC
LIMIT 20;
```

**Encontre qual `company_id` tem suas campanhas!**

---

### Ver onde estão seus clientes:
```sql
SELECT 
    id,
    company_id,
    name,
    created_at
FROM customers
ORDER BY created_at DESC
LIMIT 20;
```

---

## ✅ Passo 3: Recuperar os Dados

### **Cenário A:** Seus dados estão em company_id diferente

**Exemplo:**
- Você está em `company_id = 1`
- Suas campanhas estão em `company_id = 5`

**Solução:** Voltar para o company_id correto
```sql
UPDATE admins 
SET company_id = 5  -- ⚠️ company_id onde estão seus dados
WHERE email = 'seu-email@exemplo.com';
```

---

### **Cenário B:** Você estava com company_id = NULL

**Exemplo:**
- Você era superadmin (`company_id = NULL`)
- Virou owner mas esqueceu de atribuir a empresa certa

**Solução:** Descobrir qual empresa tem seus dados
```sql
-- Ver qual company_id tem mais dados recentes
SELECT 
    company_id,
    COUNT(*) as num_campanhas,
    MAX(created_at) as ultima_campanha
FROM campaigns
GROUP BY company_id
ORDER BY ultima_campanha DESC;
```

Depois atribuir esse company_id:
```sql
UPDATE admins 
SET company_id = X  -- ⚠️ company_id encontrado acima
WHERE email = 'seu-email@exemplo.com';
```

---

### **Cenário C:** Dados ficaram "órfãos" (sem empresa)

**Verificar:**
```sql
SELECT COUNT(*) FROM campaigns WHERE company_id IS NULL;
SELECT COUNT(*) FROM customers WHERE company_id IS NULL;
```

**Se retornar > 0, atribuir para sua empresa:**
```sql
UPDATE campaigns 
SET company_id = X  -- ⚠️ Seu company_id
WHERE company_id IS NULL;

UPDATE customers 
SET company_id = X  -- ⚠️ Seu company_id
WHERE company_id IS NULL;
```

---

## 🔄 Passo 4: Verificar Resultado

```sql
-- Ver sua conta e dados
SELECT 
    a.email,
    a.company_id,
    (SELECT COUNT(*) FROM campaigns WHERE company_id = a.company_id) as campanhas,
    (SELECT COUNT(*) FROM customers WHERE company_id = a.company_id) as clientes
FROM admins a
WHERE email = 'seu-email@exemplo.com';
```

**Resultado esperado:**
```
        email         | company_id | campanhas | clientes
----------------------+------------+-----------+----------
 seu-email@exemplo.com|          5 |        10 |      150
```

---

## 🎯 Solução Rápida (Caso Comum)

Se você transformou admin em owner e perdeu os dados:

```sql
-- 1. Ver qual company_id tem suas campanhas
SELECT DISTINCT company_id 
FROM campaigns 
ORDER BY created_at DESC 
LIMIT 1;

-- Resultado exemplo: 5

-- 2. Atribuir esse company_id para você
UPDATE admins 
SET company_id = 5  -- ⚠️ Usar o ID do passo 1
WHERE email = 'seu-email@exemplo.com';

-- 3. Fazer logout e login novamente
-- Seus dados devem aparecer!
```

---

## 📊 Mapa de Dados por Empresa

Ver todas as empresas e quantos dados cada uma tem:

```sql
SELECT 
    c.id as company_id,
    c.name as company_name,
    (SELECT COUNT(*) FROM campaigns WHERE company_id = c.id) as campanhas,
    (SELECT COUNT(*) FROM customers WHERE company_id = c.id) as clientes,
    (SELECT COUNT(*) FROM admins WHERE company_id = c.id) as admins,
    (SELECT string_agg(email, ', ') FROM admins WHERE company_id = c.id) as emails_admins
FROM companies c
ORDER BY c.id;
```

**Resultado exemplo:**
```
 company_id | company_name  | campanhas | clientes | admins |      emails_admins
------------+---------------+-----------+----------+--------+--------------------------
          1 | Empresa Teste |         0 |        0 |      1 | novo@email.com
          5 | Minha Empresa |        10 |      150 |      0 | (vazio - aqui está o problema!)
```

**Nesse caso:** Seus dados estão em `company_id = 5`, mas você está em `company_id = 1`!

**Solução:**
```sql
UPDATE admins 
SET company_id = 5 
WHERE email = 'seu-email@exemplo.com';
```

---

## ⚠️ Sempre Faça Backup!

Antes de qualquer UPDATE:
```sql
CREATE TABLE admins_backup_antes_corrigir AS 
SELECT * FROM admins WHERE email = 'seu-email@exemplo.com';
```

Para restaurar:
```sql
UPDATE admins 
SET company_id = (SELECT company_id FROM admins_backup_antes_corrigir)
WHERE email = 'seu-email@exemplo.com';
```

---

## 🧪 Testar Depois de Corrigir

1. **Faça logout** do sistema
2. **Limpe o cache** do navegador (Ctrl+Shift+Delete)
3. **Faça login** novamente
4. **Verifique** se suas campanhas/clientes apareceram

---

## ❓ FAQ

### Meus dados foram deletados?
Provavelmente não. Eles estão em outro `company_id`. Use o Passo 2 para encontrar.

### Posso ter múltiplos company_id?
Não. Cada admin tem apenas 1 `company_id` (ou NULL para superadmin).

### E se eu era superadmin antes?
Superadmin tem `company_id = NULL` e não vê dados de empresas. Ao virar owner, precisa ter um `company_id` atribuído.

### Como evitar isso no futuro?
Sempre anote o `company_id` antes de fazer qualquer UPDATE na tabela `admins`.

---

## 📖 Documentação Relacionada

- **SQL_TRANSFORMAR_ADMINS_EM_OWNERS.sql** - Como transformar em owner corretamente
- **SQL_INVESTIGAR_DADOS_PERDIDOS.sql** - SQLs completos para investigar

---

**Na maioria dos casos, basta atribuir o `company_id` correto e os dados "voltam"!** ✅
