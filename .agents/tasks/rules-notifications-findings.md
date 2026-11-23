# Rules & Report Notifications — Investigation Findings

**Date:** 2025  
**Scope:** `src/` frontend + `reference/original-backend/` Python API

---

## Summary

Both features are **structurally implemented and connected end-to-end**, but each has gaps that prevent them from working in production without additional configuration.

| Feature | Frontend UI | Backend API | Automation trigger | Demo mode |
|---|---|---|---|---|
| **Rules** | ✅ Full CRUD UI | ✅ Full CRUD endpoints | ⚠️ GitHub Actions cron (not Vercel cron) | ✅ Fully mocked |
| **Report Notifications** | ✅ Settings page + Bell | ✅ Push subscribe + preferences endpoints | ⚠️ GitHub Actions cron (not Vercel cron) | ⚠️ Preferences UI works; push only works in demo without VAPID keys |

The single biggest gap: **`vercel.json` has `"crons": []`** — no crons are scheduled on Vercel itself. Both features depend on a GitHub Actions workflow that calls the backend cron endpoints. If the GitHub Actions secrets (`CRON_SECRET`, `VERCEL_DOMAIN`) are not configured, neither rules nor daily reports will ever execute automatically.

---

## 1. What are "Rules"?

### Business domain
A **Campaign Rule** is an automated action applied to Facebook/Meta campaigns. When a rule fires, it pauses, activates, increases, or decreases the daily budget of matching campaigns. Rules are evaluated once per day (Hobby plan limitation).

### Database model
`reference/original-backend/database/models/campaign_rule.py`

```
campaign_rules table
├── id             (serial PK)
├── rule_id        (string, unique per company)
├── company_id     (FK → companies)
├── definition     (JSONB — full rule config)
├── enabled        (boolean)
├── last_checked_at (timestamp)
├── executions_today (int)
├── execution_date  (date)
└── created_at
```

Migration: `reference/original-backend/database/migrations/2026_11_13_campaign_rules.sql`

### CRUD operations
All four operations exist in `reference/original-backend/api/automation.py`:

| Method | Endpoint | Handler |
|---|---|---|
| GET | `/api/campaigns/rules` | `list_campaign_rules` |
| POST | `/api/campaigns/rules` | `create_campaign_rule` |
| PATCH | `/api/campaigns/rules/{rule_id}` | `update_campaign_rule` |
| DELETE | `/api/campaigns/rules/{rule_id}` | `delete_campaign_rule` |

The automation router (`router = APIRouter(tags=["automation"])`) is registered in `app.py` with prefix `/api`.

---

## 2. What are "Report Notifications"?

### What they are
Daily push notifications sent to subscribed browsers via the Web Push API. Each notification is an AI-generated summary of the day's ad performance (revenue, spend, ROAS, profit). Three templates exist: "Status de Lucro", "Resumo Detalhado", and "Notificações Criativas".

### Storage
- **User preferences:** stored in `company_settings.notification_preferences` (JSONB column) — controlled via `/api/company/notification-preferences`.
- **Delivery log:** `notification_deliveries` table — records each sent push (title, body, status, sent/failed counts).
- **Retry queue:** `notification_retries` table — retries failed pushes up to 5 times.
- **Push subscriptions:** `push_subscriptions` table — browser endpoint + VAPID keys per company.

### What triggers a report notification
A cron job calls `GET /api/automation/reports/run` (Bearer-authenticated). The backend:
1. Queries `company_settings` for companies with `reportHours["08:00"] == true`.
2. Collects the day's data via `collect_daily_data()`.
3. Calls OpenRouter AI to generate the report body.
4. Delivers via `push_service.send_notification()` to all active subscriptions.
5. Logs the result in `notification_deliveries`.

The cron trigger is defined in `.github/workflows/automation.yml` — a GitHub Actions workflow scheduled at `0 6 * * *` (06:00 UTC = ~08:00 Maputo).

---

## 3. Frontend — Rules

### Route / page
Rules are **not a separate route**. They live as a tab inside the Campaigns page:

- Route: `/_dashboard/campaigns` → `src/routes/_dashboard.campaigns.tsx`
- Component: `src/features/lomustrack/campaigns/index.tsx`
- When `activePresetId === "rules"`, the page renders `<RulesSection />` instead of the campaigns table.

### UI component
`src/features/lomustrack/campaigns/components/RulesSection.tsx`

The component:
- On mount, calls `fetchCampaignRules()` → `GET /api/campaigns/rules`.
- Displays a table of rules with status badge, name/product, action/conditions, frequency.
- Has "Criar regra" button that opens `<RuleForm>` dialog.
- Supports enable/disable toggle (PATCH), delete (DELETE), and bulk delete.

### Service layer
`src/services/campaignRules.ts` — four functions mapping to the four backend endpoints:

```typescript
fetchCampaignRules()      → GET  /campaigns/rules
createCampaignRule(rule)  → POST /campaigns/rules
setCampaignRuleEnabled()  → PATCH /campaigns/rules/{id}
deleteCampaignRule(id)    → DELETE /campaigns/rules/{id}
```

### Broken imports / TypeScript errors
No broken imports found. All referenced types (`CampaignRule`, `CampaignRuleCondition`) are defined in `src/services/campaignRules.ts` and re-used correctly in `RulesSection.tsx`.

**One functional limitation:** the `RuleForm` dialog's "Produto" and "Contas de anúncio" dropdowns only show hardcoded options ("Qualquer" / "Todas"). They do not fetch real products or Facebook accounts from the backend. This is not a TypeScript error — it is an incomplete feature.

### Demo mode
`src/services/mockInterceptor.ts` has full mock coverage for `/campaigns/rules` (GET, POST, PATCH, DELETE) with three seed rules. Demo mode works correctly.

---

## 4. Frontend — Report Notifications

### Settings page
`src/features/lomustrack/notification-settings/index.tsx`  
Route: `/_dashboard/notification-settings` → `src/routes/_dashboard.notification-settings.tsx`

The page has two cards:
- **Notificações de Venda** — configure which sale events trigger a push.
- **Notificações de Relatório** — toggle the daily 08:00 report; choose template.

### Data flow
1. On mount: calls `fetchNotificationPreferences()` → `GET /api/company/notification-preferences`.
2. On change (350 ms debounce): calls `updateNotificationPreferences()` → `PUT /api/company/notification-preferences`.
3. Also writes to `localStorage` via `writeNotificationPreferences()` for immediate UI state.

Both service functions are in `src/services/company.ts`.

### Notification Bell
`src/components/NotificationBell.tsx` — in the sidebar header (desktop) in `AnimatedDashboardLayout`.

It uses `usePushNotifications` (`src/hooks/usePushNotifications.ts`) which:
- Fetches the VAPID public key from `GET /api/notifications/vapid-public-key`.
- Subscribes via `POST /api/notifications/subscribe`.
- Sends a test via `POST /api/notifications/test`.
- Unsubscribes via `DELETE /api/notifications/unsubscribe`.

### Broken imports / TypeScript errors
No broken imports found. All imports resolve to existing files.

**Gap:** `src/services/mockInterceptor.ts` does **not** handle `/company/notification-preferences`. In demo mode, `fetchNotificationPreferences()` will fall through to the real API call (since `getMockData` returns `undefined` for unhandled paths), and `apiRequest` will then throw `"Este recurso não está disponível na demonstração."` The page catches this with a toast error, so it degrades gracefully — but preferences are never loaded from the mock in demo mode. The UI still works because it falls back to `localStorage`.

---

## 5. Backend — Rules Endpoints

All four CRUD endpoints exist in `reference/original-backend/api/automation.py` and are registered in `app.py` with prefix `/api`.

The router also includes the execution engine `_run_campaign_rules()`, which:
- Queries all enabled rules for the company.
- Fetches live campaign metrics from Meta Ads API.
- Evaluates each rule's conditions (spend, CPA, CTR, ROAS, sales).
- Executes the action (activate, pause, increase/decrease budget) via Meta Ads API.
- Logs each execution in `audit_log`.

The execution is triggered by:
- `GET /api/automation/run` (runs rules + retries + reports)
- `GET /api/automation/rules/run` (rules + retries only)

Both require `Authorization: Bearer {CRON_SECRET}`.

---

## 6. Backend — Notification Endpoints

### Push subscription management
`reference/original-backend/api/notifications/subscriptions.py` — registered as `notifications_router`:

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/notifications/vapid-public-key` | Returns VAPID public key |
| POST | `/api/notifications/subscribe` | Register browser subscription |
| DELETE | `/api/notifications/unsubscribe` | Deactivate subscription |
| POST | `/api/notifications/test` | Send test push to all active subscriptions |
| GET | `/api/notifications/subscriptions` | List active subscriptions |

### Notification preferences
`reference/original-backend/api/company/settings.py`:

| Method | Endpoint |
|---|---|
| GET | `/api/company/notification-preferences` |
| PUT | `/api/company/notification-preferences` |

### Report generation mechanism
`reference/original-backend/api/automation.py` — `_send_scheduled_reports()`:
- Called by `GET /api/automation/reports/run` (cron-authenticated).
- Generates AI report body via OpenRouter.
- Delivers via VAPID push.
- Idempotent: skips if a `NotificationDelivery` with today's title already exists for the company.

### Retry mechanism
`_retry_notifications()` in the same file, also called by the automation cron, retries failed pushes up to 5 times (up to 3 actually honored, `min(max_attempts, 3)`).

---

## 7. Broken Connections

### Critical: No Vercel cron configured
`vercel.json` has `"crons": []`. Neither campaign rules nor daily reports will fire automatically without an external trigger. The GitHub Actions workflow (`.github/workflows/automation.yml`) is the intended trigger, but it requires:
- `secrets.CRON_SECRET` — must match `CRON_SECRET` env var on the backend.
- `secrets.VERCEL_DOMAIN` — must be set to the deployed domain.

If these secrets are not configured in the GitHub repository, automation never runs. **Rules will never execute and report notifications will never be sent.**

### Important: VAPID keys not configured by default
`vercel.json` does not set `VAPID_PUBLIC_KEY` or `VAPID_PRIVATE_KEY`. Without them:
- `GET /api/notifications/vapid-public-key` returns HTTP 503.
- The bell's subscription flow fails immediately.
- `POST /api/notifications/test` also returns 503.
- Daily reports cannot be delivered (no subscriptions can be created).

### Minor: Rules "Produto" / "Contas de anúncio" dropdowns are static
`RulesSection.tsx` → `RuleForm` hardcodes `<SelectItem value="any">Qualquer</SelectItem>` and `<SelectItem value="all">Todas</SelectItem>` for product and account filters. The backend supports filtering by product and account (via `definition.product` and `definition.account`), but the UI never lets the user pick a real value. In practice this means every rule applies to "any product / all accounts," which is functional but incomplete.

### Minor: No mock for `GET /company/notification-preferences`
In demo mode, `NotificationSettingsPage` will show a toast error on load ("Não foi possível carregar as preferências"), then fall back to `localStorage`. Preferences save to `localStorage` correctly. This is a minor demo experience gap, not a production bug.

### No in-app notification inbox
There is no list/badge showing past report notifications or unread alerts in the UI. The `NotificationBell` only controls push subscription on/off — it does not query `notification_deliveries` to show a history. Report notifications are delivered exclusively as browser push messages; once dismissed they are gone from the user's perspective.

---

## Conclusions & Recommendations

### What is working
- Full Rules CRUD: create, list, enable/disable, delete — all wired correctly front-to-back.
- Rules demo mode: fully mocked with realistic seed data.
- Notification settings page: loads and saves correctly to backend.
- Push notification flow: technically complete when VAPID keys are present.
- Report generation logic: complete (AI-generated, three templates, delivery log, retry queue).

### What needs fixing

**1. Configure the GitHub Actions secrets (or add a Vercel cron)**  
Add `CRON_SECRET` and `VERCEL_DOMAIN` to the GitHub repository secrets. Alternatively, add a Vercel cron entry in `vercel.json`:
```json
"crons": [
  { "path": "/api/automation/run", "schedule": "0 6 * * *" }
]
```
Note: Vercel crons do not support custom authorization headers, so a query-parameter-based secret or IP restriction would be needed if switching from the GitHub Actions approach.

**2. Set VAPID keys in production**  
Generate a VAPID key pair and add `VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY` to the backend environment. Without this, the bell and all push notifications are non-functional.

**3. Add `notification-preferences` mock (minor, demo only)**  
In `src/services/mockInterceptor.ts`, add a handler for `path === "/company/notification-preferences"` returning the default preferences object. This avoids the error toast in demo mode.

**4. Populate rule form dropdowns with live data (nice-to-have)**  
In `RulesSection.tsx` → `RuleForm`, fetch products from `/api/products` and Facebook accounts from `/api/facebook/accounts` to populate the "Produto" and "Contas de anúncio" selects.
