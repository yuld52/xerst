-- Add password reset columns to admins table
ALTER TABLE admins
    ADD COLUMN IF NOT EXISTS password_reset_token VARCHAR(64) UNIQUE,
    ADD COLUMN IF NOT EXISTS password_reset_expires TIMESTAMP WITHOUT TIME ZONE;

CREATE INDEX IF NOT EXISTS ix_admins_password_reset_token ON admins (password_reset_token);