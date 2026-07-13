# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Detailed, topic-specific rules live under [`.claude/rules/`](.claude/rules/) and are auto-discovered by Claude Code (no `@import` needed here):

- `repo-overview.md` — monorepo layout, per-app tooling.
- `commands.md` — install/dev/build/lint/test commands for `api/`, `web/`, `mobile/`.
- `env-vars.md` — required environment variables per app.
- `web-nextjs16.md`, `web-frontend-architecture.md` — scoped to `web/**`, covering the Next.js 16 caveat and frontend architecture (routing, service layer, realtime, UI).
- `api-backend-architecture.md`, `api-auth.md`, `api-realtime-events.md` — scoped to `api/**`, covering NestJS module structure/bootstrap/data layer, auth & RBAC, and the realtime gateway/event system.
