ALTER TABLE company_settings
    ADD COLUMN IF NOT EXISTS display_currency VARCHAR(3) NOT NULL DEFAULT 'MZN';

ALTER TABLE admins
    ADD COLUMN IF NOT EXISTS preferences JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE TABLE IF NOT EXISTS global_app_settings (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    settings JSONB NOT NULL DEFAULT '{"allowSignups":true,"maintenanceMode":false,"pushNotifications":true}'::jsonb,
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

ALTER TABLE global_app_settings
    ALTER COLUMN settings SET DEFAULT '{"allowSignups":true,"maintenanceMode":false,"pushNotifications":true}'::jsonb;

INSERT INTO global_app_settings (id, settings)
VALUES (1, '{"allowSignups":true,"maintenanceMode":false,"pushNotifications":true}'::jsonb)
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS automation_locks (
    lock_key BIGINT PRIMARY KEY,
    lock_token VARCHAR(32) NOT NULL UNIQUE,
    locked_until TIMESTAMP NOT NULL
);
