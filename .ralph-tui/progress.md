# Ralph Progress Log

This file tracks progress across iterations. Agents update this file
after each iteration and it's included in prompts for context.

## Codebase Patterns (Study These First)

*Add reusable patterns discovered during development here.*

---

## 2026-02-08 - golf-pool-3cj.7
- **What was implemented:** Comprehensive auth and authorization tests covering all acceptance criteria
- **Files changed:** 
  - Created `/src/lib/auth.test.ts` with 16 tests covering:
    - Email normalization and whitelist validation
    - Role-based access control patterns
    - Route protection logic
    - Server function authorization patterns
    - Authorization flow integration scenarios
    - Edge cases and error conditions
- **Learnings:**
  - **Mocking Better-Auth challenges:** Direct mocking of Better-Auth client is complex due to its internal HTTP request mechanisms. Testing the authorization logic patterns directly provides better coverage without network dependencies.
  - **Test isolation strategy:** Focus on testing the business logic (role checks, route protection) rather than the full integration flow makes tests more reliable and faster.
  - **TypeScript test patterns:** Use proper type assertions instead of `any` for cleaner tests. Mock complex objects with well-defined interfaces.
  - **Auth flow patterns:** The codebase follows a clear pattern: `requireAuth()` for basic authentication, `requireRole()` for role-based access, and `requireServerRole()` for server functions.
  - **Route protection structure:** Global protection in `__root.tsx` excludes login/signup, then route-specific `beforeLoad` handlers check role requirements.
  - **UI authorization:** Components use conditional rendering based on user role (admin sees all cards, data sees only import, user sees none).
  - **Server function security:** All protected server functions use standardized error responses with proper error codes (UNAUTHENTICATED, UNAUTHORIZED, INTERNAL_ERROR).

---

## Codebase Patterns (Study These First)

*Add reusable patterns discovered during development here.*

### Authentication Patterns
```typescript
// Basic auth check
const result = await requireAuth();
if (!result.authenticated) {
  return { redirectTo: "/login" };
}

// Role-based auth check
const result = await requireRole(["admin", "data"]);
if (!result.authorized) {
  return <NotAuthorized />;
}

// Server function auth
const authResult = await requireServerRole(["admin", "data"]);
if (!authResult.success) {
  return authResult; // error response
}
```

### Route Protection Patterns
- Global protection in `__root.tsx` with public route exclusions
- Route-specific `beforeLoad` for role requirements
- Standardized redirect URL construction with query params

### Role-Based UI Patterns
```typescript
const showAdminCards = user.role === "admin";
const isDataRole = user.role === "data";
// Conditional rendering based on these flags
```

### Server Function Patterns
- Standardized `ServerFnResponse<T>` type
- Consistent error response structure with codes
- Role validation using `requireServerRole` helper

### Testing Patterns
- Test business logic directly rather than full integration
- Use proper TypeScript interfaces for mocks
- Cover edge cases (null/undefined roles, empty arrays)
- Validate error response structures

---

