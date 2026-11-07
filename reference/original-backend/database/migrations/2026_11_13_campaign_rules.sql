CREATE TABLE IF NOT EXISTS campaign_rules (
    id SERIAL PRIMARY KEY,
    rule_id VARCHAR(80) NOT NULL,
    company_id INTEGER NOT NULL,
    definition JSONB NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    last_checked_at TIMESTAMP NULL,
    executions_today INTEGER NOT NULL DEFAULT 0,
    execution_date DATE NULL,
    created_at TIMESTAMP NOT NULL DEFAULT (NOW() AT TIME ZONE 'America/Sao_Paulo')
);

CREATE INDEX IF NOT EXISTS ix_campaign_rules_rule_id ON campaign_rules (rule_id);
CREATE INDEX IF NOT EXISTS ix_campaign_rules_company_id ON campaign_rules (company_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_campaign_rules_company_rule_id ON campaign_rules (company_id, rule_id);
