# Repository layout

Multi-app monorepo with **no workspace tooling** (no turbo/nx/pnpm workspaces). Each app has its own `package.json`, `node_modules`, and lockfile — `cd` into the app directory before running any command.

- `api/` — NestJS 11 backend (Prisma 7 + PostgreSQL, Socket.io, JWT/Google auth).
- `web/` — Next.js 16 + React 19 + Tailwind v4 frontend (App Router).
- `mobile/` — Expo / React Native + gluestack-ui + NativeWind. Note: `mobile/AGENTS.md` and `mobile/CLAUDE.md` are stale/unrelated boilerplate (they describe a "skills repo") — ignore them.

READMEs are in Vietnamese; the commands below are the source of truth.
