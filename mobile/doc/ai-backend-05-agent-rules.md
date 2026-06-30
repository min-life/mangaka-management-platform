# AI Backend Guide 05 - Agent Rules And Gotchas

Use this file before changing backend code, generating mobile API clients, or implementing UI behavior against the API.

## Non-negotiable route rules

- All API controller routes are under `/api`.
- Swagger UI is `/docs`.
- Protected endpoints need `Authorization: Bearer <accessToken>`.
- Auth login/refresh cookie path is `/api/auth`; `PATCH /api/users/me/password` currently sets a new refresh cookie without an explicit path.
- Many endpoints return empty body on success for delete/logout style operations.
- Auth workflow source of truth is `api/docs/workflow.md`.
- Backend coding rules source of truth is `api/docs/FOLLOW.md`.

## Response handling rules

Single item usually returns:

```json
{ "data": {} }
```

List usually returns:

```json
{
  "data": [],
  "pagination": {
    "total": 0,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
}
```

AI should not blindly parse every response as a list. Check endpoint intent.

Response parse rules from `api/docs/workflow.md` and current code:

| Endpoint | Parse rule |
| --- | --- |
| `POST /api/auth/register` | Treat `201` as success; do not require body. |
| `POST /api/auth/verify-email` | Treat `200` as success; do not require body. |
| `POST /api/auth/forgot` | Treat `200` as success even when email does not exist. |
| `POST /api/auth/reset` | Current code returns `{ data: { success: true } }`. |
| `POST /api/auth/login` | Read `{ accessToken }`; refresh token is cookie. |
| `POST /api/auth/refresh` | Read `{ accessToken }`; refresh token is rotated in cookie. |
| `POST /api/auth/logout` | Treat `204 No Content` as success. |
| `PATCH /api/users/me/password` | Read `{ data: { accessToken } }`; refresh token is rotated in cookie. |
| `GET /api/users/stats` | Read `{ data: { total, active, inactive } }`. |
| `POST /api/users/:id/force-reset-password` | Read `{ data: { newPassword } }`; treat returned password as a one-time secret. |

Because current auth controller does not set `@HttpCode(200)` on most POST handlers, runtime status may be Nest's default `201` even when `api/docs/workflow.md` says `200 OK`. Mobile/frontend should treat any `2xx` as success unless an endpoint explicitly needs `204`.

## PermissionGuard gotcha

Current `PermissionGuard` reads:

```text
request.params["id"]
```

and assumes that value is the id of the declared `resource`.

This is safe for endpoints like:

```text
GET /api/projects/:id        resource PROJECT
GET /api/files/:id           resource FILE
GET /api/tasks/:id           resource TASK
GET /api/frames/:id          resource FRAME
GET /api/applications/:id    resource APPLICATION
```

This is risky for nested endpoints where `:id` is a parent id but the declared resource is a child resource:

```text
GET  /api/folders/:id/files       resource FILE, but :id is folder id
POST /api/folders/:id/files       resource FILE, but :id is folder id
GET  /api/files/:id/materials     resource MATERIAL, but :id is file id
POST /api/files/:id/materials     resource MATERIAL, but :id is file id
GET  /api/files/:id/versions      resource MATERIAL, but :id is file id
GET  /api/files/:id/comments      resource COMMENT, but :id is file id
POST /api/files/:id/comments      resource COMMENT, but :id is file id
GET  /api/files/:id/tasks         resource TASK, but :id is file id
POST /api/files/:id/tasks         resource TASK, but :id is file id
GET  /api/projects/:id/tasks      resource TASK, but :id is project id
GET  /api/tasks/:id/frames        resource FRAME, but :id is task id
POST /api/tasks/:id/frames        resource FRAME, but :id is task id
GET  /api/tasks/:id/comments      resource COMMENT, but :id is task id
POST /api/tasks/:id/comments      resource COMMENT, but :id is task id
GET  /api/frames/:id/comments     resource COMMENT, but :id is frame id
POST /api/frames/:id/comments     resource COMMENT, but :id is frame id
GET  /api/applications/:id/comments  resource COMMENT, but :id is application id
POST /api/applications/:id/comments resource COMMENT, but :id is application id
```

Also risky:

```text
GET /api/applications
GET /api/tasks
```

`GET /api/applications` declares `resource: APPLICATION` but has no `:id`.

`GET /api/tasks` currently has no `@Permissions()` metadata, but is still protected by auth unless made public.

Also risky:

```text
GET    /api/project-stats/:id
PATCH  /api/project-stats/:id
DELETE /api/project-stats/:id
```

They declare `resource: PROJECT`, but `:id` is project stat id. The permission check may resolve `:id` as a project id even though service treats it as project stat id. This can allow/deny based on the wrong project if stat id and project id differ.

## How AI should fix or extend permission safely

If asked to fix permission guard or add nested endpoints, prefer one of these designs:

### Option A: Add param name to permission metadata

Example target shape:

```ts
@Permissions({
  mode: 'ANY',
  permissions: ['project:file.create'],
  resource: 'FOLDER',
  resourceIdParam: 'id',
})
```

Then the guard knows `:id` is folder id.

### Option B: Add parent resource metadata

Example target shape:

```ts
@Permissions({
  mode: 'ANY',
  permissions: ['project:file.create'],
  resource: 'FILE',
  parentResource: 'FOLDER',
  parentIdParam: 'id',
})
```

Then service can resolve permissions through parent.

### Option C: Use route-specific permission helpers

For complex cases, keep permission logic explicit in service/controller and do not force everything through one `resource + id` shape.

## Backend coding patterns to preserve

Follow existing patterns in `api/docs/FOLLOW.md`:

- Use `Logger`, not `console.log`.
- Use `ERROR` constants from `src/share/constants/message-error.ts`.
- Use service-level `handleError`.
- Use `ensure{Entity}` helpers before update/delete.
- Use transactions for multi-table changes.
- Use Prisma types for filters, orderBy, JSON and transaction clients.
- Use pagination helpers with default `page=1`, `limit=10`.
- Use DTO validation with `class-validator` and `class-transformer`.
- Export custom decorators from `src/share/decorators/index.ts`.
- Use `Resource`/permission types from `auth/interfaces/permission.interface.ts` instead of hard-coded ad hoc resource names.

## Data rules AI must not violate

- Do not assign `SYS` roles to project members.
- Do not assign `PRJ` roles as global user roles.
- Do not remove project owner through project member removal.
- Do not remove board owner through board member removal.
- Do not assume `materials`, `content`, or `metrics` are strings; they are JSON.
- Do not assume old `TaskComment` exists. Current schema uses universal `Comment` with optional `fileId`, `taskId`, `frameId`, `applicationId`.
- Do not assume task has no deadline; `deadline` is optional on `Task`.
- Do not assume there is exactly one `ProjectStat` at database level unless schema is changed to enforce uniqueness.
- Do not assume board lead is a role row. It is `UserEditorBoard.isLead`.
- Do not assume project owner is a role row. It is `Project.createdBy`.
- Do not assume board create/update is name-only; current DTO/service accepts `name`, `description?`, `imageUrl?`.
- Do not assume project update supports `description` or `imageUrl`; DTO currently accepts only `name` and `editorBoardId`.
- Do not assume `GET /api/projects/:id/stats` always returns an object; it returns `null` when no stat exists.
- Do not use `CANCELED`; current Prisma enum and DTO use `CANCELLED`.
- Do not use old application status set only. Current enum includes `PENDING`, `INTERNAL_APPROVED`, `SUBMITTED`, `APPROVE`, `REJECT`, `CANCELLED`.
- Do not show board publish queue items before submission; board queue filters `PUBLISH_REQUEST` and status in `SUBMITTED`, `APPROVE`, `REJECT`.
- Do not restore material by overwriting an old row. `POST /api/materials/:id/restore` creates a new material version copied from the selected one.

## Mobile/frontend integration rules

When building screens:

1. On app startup, restore access token if available.
2. If access token fails due to expiry, call `POST /api/auth/refresh`.
3. After login/refresh, call `GET /api/users/me`.
4. For system admin UI, call `GET /api/permissions/me/sys`.
5. For project detail UI, call `GET /api/permissions/me/projects/:id`.
6. For board detail UI, call `GET /api/permissions/me/boards/:id`.
7. Enable actions from permissions, not from display names or guessed roles.
8. Treat delete/logout success as possibly empty body.
9. For task inbox screens, call `GET /api/tasks?me=true`; without `me=true`, backend returns an empty list.
10. For project-scoped task inbox screens, call `GET /api/projects/:id/tasks?me=true`.
11. If a board leader screen needs project resource actions, also check board permissions because project permission endpoint does not return `board:leader`.
12. For file material history, call `GET /api/files/:id/versions`; latest-only endpoint is `GET /api/files/:id/materials`.
13. For application review, load comments and votes from `/api/applications/:id/comments` and `/api/applications/:id/votes`.
14. For notification screens, call `GET /api/notifications`.

## Testing guidance for AI

If changing backend behavior:

- Run `npm run build` inside `api` at minimum.
- Run targeted tests if they exist.
- Be aware current e2e test may be stale because it expects `GET /` while app uses global prefix `/api`.
- If fixing permissions, add tests for nested endpoints and collection endpoints.

## Quick decision tree

If asked "can user do X?":

```text
Is X global admin/user/role/permission management?
  -> Check SYS permissions.

Is X inside project?
  -> Check project membership.
  -> If creator, user has project:owner.
  -> Else check PRJ role permissions.

Is X inside folder/file/material/task/frame/comment/application?
  -> Resolve parent project.
  -> Apply project permission logic.

Is X inside editor board?
  -> Check board membership.
  -> If creator, board:owner.
  -> Else if isLead, board:leader.
  -> Else board:member.
```
