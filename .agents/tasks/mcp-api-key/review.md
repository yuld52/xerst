# MCP API Key — Code Review

## Evidence summary

### Auth dependencies
`mcp.py` imports `get_company_id` and `require_role` from `api.auth.deps`; `get_current_admin` is not imported or used. The GET endpoint uses only `get_company_id`; PUT and POST add `require_role("owner")`. This matches the `features.py` pattern exactly. ✅

### Never-overwrite on toggle
`toggle_mcp` (PUT) sets `mcp_enabled` to the requested value and only assigns a new key when `payload.enabled is True` and `settings.mcp_api_key is None`. An existing key is never replaced on a simple toggle. ✅

### Demo mode guard (`isImportDemo()`)
`McpCard.tsx` calls `isImportDemo()` at the start of `useEffect`, `handleToggle`, and `handleRegenerateKey`. All three paths short-circuit to localStorage before calling `apiRequest`. ✅

### localStorage fallback
API call errors in every branch (load, toggle, regenerate) fall through to `localStorage.getItem(STORAGE_KEY)` → `generateApiKey()`. ✅

### No UI changes
The diff to `McpCard.tsx` adds imports and rewrites logic inside the three handlers; JSX is unchanged. ✅

### SQL migration uses `IF NOT EXISTS`
`2026_11_22_mcp_api_key.sql` uses `ADD COLUMN IF NOT EXISTS` for both columns and `CREATE UNIQUE INDEX IF NOT EXISTS` for the partial index. ✅

### Mock handlers cover all three endpoints
`mockInterceptor.ts` handles:
- `GET /advanced-settings/mcp` → returns `{ enabled: false, api_key: DEMO_KEY }`
- `PUT /advanced-settings/mcp` → echoes `enabled` with `DEMO_KEY`
- `POST /advanced-settings/mcp/regenerate` → generates a fresh `mcp_live_<40hex>` key

All three required endpoints are covered. ✅

---

## BLOCKER: API key length exceeds column size

**Files:** `reference/original-backend/api/advanced_settings/mcp.py` (line `return "mcp_live_" + secrets.token_hex(20)`) and `reference/original-backend/database/models/company.py` (line `mcp_api_key = Column(String(48), ...)`) and `reference/original-backend/database/migrations/2026_11_22_mcp_api_key.sql` (`VARCHAR(48)`).

**Evidence:**
- `secrets.token_hex(20)` returns 40 hex characters (each byte → 2 hex digits).
- `"mcp_live_"` is 9 characters.
- Generated key length: 9 + 40 = **49 characters**.
- Column definition: `String(48)` / `VARCHAR(48)` — capacity **48 characters**.
- The mock's `DEMO_KEY` (`"mcp_live_demo00000000000000000000000000000000000"`) is exactly 48 characters, confirming the intended column size is 48.

**Consequence:** Every call to `_new_mcp_key()` — on first enable and on regenerate — produces a 49-char string that exceeds the 48-char column limit. PostgreSQL will raise a `DataError` (value too long for type character varying(48)), causing a 500 error on those endpoints.

**Correction (pick one):**
- Change `token_hex(20)` to `token_hex(19)` (38 hex chars → total 47) and widen the column to `String(48)` stays valid; or more precisely use `token_hex(20)` with `String(49)` / `VARCHAR(49)` throughout (model + migration).
- Simplest consistent fix: change `String(48)` → `String(49)` in `company.py` and `VARCHAR(48)` → `VARCHAR(49)` in the SQL migration, keeping `token_hex(20)` as-is. Alternatively change `token_hex(20)` → `token_hex(19)` and keep the 48-char column.
