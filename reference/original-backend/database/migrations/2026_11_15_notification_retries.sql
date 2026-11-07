CREATE TABLE IF NOT EXISTS notification_retries (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    data JSONB NULL,
    delivered_subscription_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
    attempts INTEGER NOT NULL DEFAULT 0,
    max_attempts INTEGER NOT NULL DEFAULT 5,
    status VARCHAR(30) NOT NULL DEFAULT 'pending',
    next_attempt_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT (NOW() AT TIME ZONE 'America/Sao_Paulo')
);
CREATE INDEX IF NOT EXISTS ix_notification_retries_company_id ON notification_retries (company_id);
CREATE INDEX IF NOT EXISTS ix_notification_retries_status ON notification_retries (status);
