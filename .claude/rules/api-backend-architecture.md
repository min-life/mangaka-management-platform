---
paths:
  - "api/**/*"
---

# Backend architecture (api/)

NestJS feature modules (`auth`, `users`, `roles`, `permissions`, `projects`, `editor-boards`, `applications`, `folders`, `files`, `materials`, `tasks`, `frames`, `notifications`, `activity-logs`, `realtime`, `project-stats`) all wired in `src/app.module.ts`. Each module follows the standard controller → service → Prisma pattern. Cross-cutting code lives in `src/share/` (decorators, events, constants, S3 service, helpers).

Bootstrap (`src/main.ts`): global prefix `/api`, Swagger UI at `/docs`, global `ValidationPipe` (`whitelist` + `forbidNonWhitelisted` + `transform`) so DTOs must declare every accepted field, cookie-parser, and CORS driven by `WEB_ORIGIN` (comma-separated, plus localhost/LAN dev origins auto-allowed). Server listens on `PORT` (default 3000).

### Data layer
Prisma 7 with the `@prisma/adapter-pg` driver adapter over `pg`. Schema and migrations in `api/prisma/`. Central `PrismaModule`/`PrismaService` injected into feature services. Postgres enums (`APPLICATION_STATUS`, `PROGRESS_STATUS`, `VOTE_DECISION`, `ACTIVITY_ACTION`, `ENTITY_TYPE`, `SCOPE`, `APPLICATION_TYPE`) are defined in `schema.prisma`.
