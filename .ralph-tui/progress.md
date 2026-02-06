## Codebase Patterns
- Use `requireRole` inside `beforeLoad` with redirect only when unauthenticated, and render `NotAuthorized` from `Route.useRouteContext()` for role gating.
- For public auth routes (`/login`, `/signup`), use `requireAuth` in `beforeLoad` and redirect authenticated users to `/leaderboard`.
- Server functions return `{ success: false, error: { code, message } }` for auth failures so the UI can handle unauthorized states consistently.

## 2026-02-06 - golf-pool-3cj.5
- Implemented role gating for admin routes and data import with a shared NotAuthorized screen.
- Files changed: src/components/NotAuthorized.tsx, src/routes/admin.tsx, src/routes/admin/users.tsx, src/routes/admin/users/$userId.tsx, src/routes/data-import.tsx, .ralph-tui/progress.md
- **Learnings:**
  - Admin routes already used `requireRole` but redirected on unauthorized; shifting to a UI gate preserves friendly messaging.
  - Data import route had no access guard and now relies on `requireRole`.
---

## 2026-02-06 - golf-pool-3cj.3
- Wired login success to redirect to `/leaderboard` and added authenticated redirects on `/login` and `/signup`.
- Updated login/signup error messaging to be clear and production-ready.
- Files changed: src/routes/login.tsx, src/routes/signup.tsx, .ralph-tui/progress.md
- **Learnings:**
  - `requireAuth` in `beforeLoad` provides a simple gate for redirecting signed-in users.
---

## 2026-02-06 - golf-pool-3cj.6
- Added server-side auth/role gating for scoring imports and standardized serverFn error responses.
- Files changed: src/lib/server-functions.ts, .ralph-tui/progress.md
- **Learnings:**
  - `auth.api.getSession` with `getRequestHeaders()` enables serverFn-level access checks without redirects.
---

## 2026-02-06 - golf-pool-3cj.6
- Verified server-side enforcement is present for serverFns and matches acceptance criteria.
- Files changed: .ralph-tui/progress.md
- **Learnings:**
  - None.
---
