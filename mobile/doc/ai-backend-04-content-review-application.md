# AI Backend Guide 04 - Content, Review, Application And Stats Flow

## Content tree flow

The core content path is:

```text
Project
  -> Folder
     -> Child Folder
     -> File
        -> FileMaterial
        -> Task
           -> Child Task
           -> TaskCommentFrame
              -> TaskComment
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
POST /api/files/:id/materials
GET /api/materials/:id
PATCH /api/materials/:id
DELETE /api/materials/:id
```

Important:

- `materials` is a JSON field.
- Backend does not enforce a strict JSON schema.
- `GET /api/files/:id/materials` returns the latest material by `createdAt desc`, not all materials.

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
parentId?
fileId
assignedBy?
createdBy
updatedBy?
```

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

### Comments

```text
GET /api/frames/:id/comments
POST /api/frames/:id/comments
GET /api/tasks/:id/comments
```

Important:

- Comment `content` is JSON.
- `GET /api/frames/:id/comments` returns comments for one frame.
- `GET /api/tasks/:id/comments` first finds all frames under task, then returns comments for those frames.

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
```

Important:

- `PATCH /api/applications/:id/status` changes status and writes `verifyBy=currentUserId`.
- Approve permission can come from `project:application.approve` or `board:leader`.

### Board-side application queue

```text
GET /api/editor-boards/:id/applications
```

This only returns publish requests:

```text
type = PUBLISH_REQUEST
project.editorBoardId = board id
```

Use this for board review/publish screens.

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

## AI rules for content/review work

- Always understand the parent chain before implementing permissions or navigation.
- Do not assume JSON fields have fixed schema: `materials`, `content`, and `metrics` are intentionally flexible.
- Do not use `GET /api/files/:id/materials` when you need historical material versions; it returns only latest material.
- Do not create frame/comment UI assuming comments belong directly to task. Comments belong to frames; task comments are aggregated from task frames.
- Do not show board publish queue from project applications unless the screen is project-scoped.

