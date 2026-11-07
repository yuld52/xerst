ALTER TABLE webhook_endpoints
    ADD COLUMN IF NOT EXISTS security_token_hash VARCHAR(64);
