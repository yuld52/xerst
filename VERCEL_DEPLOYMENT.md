# Vercel deployment

The repository is configured as a Vercel Services project:

- `app` builds the TanStack Start frontend from the repository root.
- `original-backend` builds the FastAPI service from `reference/original-backend`.
- Public `/api/*` requests go to FastAPI; all other paths go to the frontend.
- The API rewrite preserves the original `/api/...` path expected by FastAPI.
- The frontend uses the same-origin `/api` URL by default. Leave `VITE_API_URL` unset on Vercel.
- The backend uses Python 3.12. Apply the Supabase schema SQL before deployment; Vercel does not run schema migrations at function startup.
- Scheduled automation uses Vercel Schedules (the replacement for legacy Cron Jobs): campaign rules run every 15 minutes and scheduled reports every hour. The Hobby plan includes 5,000 schedule runs per month; this configuration uses about 3,720 runs in a 31-day month. Schedules have a 1–15 minute jitter window, so they are not guaranteed to start on the exact minute.

## Vercel project setup

Create or configure the Vercel project from the repository root. Services are currently a beta feature; the Vercel project must have Services enabled and use the Services framework setting. Keep the root directory at `.` so Vercel can read the root `vercel.json` and build both services.

## Environment variables

Set these as Vercel environment variables for the backend service:

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | Yes | PostgreSQL connection string. Use the provider's serverless or transaction pooler URL. |
| `SECRET_KEY` | Yes | Unique, high-entropy secret used to sign login tokens. Rotating it invalidates existing sessions. |
| `CRON_SECRET` | Yes | Protects the scheduled automation and report endpoints. Use a unique random value. |
| `OPENROUTER_API_KEY` | For AI features | Server-side OpenRouter credential. Never expose it through a `VITE_` variable. |
| `OPENROUTER_MODEL` | Optional | OpenRouter model name. Defaults to `openai/gpt-4o-mini`. |
| `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` | For push notifications | A matching VAPID key pair. Keep the private key server-side. |
| `VAPID_CLAIM_EMAIL` | Optional for push | Contact email used in VAPID claims; defaults to `admin@lomustrack.app`. |
| `META_GRAPH_API_VERSION` | Optional | Meta Graph API version; defaults to `v25.0`. Meta app ID/secret and redirect URI are not read by the current backend. |
| `CORS_ALLOWED_ORIGINS` | Only for cross-origin clients | Comma-separated trusted origins. Same-origin frontend/API traffic needs no CORS entry. |

Configure these on the `app` service, all pointing to the same Supabase project as `DATABASE_URL`:

- `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` for the browser build. These values are public; the publishable key is designed to be exposed to the browser.
- `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` for server-side rendering and the Supabase auth middleware.

`VITE_API_URL` should be unset on Vercel so the app uses the same-origin `/api` route. `VERCEL` is provided by Vercel automatically. The current code has no active call site for `SUPABASE_SECRET_KEY`/`SUPABASE_SERVICE_ROLE_KEY`, `LOVABLE_CRON_SECRET`, `META_APP_ID`, `META_APP_SECRET`, `META_REDIRECT_URI`, or Stripe environment secrets; do not add them unless that code is introduced. Never expose a secret key with a `VITE_` prefix. Percent-encode reserved characters in the database password when placing the connection string in `DATABASE_URL`.

Templates are in [`.env.example`](.env.example) and [`reference/original-backend/.env.example`](reference/original-backend/.env.example). Replace every placeholder with values from your providers; do not commit real environment files.

## Credentials previously stored in the repository

The local backend launcher and push service previously contained credentials in source. They have been removed from the current files. Since those values were already committed, rotate the PostgreSQL password and VAPID key pair with their providers before using this repository for a public deployment. Set the replacements only in Vercel and local ignored `.env` files.

## Local development

Copy the backend environment template to `reference/original-backend/.env`, fill in a PostgreSQL URL and a random `SECRET_KEY`, then start the backend with `start_backend.ps1`. The frontend can continue using Vite; its API requests default to `/api` unless `VITE_API_URL` is explicitly set.
