## Codebase Patterns
- Use `requireRole` inside `beforeLoad` with redirect only when unauthenticated, and render `NotAuthorized` from `Route.useRouteContext()` for role gating.

## 2026-02-06 - golf-pool-3cj.5
- Implemented role gating for admin routes and data import with a shared NotAuthorized screen.
- Files changed: src/components/NotAuthorized.tsx, src/routes/admin.tsx, src/routes/admin/users.tsx, src/routes/admin/users/$userId.tsx, src/routes/data-import.tsx, .ralph-tui/progress.md
- **Learnings:**
  - Admin routes already used `requireRole` but redirected on unauthorized; shifting to a UI gate preserves friendly messaging.
  - Data import route had no access guard and now relies on `requireRole`.
---
