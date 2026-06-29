# AI Backend Guide 04 - Content, Review, Application And Stats Flow

## Content tree flow

The core content path is:

```text
Project
  -> Application
     -> Comment
     -> ApplicationVote
  -> Folder
     -> Child Folder
     -> File
        -> FileMaterial versions
        -> Comment
        -> Task
           -> Child Task
           -> TaskCommentFrame
              -> Comment
           -> Comment
```

## Folder flow

### Root project folders

Endpoint:

```text
GET /api/projects/:id/folders
POST /api/projects/:id/folders
```

Use this when working from project detail.

### Child folders

Endpoint:

```text
GET /api/folders/:id/children
POST /api/folders/:id/children
```

Backend behavior:

- Parent folder must exist.
- Child folder inherits `projectId` from parent folder.

### Folder files

Endpoint:

```text
GET /api/folders/:id/files
POST /api/folders/:id/files
```

Backend behavior:

- File belongs to folder.
- Folder belongs to project.
- Permission should logically be checked through the parent folder/project.

## File and material flow

### File detail/update/delete

```text
GET /api/files/:id
PATCH /api/files/:id
DELETE /api/files/:id
```

### Materials

```text
GET /api/files/:id/materials
GET /api/files/:id/versions
POST /api/files/:id/materials
GET /api/materials/:id
PATCH /api/materials/:id
DELETE /api/materials/:id
POST /api/materials/:id/restore
```

Important:

- `materials` is a JSON field.
- Backend does not enforce a strict JSON schema.
- `GET /api/files/:id/materials` returns the latest material by `createdAt desc`, not all materials.
- `GET /api/files/:id/versions` returns historical material versions for a file.
- `POST /api/materials/:id/restore` creates a new material row copied from the selected old version; it does not mutate the old row in place.

Possible material content for clients:

```json
{
  "layers": ["background", "characters"],
  "pages": [{ "index": 1, "url": "..." }],
  "editorState": {}
}
```

AI must preserve existing client-side material shape if one exists. Do not invent a new material schema unless explicitly asked.

## Task flow

### File tasks

```text
GET /api/files/:id/tasks
POST /api/files/:id/tasks
```

Task fields:

```text
title
description?
status = PENDING | INPROGRESS | REVIEW | DONE
deadline?
parentId?
fileId
assignedBy?
createdBy
updatedBy?
```

### My tasks

```text
GET /api/tasks?me=true
GET /api/projects/:id/tasks?me=true
```

Backend behavior:

- Hai endpoint này chỉ trả task khi query `me=true`.
- Nếu thiếu `me=true`, backend chủ động trả `data: []` với pagination rỗng.
- `GET /api/tasks?me=true` trả task assigned cho current user trên toàn hệ thống.
- `GET /api/projects/:id/tasks?me=true` trả task assigned cho current user trong một project cụ thể.
- Filter hỗ trợ `search`, `status`; sort hỗ trợ `field=title|createdAt`, `order=asc|desc`.
- Task có field `deadline` optional.
- Khi đổi status của child task từ `PENDING` sang trạng thái khác, backend yêu cầu parent task đã `DONE`; nếu chưa sẽ lỗi subtask dependency.

### Task detail/update/delete

```text
GET /api/tasks/:id
PATCH /api/tasks/:id
DELETE /api/tasks/:id
```

### Child tasks

```text
GET /api/tasks/:id/children
```

Use child tasks to represent smaller review or production subtasks under a parent task.

Child tasks hỗ trợ `search`, `status`, `field=title|createdAt`, `order`, `page`, `limit`.

## Frame and comment review flow

### Frames

```text
GET /api/tasks/:id/frames
POST /api/tasks/:id/frames
GET /api/frames/:id
PATCH /api/frames/:id
DELETE /api/frames/:id
```

Frame coordinates:

```text
startX
startY
endX
endY
```

These are decimal coordinates stored in `task_comment_frames`. They represent a selected region for review.

`GET /api/tasks/:id/frames` hỗ trợ pagination và sort `field=createdAt`, `order=asc|desc`.

### Universal comments

```text
GET /api/frames/:id/comments
POST /api/frames/:id/comments
GET /api/tasks/:id/comments
POST /api/tasks/:id/comments
GET /api/files/:id/comments
POST /api/files/:id/comments
GET /api/applications/:id/comments
POST /api/applications/:id/comments
```

Important:

- Comment `content` is JSON.
- Comment hiện dùng bảng `comments` chung, attach trực tiếp vào một trong các parent: file, task, frame hoặc application.
- `GET /api/frames/:id/comments` returns comments for one frame.
- `GET /api/tasks/:id/comments` returns comments attached directly to that task.
- `GET /api/frames/:id/comments` hỗ trợ sort `field=createdAt`, `order=asc|desc`.
- Task/file/application comment endpoints hỗ trợ pagination; sort chi tiết phụ thuộc service từng module.

Possible comment content:

```json
{
  "text": "Review this area",
  "mentions": [2],
  "attachments": []
}
```

AI should not assume comment content is plain string.

## Application flow

### Application types

```text
MANUSCRIPT_REVIEW
PUBLISH_REQUEST
```

### Application statuses

```text
PENDING
INTERNAL_APPROVED
SUBMITTED
APPROVE
REJECT
CANCELLED
```

### Project-side application flow

```text
GET /api/projects/:id/applications
POST /api/projects/:id/applications
```

Use project-side endpoints when the user is operating inside a project.

### Global application endpoints

```text
GET /api/applications
GET /api/applications/:id
PATCH /api/applications/:id
DELETE /api/applications/:id
PATCH /api/applications/:id/status
GET /api/applications/:id/comments
POST /api/applications/:id/comments
GET /api/applications/:id/votes
POST /api/applications/:id/votes
```

Important:

- `PATCH /api/applications/:id/status` changes status and writes `verifyBy=currentUserId`.
- Approve permission can come from `project:application.approve` or `board:leader`.
- `GET /api/applications` hỗ trợ `projectId`, `search`, `type`, `status`, `field=title|createdAt`, `order`, `page`, `limit`.
- `PATCH /api/applications/:id` cập nhật `title`, `description`, `materials`; không đổi `type` hay `status`.
- `PATCH /api/applications/:id/status` chỉ nhận `status`.
- Runtime hiện yêu cầu application ở `INTERNAL_APPROVED` hoặc đã `SUBMITTED` trước khi chuyển sang `SUBMITTED`.
- Application votes dùng enum `VOTE_DECISION = APPROVE | REJECT | ABSTAIN`; mỗi user vote bằng upsert trên application hiện tại.
- Application list là shallow response; detail mới có đủ `description` và `materials`.

### Board-side application queue

```text
GET /api/editor-boards/:id/applications
```

This only returns publish requests:

```text
type = PUBLISH_REQUEST
project.editorBoardId = board id
application.status in SUBMITTED | APPROVE | REJECT
```

Use this for board review/publish screens.

Board-side application queue chỉ hỗ trợ `search`, sort và pagination; không nhận `status`/`type` filter theo service hiện tại.

## Activity log and notification flow

### Notifications

```text
GET /api/notifications
```

Returns notifications for current user, sorted by `createdAt desc`. Notification rows include `activityLog`, and `activityLog.actor` chỉ select `id`, `displayName`, `email`, `avatarUrl`.

### Activity logs

`activity_logs` stores audit/event context such as action, entity type, entity id, actor and metadata. Client code should treat it as backend-owned event history unless a public endpoint is added.

## Project stats flow

### By project

```text
GET /api/projects/:id/stats
POST /api/projects/:id/stats
```

`POST /api/projects/:id/stats` behaves like application-level upsert:

1. Find first stat by `projectId`.
2. If found, update `metrics`.
3. If not found, create new stat.

### By stat id

```text
GET /api/project-stats/:id
PATCH /api/project-stats/:id
DELETE /api/project-stats/:id
```

Important:

- `metrics` is JSON.
- Schema has index on `projectId`, not unique constraint.
- If duplicates exist, project-level import updates the first found row only.
- `GET /api/projects/:id/stats` có thể trả `data: null` nếu project chưa có stat.

## AI rules for content/review work

- Always understand the parent chain before implementing permissions or navigation.
- Do not assume JSON fields have fixed schema: `materials`, `content`, and `metrics` are intentionally flexible.
- Do not use `GET /api/files/:id/materials` when you need historical material versions; it returns only latest material.
- Do not assume every comment belongs to a frame. Comments can attach directly to file, task, frame or application.
- Do not use old `TaskComment` mental model; the schema now uses universal `Comment`.
- Do not show board publish queue from project applications unless the screen is project-scoped.
- For "my tasks", always pass `me=true`; otherwise backend returns an intentionally empty list.
