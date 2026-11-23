# Findings: Email Confirmation & Password Reset Flow

## Summary

The app has two entirely separate auth systems running side by side and they are not integrated with each other.

- The **Supabase client** (`src/integrations/supabase/client.ts`) is provisioned and correctly configured with real credentials, but it is used **only** for attaching bearer tokens to serverFn RPCs. No auth flow — login, signup, email confirmation, or password reset — calls any `supabase.auth.*` method.
- The **actual auth flows** (login, forgot password, reset password, verify email) all call a **custom FastAPI backend** at `/api/*` via `src/services/auth.ts` and `src/services/api.ts`.

The result is that **none of the Supabase email flows work**: Supabase will send confirmation or password-reset emails that link back to the app, but no route is waiting to handle those links, and `supabase.auth.resetPasswordForEmail()` is never called in the first place. The custom-backend flows may or may not work depending on whether the FastAPI service is running and reachable.

---

## Question-by-question findings

### 1. Dedicated email confirmation callback route

**Finding: No Supabase callback route exists.**

Supabase sends email confirmation links in the form:
```
https://<app>/auth/confirm?token_hash=<hash>&type=signup
```
or (for PKCE / newer flows):
```
https://<app>/auth/callback#access_token=...&type=signup
```

No route in this app matches `/auth/confirm` or `/auth/callback`. The route tree (`src/routeTree.gen.ts`) registers:

| Route path | File |
|---|---|
| `/verify-email` | `src/routes/verify-email.tsx` |
| `/reset-password` | `src/routes/reset-password.tsx` |
| `/forgot-password` | `src/routes/forgot-password.tsx` |
| `/login` | `src/routes/login.tsx` |

The `/verify-email` page (`src/features/lomustrack/verify-email/index.tsx`) does not exchange a Supabase token. It reads `?email=` from the URL and submits a 6-digit code to the custom backend at `POST /api/setup/verify-code`. This is an entirely separate OTP mechanism unrelated to Supabase email links.

There is no code anywhere in the project that calls `supabase.auth.verifyOtp()`, `supabase.auth.exchangeCodeForSession()`, or any Supabase token exchange.

**Conclusion:** If Supabase is configured to send email confirmation links, users who click them will land on a 404 or the app root, not on a handler. The confirmation will never complete.

---

### 2. Forgot password page and `resetPasswordForEmail`

**Finding: The page exists but does not call `supabase.auth.resetPasswordForEmail()`.**

`src/features/lomustrack/forgot-password/index.tsx` calls `requestPasswordReset(email)` from `src/services/auth.ts`.

```ts
// src/services/auth.ts, line ~72
export async function requestPasswordReset(email: string): Promise<{ message: string }> {
  if (isImportDemo()) {
    return { message: "Instruções de recuperação enviadas para seu e-mail." };
  }
  try {
    return await apiRequest<{ message: string }>("/forgot-password", {
      method: "POST",
      body: { email },
    });
  } catch (error) {
    // Falls back to a fake-success message even on error
    return { message: "Se o e-mail estiver cadastrado, as instruções foram enviadas." };
  }
}
```

This calls `POST /api/forgot-password` on the custom backend. The backend is a FastAPI service at `reference/original-backend/` (preserved as reference only, not deployed). The catch block silently swallows all errors and returns a success-like message, so the UI always shows "instructions sent" even if the backend is down or the endpoint doesn't exist.

`supabase.auth.resetPasswordForEmail()` is **never called** anywhere in the codebase (confirmed by grep).

**Conclusion:** Password reset emails are not sent through Supabase. Whether they are sent at all depends on the FastAPI backend being deployed and having email sending configured.

---

### 3. Route handling the password-reset redirect from email

**Finding: `/reset-password` exists but uses a URL `?token=` parameter, not a Supabase recovery session.**

`src/features/lomustrack/reset-password/index.tsx`:

```ts
const token = searchParams.get("token") || "";
// ...
await resetPassword(token, data.password, data.confirmPassword);
// → POST /api/reset-password  { token, password, confirm_password }
```

This expects the FastAPI backend to have issued a one-time token and embedded it as `?token=` in the email link. It has nothing to do with Supabase's `PASSWORD_RECOVERY` session mechanism.

There is no `onAuthStateChange` listener anywhere in the app (confirmed by grep returning no results). Supabase triggers `PASSWORD_RECOVERY` as an auth state event when a user lands on the app after clicking a Supabase password-reset link; a listener is required to catch that event and gate access to the new-password form. Without it, Supabase-originated reset links cannot work.

**Conclusion:** The `/reset-password` route works only with tokens issued by the FastAPI backend. Supabase reset links point to this route with `#access_token=...&type=recovery` in the hash, which is never read.

---

### 4. Missing pieces in the flow

| Issue | Severity | Detail |
|---|---|---|
| No Supabase auth callback route | **Critical** | No `/auth/confirm` or `/auth/callback` route exists. Supabase email confirmation links land on 404. |
| `supabase.auth.resetPasswordForEmail()` never called | **Critical** | Password reset emails are not sent through Supabase at all. |
| No `onAuthStateChange` listener | **Critical** | `PASSWORD_RECOVERY` and `SIGNED_IN` events are never handled. The Supabase recovery session is silently dropped. |
| `/reset-password` reads `?token=` not Supabase session | **High** | If Supabase reset links were sent, they carry the session in the URL hash (`#access_token=...`), not as `?token=`. The page reads `searchParams.get("token")` which reads query parameters, not hash fragments. |
| `/verify-email` and `/reset-password` missing from `AppGuard` publicPaths | **Medium** | `AppGuard` (`src/components/layout/AppGuard.tsx`) only allows unauthenticated access to `["/login", "/setup", "/admin-login", "/documentation", "/forgot-password"]`. The routes `/verify-email` and `/reset-password` are not in that list. An unauthenticated user who follows an email link will be immediately redirected to `/login` before the page can render. |
| `requestPasswordReset` swallows all errors | **Medium** | The `catch` block in `src/services/auth.ts` returns a fake-success message, hiding backend failures from the user and from developers. |
| No `redirectTo` configured on Supabase client | **Medium** | There is no `redirectTo` URL passed to any Supabase auth call. Without it, Supabase defaults to the Site URL configured in the Supabase dashboard; if that URL is wrong (e.g. still the default `http://localhost:3000` instead of `http://localhost:8080` or the production domain), confirmation emails will redirect to the wrong host. |
| Two auth systems not integrated | **High** | Supabase auth and the custom FastAPI auth coexist but are not bridged. Sessions are stored differently: Supabase uses `localStorage` via `brokeredPreviewStorage`, while the custom auth stores `access_token` as a cookie and `user` in `localStorage`. `isAuthenticated()` in `src/services/auth.ts` reads only the cookie; it is blind to any Supabase session. |

---

### 5. Environment variables

**`.env` contents:**

```
SUPABASE_PROJECT_ID="faorqystmzibxichedfv"
SUPABASE_PUBLISHABLE_KEY="sb_publishable_QnmrNkmIiv6cU6QpPKGwlA_v3Jw-Ij6"
SUPABASE_URL="https://faorqystmzibxichedfv.supabase.co"
VITE_SUPABASE_PROJECT_ID="faorqystmzibxichedfv"
VITE_SUPABASE_PUBLISHABLE_KEY="sb_publishable_QnmrNkmIiv6cU6QpPKGwlA_v3Jw-Ij6"
VITE_SUPABASE_URL="https://faorqystmzibxichedfv.supabase.co"
```

Observations:

- The key name used is `VITE_SUPABASE_PUBLISHABLE_KEY`, not `VITE_SUPABASE_ANON_KEY`. The client code (`src/integrations/supabase/client.ts`) reads `VITE_SUPABASE_PUBLISHABLE_KEY`, which matches — this is consistent and correct for the new Supabase key format (`sb_publishable_...`).
- There is no `VITE_API_URL` set, so the API base URL falls back to `/api` in dev and `https://www.lomustrack.online/api` in production (from `src/services/api.ts` line 3). The dev proxy to `/api` relies on a Vite or Vercel rewrite — Vercel rewrites exist in `vercel.json` but a local dev server would need a Vite proxy configured separately.
- There is no `VITE_SUPABASE_ANON_KEY` — this is intentional; the project uses the newer `sb_publishable_` key format instead.
- The redirect URL for email links is **not set** in any env file. The `redirectTo` parameter used in `supabase.auth.signInWithOtp()` or `resetPasswordForEmail()` would need to point to `http://localhost:8080` for local dev. Since those calls are never made in this codebase, this is currently a non-issue, but it becomes critical if Supabase auth is wired up.

---

## Conclusions and recommendations

The email confirmation and password reset flows **do not currently work end-to-end** via Supabase. The app was ported from a custom-backend auth system (FastAPI + cookie-based tokens + 6-digit OTP codes) and the Supabase integration was added for session attachment to serverFn RPCs, but the email flows were never migrated.

There are two valid paths to fix this:

### Option A — Migrate to Supabase auth (recommended for a production SaaS)

This is the right long-term approach since the project already has a Supabase client and credentials.

1. **Forgot password:** Replace `requestPasswordReset` with `supabase.auth.resetPasswordForEmail(email, { redirectTo: 'http://localhost:8080/reset-password' })`.
2. **Reset password page:** Remove the `?token=` read. Add an `onAuthStateChange` listener (or a `useEffect` on mount) that calls `supabase.auth.getSession()`, checks for `type === 'recovery'`, and only then shows the form. On submit, call `supabase.auth.updateUser({ password: newPassword })`.
3. **Email confirmation callback:** Add a route `/auth/confirm` (or configure Supabase to redirect to `/reset-password` with `?type=recovery`) that calls `supabase.auth.verifyOtp({ token_hash, type })` using parameters from the URL.
4. **AppGuard:** Add `/reset-password`, `/verify-email`, and `/auth/confirm` to the `publicPaths` array so unauthenticated users are not bounced before the page renders.
5. **`isAuthenticated()`:** Change it to check `supabase.auth.getSession()` instead of a cookie, or bridge the two (create the cookie when Supabase signs in).
6. **Supabase dashboard:** Set "Site URL" to `http://localhost:8080` for local dev and the production domain for prod. Add both as allowed redirect URLs.

### Option B — Fix the custom-backend flows (minimal change)

If the FastAPI backend is the intended auth source:

1. Ensure the backend's `/forgot-password` endpoint sends emails with links pointing to `http://localhost:8080/reset-password?token=<token>`.
2. Add `/reset-password` and `/verify-email` to `AppGuard`'s `publicPaths`.
3. Remove the error-swallowing catch block in `requestPasswordReset` so failures surface to the user.
4. Confirm the backend is deployed and reachable at the expected URL.

---

## Files cited

| File | Relevance |
|---|---|
| `src/features/lomustrack/forgot-password/index.tsx` | Forgot password UI; calls custom backend only |
| `src/features/lomustrack/reset-password/index.tsx` | Reset password UI; reads `?token=` query param |
| `src/features/lomustrack/verify-email/index.tsx` | Verify email UI; submits OTP code to custom backend |
| `src/services/auth.ts` | All auth service functions; no `supabase.auth.*` calls |
| `src/services/api.ts` | Custom backend HTTP client |
| `src/components/layout/AppGuard.tsx` | Route guard; missing `/reset-password` and `/verify-email` from public paths |
| `src/integrations/supabase/client.ts` | Supabase client; used only for session bearer token |
| `src/integrations/supabase/auth-attacher.ts` | Attaches Supabase bearer to serverFn RPCs |
| `src/components/import-providers.tsx` | Wraps app in `AppGuard` |
| `src/routes/reset-password.tsx` | Route registration only; no logic |
| `src/routes/verify-email.tsx` | Route registration only; no logic |
| `.env` | Supabase credentials present; no `VITE_API_URL` or redirect URL |
| `src/routeTree.gen.ts` | Confirms all routes registered; no `/auth/confirm` or `/auth/callback` |
