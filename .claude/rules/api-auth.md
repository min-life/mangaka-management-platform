---
paths:
  - "api/**/*"
---

# Auth & authorization (api/) — the important part

Two global guards registered as `APP_GUARD` in `app.module.ts`, applied to **every** route:
1. `GlobalAuthGuard` — enforces a valid JWT access token unless the handler is marked `@Public()`.
2. `PermissionGuard` — RBAC. Reads `@Permissions({ mode: 'ANY' | 'ALL', permissions: [...], resource })` metadata and checks against `UsersService.getUserPermissions(userId, resource, resourceId)`. `resourceId` comes from the `:id` route param. No `@Permissions` decorator = authenticated access only.

- Tokens: JWT access + refresh (`passport-jwt` strategies in `src/auth/strategies`). Refresh tokens persisted in the `RefreshToken` model; revoked tokens go in `BlacklistToken`. Google OAuth via `passport-google-oauth20`.
- Decorators (`src/share/decorators`): `@Public()`, `@Permissions(...)`, `@CurrentUser()` (returns the JWT payload), `@Cookie(name)`.
- Permission strings encode scope + resource + action, e.g. `project:application.approve`, `board:leader`, `board:owner`, `project:owner`. Seed data in `prisma/insert.sql`.
