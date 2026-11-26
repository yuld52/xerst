-- ============================================================
-- TRANSFORMAR ADMINS ANTIGOS EM OWNERS (DONOS DE EMPRESA)
-- ============================================================
-- 
-- Este SQL transforma todos os admins (exceto suporte@lomustrack.online)
-- em OWNERS (donos de empresa)
--
-- ⚠️ IMPORTANTE: 
-- - Cada owner precisa ter um company_id (não pode ser NULL)
-- - Se admin já tem company_id, mantém
-- - Se admin tem company_id NULL, você precisa atribuir um
--
-- ⚠️ BACKUP OBRIGATÓRIO!
-- ============================================================

-- PASSO 1: BACKUP (SEMPRE!)
CREATE TABLE admins_backup_antes_migrar AS 
SELECT * FROM admins;

-- ============================================================

-- PASSO 2: Ver quem será afetado
SELECT 
    id,
    name,
    email,
    role,
    company_id,
    is_active,
    CASE 
        WHEN company_id IS NULL THEN '⚠️ SEM EMPRESA (precisa atribuir)'
        ELSE '✅ TEM EMPRESA'
    END as situacao
FROM admins
WHERE 
    email != 'suporte@lomustrack.online'
    AND role IN ('admin', 'superadmin');  -- Owner já é owner

-- ============================================================

-- PASSO 3A: Transformar em OWNER (quem JÁ TEM company_id)
UPDATE admins 
SET role = 'owner'
WHERE 
    email != 'suporte@lomustrack.online'
    AND role IN ('admin', 'superadmin')
    AND company_id IS NOT NULL;  -- Apenas quem já tem empresa

-- ============================================================

-- PASSO 3B: Transformar em OWNER (quem NÃO TEM company_id)
-- ⚠️ VOCÊ PRECISA ATRIBUIR UMA EMPRESA PARA CADA UM!

-- Exemplo: Atribuir empresa ID 1 para um admin específico
UPDATE admins 
SET 
    role = 'owner',
    company_id = 1  -- ⚠️ Substituir pelo ID da empresa real
WHERE 
    email = 'admin1@exemplo.com';  -- ⚠️ Substituir pelo email do admin

-- Exemplo: Atribuir empresa ID 2 para outro admin
UPDATE admins 
SET 
    role = 'owner',
    company_id = 2  -- ⚠️ Substituir pelo ID da empresa real
WHERE 
    email = 'admin2@exemplo.com';  -- ⚠️ Substituir pelo email do admin

-- ============================================================

-- PASSO 3C: OU criar empresas automaticamente para cada admin
-- (Se você não tem empresas ainda)

-- Para cada admin sem empresa, criar uma nova empresa e atribuir:
-- (Execute linha por linha, ajustando os dados)

/*
-- Admin 1
INSERT INTO companies (name, created_at) 
VALUES ('Empresa do Admin 1', NOW()) 
RETURNING id;  -- Anote o ID retornado (ex: 10)

UPDATE admins 
SET role = 'owner', company_id = 10  -- Use o ID retornado acima
WHERE email = 'admin1@exemplo.com';


-- Admin 2
INSERT INTO companies (name, created_at) 
VALUES ('Empresa do Admin 2', NOW()) 
RETURNING id;  -- Anote o ID retornado (ex: 11)

UPDATE admins 
SET role = 'owner', company_id = 11  -- Use o ID retornado acima
WHERE email = 'admin2@exemplo.com';
*/

-- ============================================================

-- PASSO 4: Verificar resultado
SELECT 
    id,
    name,
    email,
    role,
    company_id,
    is_active,
    CASE 
        WHEN email = 'suporte@lomustrack.online' THEN '✅ SUPERADMIN (único)'
        WHEN role = 'owner' AND company_id IS NOT NULL THEN '🏢 OWNER (dono de empresa)'
        WHEN role = 'owner' AND company_id IS NULL THEN '⚠️ OWNER SEM EMPRESA (erro!)'
        WHEN role = 'viewer' THEN '👁️ VIEWER'
        WHEN role = 'admin' THEN '⚙️ ADMIN'
        ELSE '❓ ' || role
    END as status_novo
FROM admins
ORDER BY 
    CASE 
        WHEN email = 'suporte@lomustrack.online' THEN 0 
        ELSE 1 
    END,
    role,
    id;

-- ============================================================

-- RESULTADO ESPERADO:
-- 
-- 1 linha com superadmin:
--   email: suporte@lomustrack.online
--   role: superadmin
--   company_id: NULL
--   status: ✅ SUPERADMIN (único)
--
-- Todos os outros:
--   role: owner
--   company_id: (número da empresa, NÃO NULL)
--   status: 🏢 OWNER (dono de empresa)
--
-- ⚠️ NÃO PODE TER: role=owner com company_id=NULL
-- ============================================================

-- PASSO 5: Validar que nenhum owner ficou sem empresa
SELECT 
    id, name, email, role, company_id
FROM admins
WHERE role = 'owner' AND company_id IS NULL;

-- Deve retornar 0 linhas!
-- Se retornar alguma, execute PASSO 3B ou 3C

-- ============================================================

-- PASSO 6 (OPCIONAL): Se tudo OK, remover backup
-- DROP TABLE admins_backup_antes_migrar;

-- ============================================================

-- PARA RESTAURAR (caso precise voltar atrás):
-- DELETE FROM admins;
-- INSERT INTO admins SELECT * FROM admins_backup_antes_migrar;
-- DROP TABLE admins_backup_antes_migrar;

-- ============================================================

-- RESUMO DAS ROLES:
-- 
-- superadmin → Gerencia toda a plataforma (apenas suporte@lomustrack.online)
--              company_id DEVE ser NULL
--
-- owner      → Dono de uma empresa específica
--              company_id NÃO PODE ser NULL
--
-- admin      → Administrador de uma empresa
--              company_id NÃO PODE ser NULL
--
-- viewer     → Visualizador de uma empresa
--              company_id NÃO PODE ser NULL
--
-- ============================================================
