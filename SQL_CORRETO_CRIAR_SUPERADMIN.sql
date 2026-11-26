-- ============================================================
-- SQL CORRETO PARA CRIAR SUPERADMIN NO LOMUSTRACK
-- ============================================================
-- 
-- IMPORTANTE: 
-- - is_active é INTEGER (use 1 ou 0)
-- - is_email_verified é BOOLEAN (use TRUE ou FALSE)
-- 
-- ============================================================

-- PASSO 1: Gerar hash da senha (faça isso primeiro)
-- 
-- Python:
-- import bcrypt
-- password = "SuaSenhaSegura123!"
-- hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
-- print(hashed.decode('utf-8'))
-- 
-- Exemplo de hash: $2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/Lez2.0lGKgAyFCfGK

-- ============================================================

-- PASSO 2: Inserir o superadmin
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
    '$2b$12$COLE_SEU_HASH_AQUI',  -- Substituir pelo hash gerado acima
    'superadmin',
    NULL,
    1,       -- INTEGER: 1=ativo, 0=suspenso
    TRUE,    -- BOOLEAN: TRUE=verificado, FALSE=não verificado
    NOW()
);

-- ============================================================

-- PASSO 3: Verificar se foi criado corretamente
SELECT 
    id, 
    name, 
    email, 
    role, 
    company_id, 
    is_active, 
    is_email_verified,
    created_at
FROM admins 
WHERE email = 'suporte@lomustrack.online';

-- Resultado esperado:
-- id |        name        |           email           |    role    | company_id | is_active | is_email_verified |      created_at
-- ---+--------------------+---------------------------+------------+------------+-----------+-------------------+---------------------
--  1 | Suporte LomusTrack | suporte@lomustrack.online | superadmin |       NULL |         1 |         t         | 2026-11-22 10:30:00

-- ============================================================

-- ALTERNATIVA: Atualizar admin existente
-- Se você já tem um admin e quer transformá-lo em superadmin:

UPDATE admins 
SET 
    email = 'suporte@lomustrack.online',
    role = 'superadmin',
    company_id = NULL,
    is_active = 1,              -- INTEGER
    is_email_verified = TRUE    -- BOOLEAN
WHERE id = 1;  -- Substituir pelo ID do admin existente

-- ============================================================

-- RESETAR SENHA (se necessário)
-- Gere um novo hash primeiro, depois:

UPDATE admins 
SET 
    password_hash = '$2b$12$NOVO_HASH_AQUI',
    password_reset_token = NULL,
    password_reset_expires = NULL,
    token_version = COALESCE(token_version, 1) + 1  -- Invalida sessões antigas
WHERE email = 'suporte@lomustrack.online';

-- ============================================================
-- IMPORTANTE: Depois de criar o superadmin, teste o login em:
-- https://www.lomustrack.online/admin-login
-- ============================================================
