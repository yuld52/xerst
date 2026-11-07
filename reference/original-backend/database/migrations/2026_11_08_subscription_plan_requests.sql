CREATE TABLE IF NOT EXISTS subscription_plan_requests (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL,
    requested_by_admin_id INTEGER NOT NULL REFERENCES admins(id),
    requested_plan VARCHAR(20) NOT NULL CHECK (requested_plan IN ('free', 'premium', 'monster')),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    reviewed_at TIMESTAMP NULL,
    reviewed_by_admin_id INTEGER NULL REFERENCES admins(id)
);

CREATE INDEX IF NOT EXISTS ix_subscription_plan_requests_company_status
    ON subscription_plan_requests (company_id, status);
