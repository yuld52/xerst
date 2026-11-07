ALTER TABLE campaign_markers
    ADD COLUMN IF NOT EXISTS company_id INTEGER;

CREATE INDEX IF NOT EXISTS ix_campaign_markers_company_id
    ON campaign_markers (company_id);
