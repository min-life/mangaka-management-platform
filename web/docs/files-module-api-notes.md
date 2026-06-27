# Files Module: API Contract and Backend Gaps

This document describes the API state used by the Files UI. The frontend does not modify backend behavior. UI fields marked with `*` are isolated fallback data.

## 0. Latest Web Wiring Status

The following direct APIs are now wired in web services because the route `:id` matches the guarded resource:

| Area | Web service | Connected API |
| --- | --- | --- |
| Project create/read/update/delete | `project.service.ts` | `POST /projects`, `GET /projects`, `GET/PATCH/DELETE /projects/:projectId` |
| Project metadata | `project.service.ts` | `description` and `imageUrl` are sent by `CreateProjectDialog`; dashboard uses `project.imageUrl` and `project.editorBoard.name` when returned. |
| Project folders | `project.service.ts` | `GET/POST /projects/:projectId/folders` |
| Folder direct actions | `project.service.ts` | `GET/PATCH/DELETE /folders/:folderId` |
| Folder children | `project.service.ts` | `GET/POST /folders/:folderId/children` |
| File direct actions | `file.service.ts` | `GET/PATCH/DELETE /files/:fileId` |
| Task direct actions | `task.service.ts` | `GET/PATCH/DELETE /tasks/:taskId` |
| Material direct actions | `material.service.ts` | `GET/PATCH/DELETE /materials/:materialId` |
| Frame direct actions | `frame.service.ts` | `GET/PATCH/DELETE /frames/:frameId` |

The following APIs are intentionally not wired into UI flows yet because the current guard uses the nested parent ID as if it were the child resource ID:

```text
GET/POST /folders/:folderId/files
GET/POST /files/:fileId/materials
GET/POST /files/:fileId/tasks
GET/POST /tasks/:taskId/frames
GET/POST /frames/:frameId/comments
```

These routes may exist in controllers/services, but they are not reliable until the backend guard/resource contract is corrected.

## 1. APIs Connected Successfully

| Workflow | Endpoint | Status | Notes |
| --- | --- | --- | --- |
| Create project | `POST /projects` | Connected | Sends `name`, optional `editorBoardId`, optional `description`, optional `imageUrl`. |
| List projects | `GET /projects` | Connected | Dashboard uses real `imageUrl` and embedded `editorBoard.name` when present. Production metrics still fallback. |
| Update project | `PATCH /projects/:projectId` | Connected | Backend currently supports `name` and `editorBoardId`; `description`/`imageUrl` are create-only until update DTO is extended. |
| List project folders | `GET /projects/:projectId/folders` | Connected | Returns folder metadata and `parentId`; enough to build the folder tree. |
| Create project folder | `POST /projects/:projectId/folders` | Connected | Supports root and nested folders through optional `parentId`. |
| Get folder detail | `GET /folders/:folderId` | Connected in service | Guard resource matches the route parameter. |
| Get folder children | `GET /folders/:folderId/children` | Connected in service | Useful when loading one branch on demand. UI currently builds from project folder response. |
| Create child folder | `POST /folders/:folderId/children` | Connected in service | Guard resource matches folder ID. |
| Update folder | `PATCH /folders/:folderId` | Connected in service | Not yet exposed in the current UI. |
| Delete folder | `DELETE /folders/:folderId` | Connected in service | Not yet exposed in the current UI. |
| Get file detail | `GET /files/:fileId` | Connected | Used when the UI has a real backend file ID. |
| Update file | `PATCH /files/:fileId` | Connected in service | Not yet exposed in the current UI. |
| Delete file | `DELETE /files/:fileId` | Connected in service | Not yet exposed in the current UI. |
| Get task detail | `GET /tasks/:taskId` | Connected in service | Guard resource matches the task ID. |
| Update task | `PATCH /tasks/:taskId` | Connected in service | Only usable after task listing returns real task IDs. |
| Delete task | `DELETE /tasks/:taskId` | Connected in service | Only usable after task listing returns real task IDs. |
| Get material detail | `GET /materials/:materialId` | Connected in service | Only usable after material listing returns a real material ID. |
| Update material | `PATCH /materials/:materialId` | Connected in service | Only usable after material listing returns a real material ID. |
| Delete material | `DELETE /materials/:materialId` | Connected in service | Only usable after material listing returns a real material ID. |
| Get frame detail | `GET /frames/:frameId` | Connected in service | Only usable after frame listing returns a real frame ID. |
| Update frame | `PATCH /frames/:frameId` | Connected in service | Only usable after frame listing returns a real frame ID. |
| Delete frame | `DELETE /frames/:frameId` | Connected in service | Only usable after frame listing returns a real frame ID. |
| Create review request | `POST /projects/:projectId/applications` | Connected | Related files are stored in the `materials` JSON payload. |

## 2. APIs That Exist but Are Blocked by Resource-ID Mismatch

`PermissionGuard` treats route parameter `:id` as the ID of the declared permission resource. The nested routes below declare the child resource even though `:id` belongs to the parent.

| Endpoint | Route parameter actually represents | Declared resource | Current failure |
| --- | --- | --- | --- |
| `GET /folders/:id/files` | Folder ID | `FILE` | Guard calls file permission lookup with a folder ID and may return `File is not exist`. |
| `POST /folders/:id/files` | Folder ID | `FILE` | Same mismatch; create-file UI cannot safely persist. |
| `GET /files/:id/materials` | File ID | `MATERIAL` | Guard searches for a material using a file ID. |
| `POST /files/:id/materials` | File ID | `MATERIAL` | Same mismatch; material creation is blocked. |
| `GET /files/:id/tasks` | File ID | `TASK` | Guard searches for a task using a file ID. |
| `POST /files/:id/tasks` | File ID | `TASK` | Same mismatch; task creation is blocked. |
| `GET /tasks/:id/frames` | Task ID | `FRAME` | Guard searches for a frame using a task ID. |
| `POST /tasks/:id/frames` | Task ID | `FRAME` | Same mismatch; frame creation is blocked. |
| `GET /tasks/:id/comments` | Task ID | `COMMENT` | Guard searches for a comment using a task ID. |
| `GET /frames/:id/comments` | Frame ID | `COMMENT` | Guard searches for a comment using a frame ID. |
| `POST /frames/:id/comments` | Frame ID | `COMMENT` | Same mismatch; frame comment creation is blocked. |

### Frontend behavior while blocked

- File list and create-file behavior use session-scoped fallback records.
- Materials, tasks, direct discussion, and activity use data from `file-ui.ts` marked with `*`.
- No fallback permission, database ID, or application status is presented as backend data.

## 3. APIs and Schema Still Missing

### 3.0 Arc and Chapter production structure

The current Files UI is designed around:

```text
Files
-> Arc Gallery
-> Chapter Gallery
-> Chapter File Explorer
-> File Detail Workspace
```

The backend does not currently have dedicated `Arc` or `Chapter` models. The frontend maps existing folders as follows:

```text
root project folder         -> Arc or production asset library
child folder under an arc   -> Chapter
folder under a chapter      -> Chapter file category/folder
```

For UX review, the frontend appends demo-only arcs and chapters when the API data is sparse. These records use negative IDs and are never sent back to the backend.

Recommended long-term backend options:

```text
Option A: Add Arc and Chapter models.
Option B: Keep Folder as the storage model but add folderType, coverUrl, subtitle, sortOrder, progress metadata.
```

Useful fields:

```text
type: ARC | CHAPTER | ASSET_LIBRARY | FILE_FOLDER
subtitle
coverUrl
sortOrder
progress
taskCount
reviewCount
fileCount
```

Project creation now supports `description` and `imageUrl`, and the web sends both. Project update currently only supports `name` and `editorBoardId`; add `description` and `imageUrl` to `UpdateProjectReqDto` if users should edit those fields later.

### 3.1 Real media upload and preview

Required capabilities:

- Upload binary media or request a presigned upload URL.
- Persist storage key and public/signed asset URL.
- Return thumbnail URL, MIME type, file size, width, height, and optional page count.
- Replace or archive the current media asset without overwriting historical versions.

Suggested endpoints:

```http
POST /files/:fileId/uploads
POST /files/:fileId/uploads/presign
GET  /files/:fileId/preview
GET  /files/:fileId/download
```

Suggested file fields or related asset model:

```text
storageKey
assetUrl
thumbnailUrl
mimeType
sizeBytes
width
height
```

### 3.2 File version history

There is currently no `FileVersion` model or version API. The displayed version history is UI fallback.

Required model data:

```text
id
fileId
version
title
description
materials/storageKey snapshot
changeNote
sourceTaskId
createdBy
createdAt
```

Suggested endpoints:

```http
GET  /files/:fileId/versions
GET  /file-versions/:versionId
POST /files/:fileId/versions/:versionId/restore
```

Backend should create versions inside the task-submission approval transaction:

```text
approve submission
-> snapshot current file
-> apply submitted asset
-> increment current version
-> complete task
```

### 3.3 Task submission and approval

The current `Task` model supports status and hierarchy but has no submission payload or approval history.

Suggested capabilities:

```http
POST /tasks/:taskId/submissions
GET  /tasks/:taskId/submissions
POST /task-submissions/:submissionId/approve
POST /task-submissions/:submissionId/reject
```

Submission data should include asset/storage references, note, submitter, submitted time, reviewer, and review note.

The File Detail UI hosts this workflow when opened with `?taskId=:taskId`. Backend still needs
explicit `project:task.submit` and `project:task.review` permissions plus assignment checks. Hiding
buttons based on frontend permissions is not a security boundary.

Current frontend-only review behavior:

```text
Current                       -> official file preview
Submission #n                 -> unapproved task result preview
Frame comment on submission   -> normalized UI-only annotation
Request Changes               -> keeps Current unchanged
Approve                       -> promotes the submission preview to Current in local state
```

Uploaded image previews use temporary browser object URLs and do not survive a browser session.
Persistence requires the media upload, submission, frame-comment, and version APIs described here.

### 3.3.1 Regional task annotation contract

The intended manga workflow creates a task for a selected canvas region:

```text
enter annotation mode
-> drag a rectangle on the file preview
-> create Task for an assistant
-> create TaskCommentFrame with normalized coordinates
-> discuss work through frame comments
```

The frontend currently stores this flow as fallback. Backend persistence should use:

Task regions are optional. The frontend supports both scopes:

```text
Whole File       -> no TaskCommentFrame is required
Selected Region  -> creates a task with normalized region coordinates
```

Discussion context changes with workspace selection:

```text
no selected task    -> File Discussion
selected task       -> Task Discussion keyed by taskId
selected submission -> Submission Review keyed by taskId + submissionId
```

```http
POST /files/:fileId/tasks
POST /tasks/:taskId/frames
POST /frames/:frameId/comments
```

Coordinates must be normalized from `0` to `1`, not stored as display pixels:

```json
{
  "startX": 0.24,
  "startY": 0.18,
  "endX": 0.52,
  "endY": 0.62
}
```

This keeps annotations aligned when the preview is resized. The task response should ideally include its frames so the frontend can render all markers without issuing one request per task.

The current `Task.assignedBy` field is semantically ambiguous. If it means the user performing the task, it should be renamed to `assigneeId`. If it means the user assigning work, a separate `assigneeId` field is required.

### 3.4 File-level discussion

Current comments belong to `TaskCommentFrame`; there is no direct file discussion API. The current Discussion panel is fallback.

Possible API:

```http
GET  /files/:fileId/comments
POST /files/:fileId/comments
PATCH /file-comments/:commentId
DELETE /file-comments/:commentId
```

Alternatively, the product may explicitly require every comment to belong to a task frame. In that case the frontend needs an API returning frame comments grouped for the selected file.

### 3.5 File activity timeline

There is no audit/event model covering file updates, task status changes, reviews, materials, and version creation. The Activity panel is fallback.

Suggested endpoint:

```http
GET /files/:fileId/activity
```

Suggested event fields:

```text
eventType
actorId
fileId
taskId
versionId
metadata
createdAt
```

### 3.6 File assignment and production metadata

The following UI values are not represented by the current `File` model:

- File production status.
- Current version number.
- Assigned artist/editor.
- Due date.
- File category/type such as Storyboard, Line Art, or Lettering.
- Review request count/status as a structured relation.

These values are currently marked `*`. They may be added to `File`, represented through a separate `FileProductionState`, or derived from tasks/applications after contracts are defined.

### 3.7 Structured Application-to-File relation

Applications now use uploaded-file metadata in `materials` instead of selecting files from the Files module. This matches the product decision that a review/publish request uploads a manuscript or package from the user's machine.

Current frontend payload:

```json
{
  "materials": {
    "uploadSource": "LOCAL_MACHINE_METADATA_ONLY",
    "uploadedFiles": [
      {
        "name": "chapter-01-final.pdf",
        "mimeType": "application/pdf",
        "sizeBytes": 1842200,
        "lastModified": 1782400000000
      }
    ]
  }
}
```

This does not persist the binary file. Backend still needs a real upload contract:

```http
POST /uploads
POST /projects/:projectId/applications/uploads
POST /projects/:projectId/applications/uploads/presign
```

Expected upload response:

```json
{
  "name": "chapter-01-final.pdf",
  "storageKey": "applications/1/chapter-01-final.pdf",
  "url": "https://...",
  "mimeType": "application/pdf",
  "sizeBytes": 1842200
}
```

Long term, `materials.uploadedFiles` should store upload metadata returned by backend storage, not local browser-only metadata.

Older related-file behavior stored selected project files inside unvalidated `materials` JSON. That flow is deprecated for Applications because uploaded manuscript packages should come from the user's machine.

Long-term options:

- Add an `ApplicationUpload` model.
- Validate a stable `materials.uploadedFiles` JSON contract.
- Return uploaded file metadata directly in Application responses.

### 3.7.1 Application review UI gaps

The current drawer UI shows:

```text
Type
Submitted By
Submitted At
Reviewed By
Description
Uploaded Files
Rejection Reason
Activity
```

Current schema/API can support only part of that:

| UI field | Current source | Gap |
| --- | --- | --- |
| Type | `Application.type` | OK |
| Status | `Application.status` | OK |
| Submitted By | `createdByUser` or `createdBy` | OK if response includes `createdByUser`; otherwise UI falls back to user id. |
| Submitted At | `createdAt` | OK |
| Reviewed By | `verifiedByUser` or `verifyBy` | OK if response includes `verifiedByUser`; otherwise UI falls back to user id. |
| Reviewed At | `updatedAt` | Not precise. Add `verifiedAt` to avoid confusing edit time with review time. |
| Uploaded Files | `materials.uploadedFiles` metadata | No binary persistence until upload API exists. |
| Rejection Reason | UI mock only | Add `reviewNote`, `rejectionReason`, or `ApplicationReviewLog.note`. |
| Activity | Derived from `createdAt/status/updatedAt` | Add `ApplicationReviewLog` for real activity history. |

Recommended minimum additions:

```text
verifiedAt DateTime?
reviewNote String?
```

Recommended production additions:

```prisma
model ApplicationReviewLog {
  id            Int      @id @default(autoincrement())
  applicationId Int      @map("application_id")
  action        String
  note          String?
  createdBy     Int?     @map("created_by")
  createdAt     DateTime @default(now()) @map("created_at")
}
```

Suggested review endpoint shape:

```http
PATCH /applications/:applicationId/status
```

```json
{
  "status": "REJECT",
  "reviewNote": "Please reduce dialogue density before resubmitting."
}
```

### 3.8 User display data

File/task responses commonly return creator or assignee IDs but not complete display information. The UI needs either embedded summaries or batched user lookup.

Project members are currently usable in the frontend because `ProjectsService.getProjectMembers`
returns a flattened shape:

```json
{
  "id": 12,
  "displayName": "Sarah Jenkins",
  "email": "sarah@example.com",
  "role": { "id": 2, "name": "Assistant" },
  "createdAt": "2026-06-20T00:00:00.000Z"
}
```

However, `ProjectMemberResDto` documents a nested `{ user, role }` shape. Swagger DTO and service
runtime shape should be aligned so frontend types do not drift from generated API docs.

Recommended response shape:

```json
{
  "id": 12,
  "displayName": "Sarah Jenkins",
  "avatarUrl": "..."
}
```

## 4. Current Frontend Fallback Inventory

Fallbacks are centralized in `app/(protected)/studio/projects/[projectId]/files/file-ui.ts`:

- Demo Arc/Chapter records when project folders are sparse.
- Arc/chapter cover URLs, subtitles, progress, and counts.
- File list metadata when folder file listing is blocked.
- Preview image URLs.
- File type and production status.
- Version number and version history.
- Assigned user and due date.
- Review request count/status.
- Materials/reference assets.
- Linked tasks and task creation.
- File discussion.
- Activity timeline.

Every fallback value is marked with `*` in the UI and should be replaced as the corresponding backend contract becomes available.
