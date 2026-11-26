# 🔐 Como Virar SuperAdmin no LomusTrack

Este guia explica como promover um usuário para **superadmin** e ter acesso completo ao painel administrativo.

---

## 📋 Pré-requisitos

- Acesso ao banco de dados PostgreSQL
- Email do usuário que será superadmin

---

## 🎯 Método 1: Via SQL (Direto no Banco)

### **1. Conectar ao Banco de Dados**

```bash
# Se estiver usando Supabase
# Acesse: https://app.supabase.com
# Vá em: SQL Editor

# Ou se tiver acesso direto ao PostgreSQL
psql postgresql://user:password@host:5432/database
```

### **2. Verificar Usuário Atual**

```sql
SELECT id, name, email, role, company_id 
FROM admins 
WHERE email = 'seu-email@exemplo.com';
```

Resultado esperado:
```
 id |   name   |          email          |  role  | company_id
----+----------+-------------------------+--------+------------
  1 | Seu Nome | seu-email@exemplo.com   | owner  |          1
```

### **3. Promover para SuperAdmin**

```sql
UPDATE admins 
SET role = 'superadmin', 
    company_id = NULL 
WHERE email = 'seu-email@exemplo.com';
```

### **4. Verificar Mudança**

```sql
SELECT id, name, email, role, company_id 
FROM admins 
WHERE email = 'seu-email@exemplo.com';
```

Resultado esperado:
```
 id |   name   |          email          |    role    | company_id
----+----------+-------------------------+------------+------------
  1 | Seu Nome | seu-email@exemplo.com   | superadmin |       NULL
```

✅ **Pronto! Agora você é superadmin!**

---

## 🎯 Método 2: Via Script Python (Backend)

### **1. Criar Script**

Crie o arquivo `reference/original-backend/make_superadmin.py`:

```python
#!/usr/bin/env python3
import os
import sys
from sqlalchemy import create_engine, text

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    print("❌ DATABASE_URL não configurada!")
    sys.exit(1)

email = input("Digite o email do usuário: ")
confirm = input(f"Promover {email} para superadmin? (yes/no): ")

if confirm.lower() != "yes":
    print("Cancelado.")
    sys.exit(0)

engine = create_engine(DATABASE_URL)

with engine.begin() as conn:
    # Verificar se usuário existe
    result = conn.execute(
        text("SELECT id, name, role FROM admins WHERE email = :email"),
        {"email": email}
    ).fetchone()
    
    if not result:
        print(f"❌ Usuário com email {email} não encontrado!")
        sys.exit(1)
    
    print(f"Usuário encontrado: {result.name} (role: {result.role})")
    
    # Promover para superadmin
    conn.execute(
        text("UPDATE admins SET role = 'superadmin', company_id = NULL WHERE email = :email"),
        {"email": email}
    )
    
    print(f"✅ {result.name} agora é SUPERADMIN!")
```

### **2. Executar Script**

```bash
cd reference/original-backend
python make_superadmin.py
```

---

## 🎯 Método 3: Via Painel Supabase (Se usar Supabase)

### **1. Acessar Supabase**

1. Acesse https://app.supabase.com
2. Selecione seu projeto
3. Vá em **Table Editor**
4. Selecione tabela **admins**

### **2. Encontrar seu Usuário**

1. Procure sua linha (filtro por email)
2. Clique para editar

### **3. Alterar Campos**

```
role: owner → superadmin
company_id: 1 → NULL (deixe vazio)
```

### **4. Salvar**

Clique em "Save" ou "Salvar"

✅ **Pronto!**

---

## 🔄 Passo Final: Fazer Logout e Login

Depois de promover para superadmin:

1. **Logout** do LomusTrack
2. **Limpe o cache** do navegador (Ctrl+Shift+Delete)
3. **Faça login novamente**
4. Acesse `/admin/dashboard`

---

## ✅ Como Saber se Funcionou

### **Antes (Admin/Owner):**
```
Admin Panel
├─ Dashboard
│  └─ Resumo da equipe
│     ├─ Usuários cadastrados: 10
│     ├─ Usuários ativos: 10
│     └─ Aguardando ativação: 0
└─ Usuários
```

### **Depois (SuperAdmin):**
```
Admin Panel
├─ Dashboard
│  ├─ [Enviar Email] [Atualizar]
│  ├─ ✉️ Email Sender (clicável)
│  ├─ 💰 Receita mensal estimada
│  ├─ 📈 Lucro mensal estimado
│  └─ Custos operacionais
├─ Usuários
├─ Assinantes ← NOVO!
├─ Prêmios
├─ Operações
└─ Configurações
```

---

## 🎓 Diferenças Entre Roles

| Funcionalidade | Owner/Admin | SuperAdmin |
|----------------|-------------|------------|
| Dashboard da empresa | ✅ | ✅ |
| Gerenciar usuários da empresa | ✅ | ✅ |
| Ver todas as empresas | ❌ | ✅ |
| Aprovar upgrades | ❌ | ✅ |
| Ver receita total | ❌ | ✅ |
| Enviar emails | ❌ | ✅ |
| Configurar custos | ❌ | ✅ |
| Página de Assinantes | ❌ | ✅ |

---

## ⚠️ Importante

### **SuperAdmin é para:**
- ✅ Proprietário da plataforma LomusTrack
- ✅ Equipe de administração central
- ✅ Ver receitas de todas as empresas

### **Owner/Admin é para:**
- ✅ Clientes que usam a plataforma
- ✅ Gerenciar apenas sua própria empresa
- ✅ Não ver dados de outras empresas

---

## 🆘 Problemas Comuns

### **1. Ainda vejo "Resumo da equipe" após promover**

**Solução:**
1. Faça logout completamente
2. Limpe cookies e cache
3. Feche o navegador
4. Abra novamente e faça login

### **2. Erro ao executar SQL**

**Solução:**
```sql
-- Verifique se o email está correto
SELECT * FROM admins WHERE email LIKE '%seu-email%';

-- Verifique os roles disponíveis
SELECT DISTINCT role FROM admins;
```

### **3. Campo company_id não pode ser NULL**

**Solução:**
```sql
-- Remover constraint temporariamente (se necessário)
ALTER TABLE admins ALTER COLUMN company_id DROP NOT NULL;

-- Depois executar o UPDATE
UPDATE admins SET role = 'superadmin', company_id = NULL 
WHERE email = 'seu-email@exemplo.com';
```

---

## 📝 Resumo Rápido

```sql
-- UMA LINHA para virar superadmin:
UPDATE admins 
SET role = 'superadmin', company_id = NULL 
WHERE email = 'SEU_EMAIL_AQUI';
```

Depois: **Logout → Login → Acesse /admin/dashboard**

---

✅ **Pronto! Agora você verá todas as funcionalidades de superadmin!** 🎉


---

## ⚠️ ATUALIZAÇÃO IMPORTANTE

**Restrição de Email Implementada:**

Apenas o email oficial pode ser admin/superadmin:
```
suporte@lomustrack.online
```

Qualquer outro email será bloqueado no login, mesmo com role `superadmin` no banco de dados.

📖 **Documentação completa:** `RESTRICAO_EMAIL_ADMIN.md`

---
