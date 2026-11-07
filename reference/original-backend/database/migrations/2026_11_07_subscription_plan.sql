ALTER TABLE admins
    ADD COLUMN IF NOT EXISTS subscription_plan VARCHAR(20) NOT NULL DEFAULT 'free';

ALTER TABLE admins
    ADD COLUMN IF NOT EXISTS subscription_started_at TIMESTAMP NULL;

UPDATE admins
SET subscription_plan = 'free'
WHERE subscription_plan IS NULL OR subscription_plan NOT IN ('free', 'premium', 'monster');

UPDATE admins
SET subscription_started_at = created_at
WHERE role = 'owner' AND subscription_started_at IS NULL;
