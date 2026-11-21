-- Add email verification columns to admins table
ALTER TABLE admins
    ADD COLUMN IF NOT EXISTS email_verification_code VARCHAR(6),
    ADD COLUMN IF NOT EXISTS email_verification_expires TIMESTAMP WITHOUT TIME ZONE,
    ADD COLUMN IF NOT EXISTS is_email_verified BOOLEAN DEFAULT FALSE NOT NULL;

CREATE INDEX IF NOT EXISTS ix_admins_email_verification_code ON admins (email_verification_code);