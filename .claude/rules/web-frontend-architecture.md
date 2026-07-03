---
paths:
  - "web/**/*"
---

# Frontend architecture (web/)

Next.js App Router. Route groups: `app/(protected)/` (auth-gated, contains `studio/…` with editor-boards, projects, applications, members), plus top-level `auth/`, `login`, `register`, `admin`, `user-profile`. Feature code is **colocated** under its route folder — e.g. an applications route has `ApplicationsClient.tsx`, `ApplicationReviewDrawer.tsx`, a `services/` folder, and `*-ui.ts` constants next to `page.tsx`.

- **API access goes through the service layer** in `web/services/*.service.ts` (one per backend resource), which call the shared axios instance in `web/lib/api.ts`. Do not call `axios`/`fetch` directly from components.
- `lib/api.ts` internals: response interceptor unwraps to `response.data` (so services receive the body directly, not the full axios response); a request interceptor attaches the bearer token; a 401 response triggers a single-flight refresh against `/auth/refresh`, retries the request, and on failure clears the token and dispatches `AUTH_LOGOUT_EVENT`. Base URL from `NEXT_PUBLIC_API_URL` (default `http://localhost:3001/api`).
- Realtime client in `lib/realtime.ts`, consumed via hooks (`hooks/use-realtime-notifications.ts`, `use-realtime-activity.ts`). Permissions surfaced to UI via `hooks/use-permissions.ts`.
- UI: shadcn-style components in `components/ui/` (config in `components.json`), Radix / `@base-ui/react` primitives, `lucide-react` icons, `sonner` toasts, Recharts. i18n via `contexts/language-context.tsx`.
- Path alias `@/*` → `web/` root (both here and analogously in `api/` tsconfig).
