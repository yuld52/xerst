# Review: Email Confirmation and Password Reset Flow Fix

Commit reviewed: `a95bfcb` — "fix: repair email confirmation and password reset flows"

## Evidence

### AppGuard.tsx — publicPaths addition

Diff confirms a single-line change on line 20:

```
- const publicPaths = ["/login", "/setup", "/admin-login", "/documentation", "/forgot-password"];
+ const publicPaths = ["/login", "/setup", "/admin-login", "/documentation", "/forgot-password", "/verify-email", "/reset-password"];
```

Both `/verify-email` and `/reset-password` are now in the array. The guard's logic (`publicPaths.includes(location.pathname)`) short-circuits before the `isAuthenticated()` check, so unauthenticated users reaching either path are served the page without a redirect to `/login`. Route files `src/routes/verify-email.tsx` and `src/routes/reset-password.tsx` both exist and register the matching TanStack file routes. Requirement satisfied.

### auth.ts — requestPasswordReset error propagation

The previous implementation wrapped the `apiRequest` call in a `try/catch` that caught all errors and returned a fake-success object, so the caller could never distinguish a network error from a successful dispatch. The diff removes that entire `try/catch`, leaving only the demo-mode guard (`isImportDemo()` returns early with a canned message) and a bare `return await apiRequest(...)`. Errors from `apiRequest` now propagate as thrown exceptions to callers. Requirement satisfied; demo guard is intact.

### forgot-password/index.tsx — caller error handling

No change was made to this file. The existing `handleSubmit` has:

```ts
try {
  const res = await requestPasswordReset(data.email);
  setSuccessMessage(res.message || "...");
  toast.success("...");
} catch (err) {
  const msg = err instanceof Error ? err.message : "Erro ao solicitar recuperação de senha";
  setError(msg);
  toast.error(msg);
}
```

With the silent catch removed in `auth.ts`, thrown errors now reach this `catch` block and are shown to the user via `setError` and `toast.error`. The chain is complete.

### Constraint checks

| Constraint | Result |
|---|---|
| No `supabase.auth.*` in changed files | ✅ No matches |
| No `onAuthStateChange` anywhere in `src/` | ✅ No matches |
| No Supabase auth callback routes added | ✅ Confirmed |
| All auth calls via `src/services/auth.ts` / `src/services/api.ts` | ✅ Confirmed |

### Scope check

The commit touches exactly two files (`src/components/layout/AppGuard.tsx`, `src/services/auth.ts`). No unrequested behavior was added. The commit message explicitly notes that pre-existing TypeScript errors in `auth-form.tsx`, `reset-password/index.tsx`, and `verify-email/index.tsx` were not introduced by this change.

## Verdict

**APPROVED** — all three required changes are correctly implemented, all constraints hold, and no new correctness, security, or data failures are introduced.
