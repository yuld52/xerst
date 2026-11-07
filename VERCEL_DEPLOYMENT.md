# Vercel deployment

The repository is configured as a Vercel Services project:

- `app` builds the TanStack Start frontend from the repository root.
- `original-backend` builds the FastAPI service from `reference/original-backend`.
- Public `/api/*` requests go to FastAPI; all other paths go to the frontend.
- The API rewrite preserves the original `/api/...` path expected by FastAPI.
- The frontend uses the same-origin `/api` URL by default. Leave `VITE_API_URL` unset on Vercel.
- The backend uses Python 3.12 and serializes database schema initialization across simultaneous function cold starts.

## Vercel project setup

Create or configure the Vercel project from the repository root. Services are currently a beta feature; the Vercel project must have Services enabled and use the Services framework setting. Keep the root directory at `.` so Vercel can read the root `vercel.json` and build both services.

## Environment variables

Set these as Vercel environment variables for the backend service:

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | Yes | PostgreSQL connection string. Use the provider's serverless or transaction pooler URL. |
| `SECRET_KEY` | Yes | Unique, high-entropy secret used to sign login tokens. Rotating it invalidates existing sessions. |
| `OPENROUTER_API_KEY` | For AI features | Server-side OpenRouter credential. Never expose it through a `VITE_` variable. |
| `META_APP_ID`, `META_APP_SECRET` | For Meta OAuth | Meta app credentials. |
| `META_REDIRECT_URI` | For Meta OAuth | Exact callback URL, ending in `/api/meta/callback`, registered with Meta. |
| `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` | For push notifications | A newly generated VAPID key pair. The private key must remain server-side. |
| `VAPID_CLAIM_EMAIL` | For push notifications | Contact email included in VAPID claims. |
| `CORS_ALLOWED_ORIGINS` | Only for cross-origin clients | Comma-separated trusted origins. Same-origin frontend/API traffic needs no CORS entry. |

Configure `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` for the frontend build, plus `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` for the globally attached Supabase auth middleware. `SUPABASE_SECRET_KEY` is only needed by server-side admin operations that use the Supabase admin client. Never expose a secret key with a `VITE_` prefix.

Templates are in [`.env.example`](.env.example) and [`reference/original-backend/.env.example`](reference/original-backend/.env.example). Replace every placeholder with values from your providers; do not commit real environment files.

## Credentials previously stored in the repository

The local backend launcher and push service previously contained credentials in source. They have been removed from the current files. Since those values were already committed, rotate the PostgreSQL password and VAPID key pair with their providers before using this repository for a public deployment. Set the replacements only in Vercel and local ignored `.env` files.

## Local development

Copy the backend environment template to `reference/original-backend/.env`, fill in a PostgreSQL URL and a random `SECRET_KEY`, then start the backend with `start_backend.ps1`. The frontend can continue using Vite; its API requests default to `/api` unless `VITE_API_URL` is explicitly set.
