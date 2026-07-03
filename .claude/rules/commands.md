# Commands

### api/ (run from `api/`)
- Install: `npm ci` (falls back to `npm install --legacy-peer-deps` on peer-dep conflicts). `postinstall` runs `prisma generate`.
- Dev: `npm run start:dev` (watch mode). Prod build: `npm run build` then `npm run start:prod`.
- Prisma: `npx prisma generate`, `npx prisma migrate dev` (create/apply migration in dev).
- Lint: `npm run lint` (eslint --fix). Format: `npm run format`.
- Tests: `npm test` (Jest, `*.spec.ts` under `src/`). Single file: `npm test -- applications.service.spec`. Watch: `npm run test:watch`. Coverage: `npm run test:cov`. E2E: `npm run test:e2e`.

### web/ (run from `web/`)
- Install: `npm install`. Dev: `npm run dev`. Build: `npm run build`. Lint: `npm run lint`.

### mobile/ (run from `mobile/`)
- `npm run start` (Expo), `npm run android`, `npm run ios`.
