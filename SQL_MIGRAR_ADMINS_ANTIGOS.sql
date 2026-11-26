-- ============================================================
-- MIGRAR ADMINS ANTIGOS PARA USUÁRIOS NORMAIS
-- ============================================================
-- 
-- Este script transforma admins antigos em usuários normais,
-- mantendo apenas suporte@lomustrack.online como superadmin
--
-- ============================================================

-- OPÇÃO 1: Ver todos os admins atuais
-- Execute isso primeiro para ver quem existe no banco
SELECT 
    id,
    name,
    email,
    role,
    company_id,
    is_active
FROM admins
ORDER BY id;

-- ============================================================

-- OPÇÃO 2: Transformar admins antigos em usuários VIEWER
-- (mantém acesso mas sem permissões administrativas)

UPDATE admins 
SET 
    role = 'viewer'  -- Vira apenas visualizador
WHERE 
    email != 'suporte@lomustrack.online'  -- Mantém apenas o email oficial como admin
    AND role IN ('admin', 'owner', 'superadmin');  -- Apenas quem era admin antes

-- ============================================================

-- OPÇÃO 3: Desativar admins antigos (sem deletar)
-- (mantém no banco mas bloqueia acesso)

UPDATE admins 
SET 
    is_active = 0,  -- Desativa a conta
    role = 'viewer'  -- Remove permissões admin
WHERE 
    email != 'suporte@lomustrack.online'
    AND role IN ('admin', 'owner', 'superadmin');

-- ============================================================

-- OPÇÃO 4: Deletar completamente admins antigos
-- ⚠️ CUIDADO: Esta operação NÃO pode ser desfeita!

DELETE FROM admins 
WHERE 
    email != 'suporte@lomustrack.online'
    AND role IN ('admin', 'owner', 'superadmin');

-- ============================================================

-- OPÇÃO 5: Mover admins antigos para empresas
-- (transformar em owners das próprias empresas)

-- Primeiro, criar empresas para cada admin antigo
-- (ajuste conforme necessário)

-- Exemplo: Admin vira owner da empresa ID 1
UPDATE admins 
SET 
    role = 'owner',
    company_id = 1  -- Substituir pelo ID da empresa
WHERE 
    email = 'admin-antigo@email.com';  -- Email do admin antigo

-- ============================================================

-- VERIFICAR RESULTADO
-- Execute isso depois para confirmar as mudanças

SELECT 
    id,
    name,
    email,
    role,
    company_id,
    is_active,
    CASE 
        WHEN email = 'suporte@lomustrack.online' THEN '✅ SUPERADMIN OFICIAL'
        WHEN role = 'viewer' THEN '👁️ VISUALIZADOR (sem admin)'
        WHEN is_active = 0 THEN '🚫 DESATIVADO'
        ELSE '👤 USUÁRIO NORMAL'
    END as status
FROM admins
ORDER BY 
    CASE WHEN email = 'suporte@lomustrack.online' THEN 0 ELSE 1 END,
    id;

-- ============================================================

-- BACKUP DE SEGURANÇA
-- Execute isso ANTES de fazer qualquer mudança!

CREATE TABLE admins_backup_20261122 AS 
SELECT * FROM admins;

-- Para restaurar (se precisar):
-- DELETE FROM admins;
-- INSERT INTO admins SELECT * FROM admins_backup_20261122;

-- ============================================================
