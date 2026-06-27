# Tasks Module: API Contract and Backend Gaps

The current Tasks UI is an API-aware prototype. Values marked with `*` are centralized fallback data.

## Existing APIs That Can Be Used

- `GET /tasks/:taskId`: get a real task by ID.
- `PATCH /tasks/:taskId`: update title, description, status, parent ID, or `assignedBy`.
- `DELETE /tasks/:taskId`: delete a task.
- `GET /tasks/:taskId/children`: list subtasks.

## Existing APIs Blocked by Resource-ID Mismatch

- `GET /files/:fileId/tasks` and `POST /files/:fileId/tasks` declare `TASK`, but the route ID is a file ID.
- `GET /tasks/:taskId/frames` and `POST /tasks/:taskId/frames` declare `FRAME`, but the route ID is a task ID.
- `GET /tasks/:taskId/comments` declares `COMMENT`, but the route ID is a task ID.
- `GET /frames/:frameId/comments` and `POST /frames/:frameId/comments` declare `COMMENT`, but the route ID is a frame ID.

## Missing Listing and Workspace APIs

```http
GET /projects/:projectId/tasks
GET /tasks/me
GET /projects/:projectId/tasks/stats
GET /projects/:projectId/tasks/review-queue
```

Project task listing should support search, status, assignee, file, priority, due-date range, overdue flag, sorting, and pagination.

### Task-to-file workspace navigation

The intended frontend route is now:

```text
Task Workspace
-> click task
-> /projects/:projectId/files/:fileId?taskId=:taskId
-> File Detail focuses the task region and exposes role-specific actions
```

The project task-list response must always include `fileId`. Ideally it should also include the
primary frame/region so File Detail can focus the canvas without extra sequential calls.

## Missing Task Fields

- `assigneeId`: `assignedBy` is ambiguous and should remain the assigning user.
- `priority`.
- `dueDate`.
- `estimateMinutes`.
- `taskType`.
- `position` or `rank` for stable Kanban ordering.
- Optional production checklist.

## Missing Submission and Review Workflow

```http
POST /tasks/:taskId/submissions
GET  /tasks/:taskId/submissions
GET  /task-submissions/:submissionId
POST /task-submissions/:submissionId/approve
POST /task-submissions/:submissionId/reject
```

A submission needs asset/storage references, note, submitter, submitted time, status, reviewer, review note, and the resulting file-version ID after approval.

### Missing role-specific permissions

The current permission set does not distinguish submitting assigned work from reviewing it. The
frontend temporarily maps permissions as follows:

```text
project:task.create                         -> create a regional task
project:task.update without reviewer role  -> submit assigned work
project:owner / board:leader /
project:application.approve                -> approve or request changes
project:frame.create/update                 -> participate in regional discussion
```

Backend should add `project:task.submit` and `project:task.review`. It must also enforce that only
the assignee or an authorized lead may submit, submitters cannot approve their own work, and only
reviewers may approve or request changes. Read-only members may only view the file and task region.

Approval should run transactionally:

```text
snapshot current file
→ apply submitted asset
→ create next FileVersion
→ mark submission approved
→ mark task done
```

## Missing Task Context Endpoint

Task Detail currently requires task, file, frames, comments, assignee, activity, and latest submission. A compound endpoint avoids an N+1 request chain:

```http
GET /tasks/:taskId/context
```

Suggested response:

```text
task
file
frames
assignee
comments
submissions
activity
```

## Missing Activity and Notification APIs

```http
GET /tasks/:taskId/activity
GET /users/me/task-notifications
```

Events should cover assignment, status changes, comments, submissions, approvals, rejections, and version creation.

## Regional Annotation Contract

Frame coordinates should be normalized from `0` to `1`. Backend validation should reject values outside this range and invalid rectangles where end coordinates are not greater than start coordinates.

## Current Frontend Fallbacks

- Project task list and statistics.
- My Tasks, Review Queue, and Overdue scopes.
- Priority, due date, assignee display, and Kanban order.
- File preview and regional annotations.
- Discussion, activity, submission history, submit, approve, and reject actions.
- Create and reassign task workflows.
