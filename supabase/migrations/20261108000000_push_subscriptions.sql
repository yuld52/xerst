CREATE TABLE IF NOT EXISTS push_subscriptions (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NULL,
    user_id INTEGER NULL,
    endpoint TEXT NOT NULL UNIQUE,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    user_agent VARCHAR(500) NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_used_at TIMESTAMPTZ NULL
);

CREATE INDEX IF NOT EXISTS ix_push_subscriptions_company_id
    ON push_subscriptions (company_id);
CREATE INDEX IF NOT EXISTS ix_push_subscriptions_is_active
    ON push_subscriptions (is_active);
CREATE INDEX IF NOT EXISTS ix_push_subscriptions_user_id
    ON push_subscriptions (user_id);
