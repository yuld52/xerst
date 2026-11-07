ALTER TABLE stripe_accounts
    ADD COLUMN IF NOT EXISTS company_id INTEGER NULL;
CREATE INDEX IF NOT EXISTS ix_stripe_accounts_company_id
    ON stripe_accounts (company_id);

ALTER TABLE gemini_accounts
    ADD COLUMN IF NOT EXISTS company_id INTEGER NULL;
ALTER TABLE gemini_accounts
    ALTER COLUMN api_key DROP NOT NULL;
CREATE INDEX IF NOT EXISTS ix_gemini_accounts_company_id
    ON gemini_accounts (company_id);
UPDATE gemini_accounts SET api_key = NULL;

ALTER TABLE campaign_actions
    ADD COLUMN IF NOT EXISTS company_id INTEGER NULL;
CREATE INDEX IF NOT EXISTS ix_campaign_actions_company_id
    ON campaign_actions (company_id);
