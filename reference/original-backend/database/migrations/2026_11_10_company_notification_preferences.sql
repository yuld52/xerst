ALTER TABLE company_settings
    ADD COLUMN IF NOT EXISTS notification_preferences JSONB NULL;
