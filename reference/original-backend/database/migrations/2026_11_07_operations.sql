CREATE TABLE IF NOT EXISTS api_credentials (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL,
    name VARCHAR(255) NOT NULL,
    token_hash VARCHAR(64) UNIQUE NOT NULL,
    token_prefix VARCHAR(16) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT (NOW() AT TIME ZONE 'America/Sao_Paulo'),
    last_used_at TIMESTAMP NULL
);
CREATE INDEX IF NOT EXISTS ix_api_credentials_company_id ON api_credentials(company_id);
CREATE TABLE IF NOT EXISTS webhook_deliveries (
    id SERIAL PRIMARY KEY,
    endpoint_id INTEGER NULL REFERENCES webhook_endpoints(id) ON DELETE SET NULL,
    company_id INTEGER NULL,
    platform VARCHAR(40) NOT NULL,
    slug VARCHAR(50) NOT NULL,
    status VARCHAR(30) NOT NULL,
    http_status INTEGER NULL,
    error_message VARCHAR(1000) NULL,
    payload JSONB NULL,
    transaction_id INTEGER NULL,
    attempts INTEGER NOT NULL DEFAULT 1,
    received_at TIMESTAMP DEFAULT (NOW() AT TIME ZONE 'America/Sao_Paulo'),
    processed_at TIMESTAMP NULL
);
CREATE INDEX IF NOT EXISTS ix_webhook_deliveries_company_id ON webhook_deliveries(company_id);
CREATE INDEX IF NOT EXISTS ix_webhook_deliveries_received_at ON webhook_deliveries(received_at);
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NULL,
    actor_id INTEGER NULL REFERENCES admins(id) ON DELETE SET NULL,
    action VARCHAR(120) NOT NULL,
    resource_type VARCHAR(80) NOT NULL,
    resource_id VARCHAR(120) NULL,
    details JSONB NULL,
    created_at TIMESTAMP DEFAULT (NOW() AT TIME ZONE 'America/Sao_Paulo')
);
CREATE INDEX IF NOT EXISTS ix_audit_logs_company_id ON audit_logs(company_id);
CREATE INDEX IF NOT EXISTS ix_audit_logs_created_at ON audit_logs(created_at);
ALTER TABLE admins ADD COLUMN IF NOT EXISTS token_version INTEGER NOT NULL DEFAULT 1;
ALTER TABLE admins ADD COLUMN IF NOT EXISTS two_factor_secret VARCHAR(64) NULL;
ALTER TABLE admins ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN NOT NULL DEFAULT FALSE;
CREATE TABLE IF NOT EXISTS notification_deliveries (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    body VARCHAR(2000) NOT NULL,
    status VARCHAR(30) NOT NULL,
    sent_count INTEGER NOT NULL DEFAULT 0,
    failed_count INTEGER NOT NULL DEFAULT 0,
    data JSONB NULL,
    created_at TIMESTAMP DEFAULT (NOW() AT TIME ZONE 'America/Sao_Paulo')
);
CREATE INDEX IF NOT EXISTS ix_notification_deliveries_company_id ON notification_deliveries(company_id);
ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS company_id INTEGER;
CREATE UNIQUE INDEX IF NOT EXISTS ux_company_settings_company_id ON company_settings(company_id) WHERE company_id IS NOT NULL;
