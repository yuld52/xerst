-- ============================================================================
-- SQL: Ativar Relatórios de Hora em Hora (Hourly Mode)
-- ============================================================================
-- Este script configura o LomusTrack para enviar relatórios a cada 1 hora
-- em vez de apenas em horários específicos.
-- ============================================================================

-- ============================================================================
-- 1. ATIVAR PARA UMA EMPRESA ESPECÍFICA
-- ============================================================================

-- Substitua "1" pelo ID da sua empresa
UPDATE company_settings 
SET notification_preferences = jsonb_set(
    COALESCE(notification_preferences, '{}'::jsonb),
    '{reportHours}',
    '{"hourly": true}'::jsonb
)
WHERE company_id = 1;

-- Resultado: Relatórios a cada hora (24x por dia) para a empresa ID 1


-- ============================================================================
-- 2. ATIVAR PARA TODAS AS EMPRESAS
-- ============================================================================

-- CUIDADO: Isso afeta TODAS as empresas!
UPDATE company_settings 
SET notification_preferences = jsonb_set(
    COALESCE(notification_preferences, '{}'::jsonb),
    '{reportHours}',
    '{"hourly": true}'::jsonb
)
WHERE company_id IS NOT NULL;

-- Resultado: Todas as empresas recebem relatórios a cada hora


-- ============================================================================
-- 3. ATIVAR PARA EMPRESA POR NOME
-- ============================================================================

UPDATE company_settings 
SET notification_preferences = jsonb_set(
    COALESCE(notification_preferences, '{}'::jsonb),
    '{reportHours}',
    '{"hourly": true}'::jsonb
)
WHERE company_id = (
    SELECT id FROM companies 
    WHERE name = 'Nome da Sua Empresa' 
    LIMIT 1
);

-- Resultado: Empresa com nome específico recebe relatórios de hora em hora


-- ============================================================================
-- 4. ATIVAR COM TEMPLATE PERSONALIZADO
-- ============================================================================

-- Hourly + Template "summary"
UPDATE company_settings 
SET notification_preferences = jsonb_set(
    jsonb_set(
        COALESCE(notification_preferences, '{}'::jsonb),
        '{reportHours}',
        '{"hourly": true}'::jsonb
    ),
    '{template}',
    '"summary"'::jsonb
)
WHERE company_id = 1;

-- Resultado: Relatórios de hora em hora com formato "summary"


-- ============================================================================
-- 5. VERIFICAR CONFIGURAÇÃO ATUAL
-- ============================================================================

-- Ver configuração de todas as empresas
SELECT 
    cs.company_id,
    c.name as empresa,
    cs.notification_preferences->'reportHours' as report_hours,
    cs.notification_preferences->'template' as template
FROM company_settings cs
LEFT JOIN companies c ON c.id = cs.company_id
WHERE cs.company_id IS NOT NULL
ORDER BY cs.company_id;


-- Ver apenas empresas com modo hourly ativo
SELECT 
    cs.company_id,
    c.name as empresa,
    cs.notification_preferences->'reportHours' as report_hours
FROM company_settings cs
LEFT JOIN companies c ON c.id = cs.company_id
WHERE cs.notification_preferences->'reportHours'->>'hourly' = 'true'
ORDER BY cs.company_id;


-- ============================================================================
-- 6. DESATIVAR MODO HOURLY (Voltar para Horários Específicos)
-- ============================================================================

-- Voltar para horários tradicionais (08:00, 12:00, 18:00, 23:00)
UPDATE company_settings 
SET notification_preferences = jsonb_set(
    COALESCE(notification_preferences, '{}'::jsonb),
    '{reportHours}',
    '{"08:00": true, "12:00": true, "18:00": true, "23:00": true}'::jsonb
)
WHERE company_id = 1;


-- ============================================================================
-- 7. DESATIVAR RELATÓRIOS COMPLETAMENTE
-- ============================================================================

UPDATE company_settings 
SET notification_preferences = jsonb_set(
    COALESCE(notification_preferences, '{}'::jsonb),
    '{reportHours}',
    '{}'::jsonb
)
WHERE company_id = 1;

-- Resultado: Nenhum relatório será enviado


-- ============================================================================
-- 8. VERIFICAR RELATÓRIOS ENVIADOS (Últimas 24 Horas)
-- ============================================================================

-- Ver todos os relatórios enviados nas últimas 24h
SELECT 
    company_id,
    title,
    status,
    sent_count,
    failed_count,
    created_at
FROM notification_delivery
WHERE data->>'kind' = 'scheduled_report'
  AND created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;


-- Contagem por hora (últimas 24h)
SELECT 
    company_id,
    DATE_TRUNC('hour', created_at) as hora,
    COUNT(*) as total_relatorios,
    SUM(sent_count) as enviados,
    SUM(failed_count) as falhados
FROM notification_delivery
WHERE data->>'kind' = 'scheduled_report'
  AND created_at > NOW() - INTERVAL '24 hours'
GROUP BY company_id, DATE_TRUNC('hour', created_at)
ORDER BY hora DESC;


-- ============================================================================
-- 9. TESTE: Simular Próxima Hora
-- ============================================================================

-- Ver qual seria o próximo relatório a ser enviado
SELECT 
    cs.company_id,
    c.name as empresa,
    TO_CHAR(NOW(), 'HH24:00') as proxima_hora,
    'Relatório LomusTrack ' || TO_CHAR(NOW(), 'YYYY-MM-DD') || ' ' || TO_CHAR(NOW(), 'HH24:00') as titulo_esperado
FROM company_settings cs
LEFT JOIN companies c ON c.id = cs.company_id
WHERE cs.notification_preferences->'reportHours'->>'hourly' = 'true'
  AND cs.company_id IS NOT NULL;


-- ============================================================================
-- 10. TROUBLESHOOTING: Verificar por que relatórios não estão sendo enviados
-- ============================================================================

-- A) Verificar se tem push subscriptions ativas
SELECT 
    company_id,
    COUNT(*) as dispositivos_ativos
FROM push_subscriptions
WHERE is_active = true
GROUP BY company_id;

-- B) Verificar últimos relatórios tentados (sucesso e falha)
SELECT 
    company_id,
    status,
    COUNT(*) as total
FROM notification_delivery
WHERE data->>'kind' = 'scheduled_report'
  AND created_at > NOW() - INTERVAL '24 hours'
GROUP BY company_id, status;

-- C) Verificar se há erros recentes
SELECT 
    company_id,
    title,
    body,
    status,
    created_at
FROM notification_delivery
WHERE data->>'kind' = 'scheduled_report'
  AND status IN ('failed', 'partial')
  AND created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;


-- ============================================================================
-- 11. ESTATÍSTICAS: Quantos relatórios por empresa nos últimos 7 dias
-- ============================================================================

SELECT 
    nd.company_id,
    c.name as empresa,
    COUNT(*) as total_relatorios,
    SUM(nd.sent_count) as total_enviados,
    SUM(nd.failed_count) as total_falhados,
    ROUND(AVG(nd.sent_count), 2) as media_por_relatorio,
    MIN(nd.created_at) as primeiro_relatorio,
    MAX(nd.created_at) as ultimo_relatorio
FROM notification_delivery nd
LEFT JOIN companies c ON c.id = nd.company_id
WHERE nd.data->>'kind' = 'scheduled_report'
  AND nd.created_at > NOW() - INTERVAL '7 days'
GROUP BY nd.company_id, c.name
ORDER BY total_relatorios DESC;


-- ============================================================================
-- 12. BACKUP: Salvar configuração atual antes de mudar
-- ============================================================================

-- Criar tabela de backup (executar apenas uma vez)
CREATE TABLE IF NOT EXISTS company_settings_backup (
    id SERIAL PRIMARY KEY,
    company_id INTEGER,
    notification_preferences JSONB,
    backed_up_at TIMESTAMP DEFAULT NOW()
);

-- Fazer backup antes de mudanças
INSERT INTO company_settings_backup (company_id, notification_preferences)
SELECT company_id, notification_preferences
FROM company_settings
WHERE company_id IS NOT NULL;

-- Ver backups
SELECT * FROM company_settings_backup ORDER BY backed_up_at DESC;

-- Restaurar de um backup específico
UPDATE company_settings cs
SET notification_preferences = csb.notification_preferences
FROM company_settings_backup csb
WHERE cs.company_id = csb.company_id
  AND csb.id = 123;  -- Substitua pelo ID do backup


-- ============================================================================
-- INSTRUÇÕES DE USO
-- ============================================================================
-- 
-- PARA ATIVAR MODO HOURLY:
-- 1. Execute a query da seção 1 (empresa específica) ou 2 (todas as empresas)
-- 2. Aguarde próxima hora cheia (exemplo: se são 14:35, aguarde até 15:00)
-- 3. Verifique com a query da seção 8
-- 
-- PARA DESATIVAR:
-- 1. Execute a query da seção 6 (voltar para horários específicos)
--    OU seção 7 (desativar completamente)
-- 
-- PARA TROUBLESHOOTING:
-- 1. Execute as queries da seção 10
-- 2. Consulte RELATORIOS_A_CADA_HORA.md
-- 
-- ============================================================================
