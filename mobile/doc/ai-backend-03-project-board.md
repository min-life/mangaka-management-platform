# AI Backend Guide 03 - Project And Editor Board Flow

## Project flow

### Create project

Endpoint: `POST /api/projects`

Flow:

1. User must be authenticated.
2. Backend optionally checks `editorBoardId` exists.
3. Backend finds default role with `scope=PRJ` and `isDefault=true`.
4. Backend creates `Project` with `createdBy=userId`.
5. Backend creates `UserProject` for creator using the default PRJ role.

Implication for AI:

- Creator is project owner because `Project.createdBy === userId`.
- Creator is also a project member because backend creates `UserProject`.
- If no default PRJ role exists, project creation fails.

### List projects

Endpoint: `GET /api/projects`

Default behavior:

- Returns projects created by current user OR projects where current user is a member.

With `me=true`:

- Returns only projects created by current user.

Common query:

```text
name
me
field=createdAt|updatedAt|name
order=asc|desc
page
limit
```

### Project detail/update/delete

| Endpoint | Required idea |
| --- | --- |
| `GET /api/projects/:id` | Need `project:owner` or `project:read`. |
| `PATCH /api/projects/:id` | Need `project:owner` or `project:update`. |
| `DELETE /api/projects/:id` | Need `project:owner` or `project:delete`. |

### Project members

| Endpoint | Meaning |
| --- | --- |
| `GET /api/projects/:id/members` | List members. |
| `POST /api/projects/:id/members` | Add users to project with one PRJ role. |
| `GET /api/projects/:id/members/:userId` | Get one member. |
| `PATCH /api/projects/:id/members/:userId` | Replace member role. |
| `DELETE /api/projects/:id/members/:userId` | Remove member, except owner. |

Important backend behavior:

- `roleId` must be a role with `scope=PRJ`.
- Add/update member deletes existing membership rows for that user/project, then creates a new row.
- Owner cannot be removed from project through remove member endpoint.

### Project editor board

| Endpoint | Meaning |
| --- | --- |
| `GET /api/projects/:id/editor-boards` | Get board attached to project. |
| `POST /api/projects/:id/editor-boards` | Set `editorBoardId` on project. |

Project can also be attached from board side with `POST /api/editor-boards/:id/projects`.

## Editor board flow

### Create board

Endpoint: `POST /api/editor-boards`

Flow:

1. User must be authenticated.
2. Backend creates `EditorBoard` with `createdBy=userId`.
3. Backend creates `UserEditorBoard` membership for creator.

Implication:

- Creator gets `board:owner` because `EditorBoard.createdBy === userId`.
- Creator is also a board member.

### List boards

Endpoint: `GET /api/editor-boards`

Default behavior:

- Returns boards created by current user OR boards where user is a board member.

With `me=true`:

- Returns boards created by current user.

### Board permissions

| Permission | Derived from |
| --- | --- |
| `board:owner` | `EditorBoard.createdBy === userId` |
| `board:leader` | `UserEditorBoard.isLead === true` |
| `board:member` | User is in `UserEditorBoard` and is not owner/lead |

### Board members

| Endpoint | Meaning |
| --- | --- |
| `POST /api/editor-boards/:id/members` | Owner adds users to board. |
| `GET /api/editor-boards/:id/members` | Owner/leader/member lists board members. |
| `GET /api/editor-boards/:id/members/:userId` | Owner/leader/member gets one board member. |
| `DELETE /api/editor-boards/:id/members/:userId` | Owner removes member, except owner. |
| `PATCH /api/editor-boards/:id/members/:userId/lead` | Owner sets one lead. |

Important backend behavior:

- Add members uses `skipDuplicates`.
- Removing board owner is blocked.
- Setting lead resets all board members to `isLead=false`, then sets selected user to `true`.
- The backend logic therefore supports one lead per board.

### Board projects

| Endpoint | Meaning |
| --- | --- |
| `GET /api/editor-boards/:id/projects` | List projects attached to board. |
| `POST /api/editor-boards/:id/projects` | Attach projects to board. |

Important backend behavior:

- Backend ensures all project IDs exist.
- Backend rejects projects already attached to a different board.
- Backend allows projects already attached to this same board.

### Board applications

Endpoint: `GET /api/editor-boards/:id/applications`

Returns only applications where:

```text
project.editorBoardId = board id
application.type = PUBLISH_REQUEST
```

This is the board-side review queue for publish requests.

## AI rules for project/board work

- Do not confuse project roles (`PRJ`) with board roles. Board owner/leader/member are derived from board membership, not from `Role`.
- Do not assign a `SYS` role to a project member.
- Do not assign a `PRJ` role as a global user role.
- Project owner is protected from removal.
- Board owner is protected from removal.
- If building UI, derive available actions from permission endpoints instead of hardcoding role labels.
- If showing board publish queue, use board applications endpoint, not all applications endpoint.

