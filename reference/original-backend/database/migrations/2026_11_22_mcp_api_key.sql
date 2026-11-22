ALTER TABLE company_settings
  ADD COLUMN IF NOT EXISTS mcp_api_key VARCHAR(48) UNIQUE,
  ADD COLUMN IF NOT EXISTS mcp_enabled BOOLEAN NOT NULL DEFAULT FALSE;

CREATE UNIQUE INDEX IF NOT EXISTS ix_company_settings_mcp_api_key
  ON company_settings (mcp_api_key)
  WHERE mcp_api_key IS NOT NULL;
