CREATE TABLE IF NOT EXISTS auth_sessions (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(64) NOT NULL UNIQUE,
    admin_id INTEGER NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
    company_id INTEGER NULL,
    user_agent VARCHAR(500) NULL,
    ip_address VARCHAR(80) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT (NOW() AT TIME ZONE 'America/Sao_Paulo'),
    last_seen_at TIMESTAMP NOT NULL DEFAULT (NOW() AT TIME ZONE 'America/Sao_Paulo'),
    expires_at TIMESTAMP NOT NULL,
    revoked_at TIMESTAMP NULL
);
CREATE INDEX IF NOT EXISTS ix_auth_sessions_admin_id ON auth_sessions (admin_id);
CREATE INDEX IF NOT EXISTS ix_auth_sessions_company_id ON auth_sessions (company_id);
