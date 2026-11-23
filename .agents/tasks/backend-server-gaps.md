# Backend Server Gaps — Email Confirmation & Password Reset

**Summary:** The reference FastAPI backend has all three required endpoints fully implemented (`POST /forgot-password`, `POST /reset-password`, `POST /setup/verify-code`). Email is sent via the **Resend** service. The critical gaps are: (1) `RESEND_API_KEY` is **absent from `.env.example`** and from the Vercel env-var table, so email never gets sent in production; (2) `vite.config.ts` has **no dev proxy**, so local development cannot reach the backend unless you set `VITE_API_URL`; (3) the **Vercel Services feature is in beta** and the `vercel.json` multi-service setup works correctly in its current form but requires the beta to be enabled on the project. No Dockerfile exists in the repo root; Render deploy docs reference one but it is missing.

---

## 1. Vite Dev Proxy

**Finding: No proxy configured — relies on `VITE_API_URL` env var instead.**

`vite.config.ts` delegates everything to `@lovable.dev/vite-tanstack-config` and sets only `nitro.preset` and a custom server entry. There is no `server.proxy` block.

`src/services/api.ts` resolves the base URL as:

```ts
const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? "/api" : "https://www.lomustrack.online/api");
```

In dev mode, it falls back to the same-origin `/api`. Because Vite has no proxy rule, that path is served by the Vite dev server itself, not forwarded to FastAPI on `localhost:8000`. Requests will 404 unless the developer either:

- sets `VITE_API_URL=http://localhost:8000/api` in `.env.local`, or
- adds a Vite proxy in `vite.config.ts`:

```ts
// inside defineConfig({ vite: { ... } })
server: {
  proxy: {
    "/api": {
      target: "http://localhost:8000",
      changeOrigin: true,
    },
  },
},
```

**Recommendation:** Add the proxy block to `vite.config.ts` via the `vite` option passed to `defineConfig`. This is the standard TanStack Start approach and matches how `@lovable.dev/vite-tanstack-config` accepts extra config.

---

## 2. Backend Reference Endpoints

### `POST /forgot-password` — ✅ Present and complete

**File:** `reference/original-backend/api/auth/login.py` — `forgot_password()`

- Accepts `{ email }`.
- Generates a 64-char hex reset token with `secrets.token_hex(32)`.
- Stores `password_reset_token` and `password_reset_expires` (1 hour) on the `Admin` row.
- Calls `send_password_reset_email(admin.email, reset_token, base_url)`.
- The email function in `services/email.py` builds the link as `{base_url}/reset-password?token={reset_token}`.
- `base_url` is **hardcoded** to `"https://www.lomustrack.online"`. On Vercel or any other domain, the link in the email will point to the wrong domain.

**Gap:** `base_url` is not read from an env var. Add `BASE_URL = os.getenv("BASE_URL", "https://www.lomustrack.online")` to `app.py` or `services/email.py` and pass it through.

### `POST /reset-password` — ✅ Present and complete

**File:** `reference/original-backend/api/auth/login.py` — `reset_password()`

- Accepts `{ token, password, confirm_password }`.
- Looks up the admin by `password_reset_token`.
- Checks expiry against `password_reset_expires`.
- Hashes the new password with bcrypt, clears the token fields, increments `token_version` (invalidates existing JWT sessions).
- Returns `{ message: "Senha redefinida com sucesso. Faça login com a nova senha." }`.

**No gaps.** Logic is complete.

### `POST /setup/verify-code` — ✅ Present and complete

**File:** `reference/original-backend/api/auth/setup.py` — `verify_signup_code()`

- Accepts `{ email, code }`.
- Validates the 6-digit code against `email_verification_code` and checks `email_verification_expires` (10-minute window).
- Marks `is_email_verified = True`, clears the code fields.
- Calls `send_welcome_email(admin.email, admin.name)`.
- Generates and returns a JWT `access_token` for automatic login.

**No gaps.** Logic is complete.

The companion `POST /setup/resend-code` endpoint is also implemented (`resend_verification_code()` in the same file).

---

## 3. Email Sending

**Provider:** [Resend](https://resend.com) — Python `resend` package (listed in `requirements.txt`).

**File:** `reference/original-backend/services/email.py`

```python
RESEND_API_KEY = os.getenv("RESEND_API_KEY")
FROM_EMAIL = os.getenv("FROM_EMAIL", "LomusTrack <noreply@lomustrack.app>")

if RESEND_API_KEY:
    resend.api_key = RESEND_API_KEY
else:
    logger.warning("RESEND_API_KEY não configurada. Emails não serão enviados.")
```

When `RESEND_API_KEY` is absent, `_send_email()` returns `False` and logs a warning — no exception is raised. The API endpoints (`/forgot-password`, `/setup`) still return HTTP 200. Users receive no email and have no indication anything is wrong.

**Required env vars for email:**

| Variable | Required | Note |
|---|---|---|
| `RESEND_API_KEY` | **Yes** | Resend dashboard → API Keys |
| `FROM_EMAIL` | Optional | Defaults to `LomusTrack <noreply@lomustrack.app>`. Must be a verified sender domain in Resend. |

**Critical gap:** `RESEND_API_KEY` does not appear in `reference/original-backend/.env.example` or in the `VERCEL_DEPLOYMENT.md` environment variable table. It needs to be added to both so it is not silently omitted during deployment.

---

## 4. Environment Variables

### Backend (`reference/original-backend/.env.example` + `VERCEL_DEPLOYMENT.md`)

| Variable | Required | Source / Purpose |
|---|---|---|
| `DATABASE_URL` | **Yes** | PostgreSQL connection string; must be pooler URL for Vercel Functions |
| `SECRET_KEY` | **Yes** | JWT signing secret; rotating invalidates all sessions |
| `CRON_SECRET` | **Yes** | Protects scheduled automation endpoints |
| `RESEND_API_KEY` | **Yes for email** | **Missing from both `.env.example` and deployment docs** |
| `FROM_EMAIL` | Optional | Resend sender address; must be a verified domain |
| `BASE_URL` | Optional | Currently hardcoded to `https://www.lomustrack.online`; needs to be configurable |
| `CORS_ALLOWED_ORIGINS` | Dev only | Defaults to `http://localhost:8080,http://localhost:5173` |
| `OPENROUTER_API_KEY` | For AI | Server-side only |
| `OPENROUTER_MODEL` | Optional | Defaults to `openrouter/free` |
| `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` | For push | VAPID key pair |
| `VAPID_CLAIM_EMAIL` | Optional | VAPID contact email |
| `META_GRAPH_API_VERSION` | Optional | Defaults to `v25.0` |

**Note:** `RESEND_API_KEY` is confirmed absent from `reference/original-backend/.env.example` — the file ends at `SUPABASE_SECRET_KEY=` with no mention of Resend or email config.

### Frontend (`.env.example` / Vercel `app` service)

| Variable | Required | Note |
|---|---|---|
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` | For Supabase features | Public; safe in `VITE_` |
| `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` | SSR / auth middleware | Server-side |
| `VITE_API_URL` | Local dev only | Leave unset on Vercel; set to `http://localhost:8000/api` locally if no proxy |

---

## 5. Production Deployment

**Vercel (`vercel.json`):**

```json
{
  "services": {
    "app": { "root": ".", "framework": "tanstack-start" },
    "original-backend": { "root": "reference/original-backend", "framework": "fastapi" }
  },
  "rewrites": [
    { "source": "/api/(.*)", "destination": { "service": "original-backend" } },
    { "source": "/(.*)", "destination": { "service": "app" } }
  ]
}
```

The rewrite sends `/api/*` to FastAPI and all other paths to the TanStack frontend. This is correct. VERCEL_DEPLOYMENT.md confirms: "Leave `VITE_API_URL` unset on Vercel so the app uses the same-origin `/api` route."

**Gaps / notes:**

- **Vercel Services is in beta.** The project must have Services enabled. This is a beta feature and not available on all accounts by default.
- **No Dockerfile in the repository root.** `docker-compose.yml` and `RENDER_DEPLOY.md` reference a `Dockerfile` for Render deployment, but no `Dockerfile` file exists in the workspace (confirmed by file search). Render deployment via Docker is documented but not functional without it.
- **`BASE_URL` is hardcoded.** The `forgot_password()` handler passes `base_url = "https://www.lomustrack.online"` directly. If deployed to Vercel or any other domain, the reset-password link in the email points to the wrong domain.
- **Schema migration.** `VERCEL_DEPLOYMENT.md` says "Apply the Supabase schema SQL before deployment; Vercel does not run schema migrations at function startup." The `Admin` model columns `password_reset_token`, `password_reset_expires`, `email_verification_code`, `email_verification_expires`, `is_email_verified` must exist in the production DB; they are defined in `database/models/admin.py` but `Base.metadata.create_all` is skipped on Vercel (`initialize_database()` is only called when `VERCEL` env var is absent).

---

## 6. Token Generation and Validation

**Password reset tokens:**

- **Generation:** `secrets.token_hex(32)` — 64 hex characters, cryptographically random. (`login.py` line `reset_token = secrets.token_hex(32)`)
- **Storage:** Stored directly in the `admins` table as `password_reset_token` (column type `String(64)`, `unique=True`). There is no separate token table.
- **Expiry:** `password_reset_expires = datetime.utcnow() + timedelta(hours=1)` — 1-hour window. Checked in `reset_password()` via `admin.password_reset_expires < datetime.utcnow()`.
- **Invalidation after use:** Token and expiry are cleared (`admin.password_reset_token = None`) after a successful password change. `token_version` is incremented to invalidate any existing JWTs.

**Email verification OTPs:**

- **Generation:** `str(secrets.randbelow(900000) + 100000)` — 6-digit integer OTP. (`setup.py`)
- **Storage:** Stored in `email_verification_code` (String(6)) and `email_verification_expires` (10-minute window) on the `Admin` row.
- **Validation:** Exact string match of the submitted code, then expiry check.
- **Invalidation after use:** Both fields are set to `None` after verification; `is_email_verified` is set to `True`.

**No gap in token logic.** The mechanism is sound.

---

## Conclusions and Recommendations

### Critical (blocks email flows entirely)

1. **Add `RESEND_API_KEY` to `reference/original-backend/.env.example`** and to the env-var table in `VERCEL_DEPLOYMENT.md`. Without it, all three flows (email confirmation, resend code, password reset) silently succeed on the HTTP level but never deliver an email.

2. **Make `base_url` configurable.** In `reference/original-backend/api/auth/login.py` `forgot_password()`, replace the hardcoded `base_url = "https://www.lomustrack.online"` with `base_url = os.getenv("BASE_URL", "https://www.lomustrack.online")`. Add `BASE_URL` to `.env.example` and `VERCEL_DEPLOYMENT.md`.

### Important (blocks local development)

3. **Add a Vite dev proxy for `/api`** in `vite.config.ts`, or document that developers must set `VITE_API_URL=http://localhost:8000/api` in `.env.local`. Without either, frontend API calls in dev fall through to the Vite dev server and return 404.

### Minor

4. **Add `FROM_EMAIL` to `.env.example`** (backend). The default sender is `noreply@lomustrack.app`; if the production domain is different or not verified in Resend, emails will bounce.

5. **Confirm production DB has the auth columns.** `password_reset_token`, `password_reset_expires`, `email_verification_code`, `email_verification_expires`, `is_email_verified` must be applied manually to the Supabase/PostgreSQL schema before first deploy, since `create_all` is skipped on Vercel.

6. **Create the missing Dockerfile** if Render deployment is intended. The `docker-compose.yml` and `RENDER_DEPLOY.md` reference `./Dockerfile` but no such file exists in the repository.
