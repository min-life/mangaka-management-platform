---
paths:
  - "api/**/*"
---

# Realtime & events (api/)

### Realtime (`src/realtime/realtime.gateway.ts`)
Single Socket.io gateway, namespace `/realtime`. Authenticates the JWT from the handshake `auth.token` and checks the blacklist on connect. Rooms: `user_<id>` (personal/notifications), `project_<id>`, `board_<id>`, and `<entityType>_comments_<id>`. Other services push events by calling gateway helpers: `notifyUser`, `broadcastActivity`, `broadcastComment` (`comment:new|updated|deleted`, `notification:new`, `activity:new`).

### Events
Activity logging is event-driven via `@nestjs/event-emitter`: emit `ActivityEventPayload` on `system.activity.created` (`src/share/events/activity.event.ts`) rather than writing logs inline.
