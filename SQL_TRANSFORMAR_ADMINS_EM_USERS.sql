-- ============================================================
-- TRANSFORMAR ADMINS ANTIGOS EM USUÁRIOS NORMAIS
-- ============================================================
-- 
-- Este SQL transforma todos os admins (exceto suporte@lomustrack.online)
-- em usuários VIEWER (visualizador - nível mais baixo de permissão)
--
-- ⚠️ IMPORTANTE: Faça backup antes de executar!
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
    is_active
FROM admins
WHERE 
    email != 'suporte@lomustrack.online'
    AND role IN ('admin', 'owner', 'superadmin');

-- ============================================================

-- PASSO 3: Transformar em VIEWER (usuário normal)
UPDATE admins 
SET role = 'viewer'
WHERE 
    email != 'suporte@lomustrack.online'
    AND role IN ('admin', 'owner', 'superadmin');

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
        WHEN role = 'viewer' THEN '👁️ VIEWER (usuário normal)'
        WHEN role = 'owner' THEN '🏢 OWNER (dono de empresa)'
        WHEN role = 'admin' THEN '⚙️ ADMIN (admin de empresa)'
        ELSE '❓ OUTRO'
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
-- Apenas 1 linha com role 'superadmin':
--   email: suporte@lomustrack.online
--   role: superadmin
--   status: ✅ SUPERADMIN (único)
--
-- Todos os outros admins antigos:
--   role: viewer
--   status: 👁️ VIEWER (usuário normal)
--
-- ============================================================

-- PASSO 5 (OPCIONAL): Se tudo estiver OK, remover backup
-- DROP TABLE admins_backup_antes_migrar;

-- ============================================================

-- PARA RESTAURAR (caso precise voltar atrás):
-- DELETE FROM admins;
-- INSERT INTO admins SELECT * FROM admins_backup_antes_migrar;
-- DROP TABLE admins_backup_antes_migrar;

-- ============================================================
