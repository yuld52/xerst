-- ============================================================
-- INVESTIGAR E RECUPERAR DADOS PERDIDOS DA EMPRESA
-- ============================================================
-- 
-- Quando um admin vira owner, o company_id pode ter mudado,
-- fazendo os dados "desaparecerem"
--
-- ============================================================

-- PASSO 1: Ver sua conta atual
SELECT 
    id,
    name,
    email,
    role,
    company_id,
    created_at
FROM admins
WHERE email = 'SEU_EMAIL_AQUI';  -- ⚠️ Substituir pelo seu email

-- Anote o company_id que está aparecendo agora

-- ============================================================

-- PASSO 2: Ver TODOS os company_ids que já usou
SELECT DISTINCT company_id 
FROM admins 
WHERE email = 'SEU_EMAIL_AQUI';  -- ⚠️ Seu email

-- Se aparecer mais de um, seus dados podem estar em outro company_id

-- ============================================================

-- PASSO 3: Procurar suas campanhas em TODAS as empresas
SELECT 
    id,
    company_id,
    name,
    created_at,
    status
FROM campaigns
ORDER BY company_id, created_at DESC
LIMIT 50;

-- Encontre qual company_id tem suas campanhas

-- ============================================================

-- PASSO 4: Procurar seus clientes em TODAS as empresas
SELECT 
    id,
    company_id,
    name,
    email,
    created_at
FROM customers
ORDER BY company_id, created_at DESC
LIMIT 50;

-- ============================================================

-- PASSO 5: Ver todas as empresas no sistema
SELECT 
    id as company_id,
    name as company_name,
    created_at,
    (SELECT COUNT(*) FROM campaigns WHERE company_id = companies.id) as num_campanhas,
    (SELECT COUNT(*) FROM customers WHERE company_id = companies.id) as num_clientes,
    (SELECT COUNT(*) FROM admins WHERE company_id = companies.id) as num_admins
FROM companies
ORDER BY id;

-- ============================================================

-- CENÁRIO A: Seus dados estão em company_id DIFERENTE
-- Solução: Voltar seu admin para o company_id correto

-- Exemplo: Seus dados estão em company_id = 5, mas você está em company_id = 1
UPDATE admins 
SET company_id = 5  -- ⚠️ Substituir pelo company_id correto
WHERE email = 'SEU_EMAIL_AQUI';  -- ⚠️ Seu email

-- ============================================================

-- CENÁRIO B: Você virou owner mas tinha company_id = NULL
-- Solução: Atribuir o company_id correto

-- Primeiro, ver qual empresa tem seus dados
SELECT DISTINCT company_id 
FROM campaigns 
WHERE created_at >= '2024-01-01'  -- Ajustar data
ORDER BY company_id;

-- Depois, atribuir esse company_id para você
UPDATE admins 
SET company_id = X  -- ⚠️ ID encontrado acima
WHERE email = 'SEU_EMAIL_AQUI';

-- ============================================================

-- CENÁRIO C: Dados realmente sumiram (raro)
-- Verificar se não foram deletados

-- Ver se há campanhas órfãs (sem empresa)
SELECT id, name, company_id, created_at
FROM campaigns
WHERE company_id IS NULL
ORDER BY created_at DESC;

-- Se encontrar, atribuir para sua empresa
UPDATE campaigns 
SET company_id = X  -- ⚠️ Seu company_id correto
WHERE company_id IS NULL;

-- ============================================================

-- PASSO 6: VERIFICAR RESULTADO
-- Depois de corrigir, verifique:

SELECT 
    'Admin' as tabela,
    email,
    company_id
FROM admins
WHERE email = 'SEU_EMAIL_AQUI'

UNION ALL

SELECT 
    'Campanhas' as tabela,
    COUNT(*)::text as email,
    company_id
FROM campaigns
WHERE company_id = (SELECT company_id FROM admins WHERE email = 'SEU_EMAIL_AQUI')
GROUP BY company_id

UNION ALL

SELECT 
    'Clientes' as tabela,
    COUNT(*)::text as email,
    company_id
FROM customers
WHERE company_id = (SELECT company_id FROM admins WHERE email = 'SEU_EMAIL_AQUI')
GROUP BY company_id;

-- ============================================================

-- BACKUP DE SEGURANÇA
-- Antes de fazer qualquer UPDATE, sempre:

CREATE TABLE admins_backup_recuperacao AS SELECT * FROM admins;
CREATE TABLE campaigns_backup_recuperacao AS SELECT * FROM campaigns;
CREATE TABLE customers_backup_recuperacao AS SELECT * FROM customers;

-- ============================================================
