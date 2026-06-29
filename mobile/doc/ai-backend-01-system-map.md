# AI Backend Guide 01 - System Map

## Vai trò hệ thống

Backend trong `api/` là API NestJS cho Mangaka Management Platform. Nó quản lý người dùng, role/permission, project manga, editor board, cây nội dung, task review, comment chung theo resource, đơn duyệt/vote, activity log, notification và stats.

## Stack

| Thành phần | Hiện trạng |
| --- | --- |
| Framework | NestJS 11 |
| ORM | Prisma 7 |
| Database | PostgreSQL |
| Auth | Passport JWT, Passport Google OAuth2 |
| Password | bcrypt |
| Email | Nodemailer |
| Validation | Global `ValidationPipe` với whitelist, forbid non-whitelisted, transform |
| Docs | Swagger tại `/docs` |
| API prefix | `/api` |
| CORS | `origin = WEB_ORIGIN` hoặc `http://localhost:3001`, `credentials=true` |
| Deploy config | `vercel.json` dùng `@vercel/node` |

## Module backend chính

| Module | AI cần hiểu |
| --- | --- |
| `auth` | Register, verify email, login, refresh, logout, forgot/reset password, Google OAuth. |
| `users` | Profile, đổi password, tạo staff user, gán role hệ thống, user stats, force reset password, link Google account. |
| `roles` | CRUD role `SYS`/`PRJ`, default role, replace permissions. |
| `permissions` | List/update permissions và trả quyền hiện tại của user. |
| `projects` | CRUD project, members, editor board, folders, applications, stats. |
| `editor-boards` | CRUD board, members, lead, projects, publish requests. |
| `folders` | Folder detail/update/delete, children, files. |
| `files` | File detail/update/delete, latest material, material versions, file comments, tasks. |
| `materials` | CRUD JSON material của file, restore version cũ. |
| `tasks` | CRUD task, child tasks, frames, direct task comments. |
| `frames` | CRUD frame tọa độ và frame comments. |
| `applications` | Application detail/list/update/delete/status, comments, votes. |
| `project-stats` | Metrics JSON theo project stat id. |
| `notifications` | Current user's notifications. |
| `activity-logs` | Audit/activity records dùng làm nguồn cho notification. |

## App/runtime entrypoints

| Endpoint | Ghi chú |
| --- | --- |
| `GET /api/` | Health check public, trả text từ `AppService`. |
| `GET /docs` | Swagger UI. |

## Auth endpoint outputs theo `api/docs/workflow.md`

| Endpoint | Success response |
| --- | --- |
| `POST /api/auth/register` | `201 Created`, không có body trả về. |
| `POST /api/auth/verify-email` | `200 OK`, thường không có body. |
| `POST /api/auth/forgot` | `200 OK`, thường không có body và luôn thành công để tránh dò email. |
| `POST /api/auth/reset` | `200 OK`, hiện trả `{ data: { success: true } }`. |
| `POST /api/auth/login` | `{ accessToken }` và set cookie `refreshToken`. |
| `POST /api/auth/refresh` | `{ accessToken }` và set cookie `refreshToken` mới. |
| `POST /api/auth/logout` | `204 No Content`. |

Note: `api/docs/workflow.md` ghi một số auth POST là `200 OK`, nhưng controller hiện chưa đặt `@HttpCode(200)` cho các endpoint đó. Client nên xem mọi `2xx` là success, riêng logout kỳ vọng `204`.

## Entity map

```text
User
  -> UserRole -> Role(SYS) -> RolePermission -> Permission(SYS)
  -> UserProject -> Project + Role(PRJ)
  -> UserEditorBoard -> EditorBoard

Project
  -> EditorBoard?
  -> UserProject[]
  -> Folder[]
  -> Application[]
  -> ProjectStat[]

Folder
  -> parent Folder?
  -> children Folder[]
  -> File[]

File
  -> FileMaterial[]
  -> Comment[]
  -> Task[]

Task
  -> parent Task?
  -> children Task[]
  -> TaskCommentFrame[]
  -> Comment[]

TaskCommentFrame
  -> Comment[]

Application
  -> Comment[]
  -> ApplicationVote[]

ActivityLog
  -> Notification[]
```

## Enum quan trọng

| Enum | Values |
| --- | --- |
| `SCOPE` | `SYS`, `PRJ` |
| `PROGRESS_STATUS` | `PENDING`, `INPROGRESS`, `REVIEW`, `DONE` |
| `APPLICATION_TYPE` | `MANUSCRIPT_REVIEW`, `PUBLISH_REQUEST` |
| `APPLICATION_STATUS` | `PENDING`, `INTERNAL_APPROVED`, `SUBMITTED`, `APPROVE`, `REJECT`, `CANCELLED` |
| `VOTE_DECISION` | `APPROVE`, `REJECT`, `ABSTAIN` |
| `ACTIVITY_ACTION` | `MEMBER_INVITED`, `MEMBER_REMOVED`, `ROLE_CHANGED`, `TASK_CREATED`, `TASK_ASSIGNED`, `TASK_UPDATED`, `TASK_COMPLETED`, `TASK_DELETED`, `FOLDER_CREATED`, `FOLDER_MOVED`, `FOLDER_DELETED`, `FILE_CREATED`, `FILE_DELETED`, `MATERIAL_UPLOADED`, `MATERIAL_RESTORED`, `APPLICATION_CREATED`, `APPLICATION_INTERNAL_APPROVED`, `APPLICATION_SUBMITTED`, `APPLICATION_APPROVED`, `APPLICATION_REJECTED`, `COMMENT_CREATED`, `COMMENT_DELETED` |
| `ENTITY_TYPE` | `PROJECT`, `EDITOR_BOARD`, `FOLDER`, `FILE`, `MATERIAL`, `TASK`, `FRAME`, `COMMENT`, `APPLICATION` |

## Response conventions

Single resource:

```json
{
  "data": {}
}
```

List resource:

```json
{
  "data": [],
  "pagination": {
    "total": 25,
    "page": 1,
    "limit": 10,
    "totalPages": 3
  }
}
```

Một số delete/logout endpoint trả empty body hoặc 204. Khi viết mobile/frontend, không giả định mọi response đều có JSON body.

## Query conventions

Nhiều list endpoint hỗ trợ các query sau:

| Query | Ý nghĩa |
| --- | --- |
| `search` hoặc `name` | Tìm theo tên/title/email/displayName tùy endpoint. |
| `field` | Trường sort, ví dụ `createdAt`, `updatedAt`, `name`, `title`. |
| `order` | `asc` hoặc `desc`. |
| `page` | Trang, tối thiểu 1. |
| `limit` | Số item/trang, tối thiểu 1. |
| `status` | Filter task/application status. |
| `type` | Filter application type. |

Endpoint-specific query hiện có:

| Endpoint | Query đáng chú ý |
| --- | --- |
| `GET /api/users` | `search`, `isActive`, `field=createdAt|displayName|email`, `order`, `page`, `limit`. |
| `GET /api/users/stats` | Admin-only summary `{ total, active, inactive }`. |
| `POST /api/users/:id/force-reset-password` | Admin-only force reset, trả `{ newPassword }` một lần. |
| `GET /api/roles` | `scope=SYS|PRJ`. |
| `GET /api/permissions` | `scope`, `name`, `sortBy=id|name|scope`, `order`. |
| `GET /api/tasks` | Chỉ trả task khi `me=true`; nếu thiếu hoặc khác `true` trả list rỗng. |
| `GET /api/projects/:id/tasks` | Chỉ trả task của current user trong project khi `me=true`; nếu thiếu hoặc khác `true` trả list rỗng. |
| `GET /api/projects/:id/folders` | Có `parentId` để lọc folder con trong cùng project. |
| `GET /api/files/:id/versions` | Trả các version material của file. |
| `GET /api/notifications` | Trả notification của current user. |

## Rule of thumb cho AI

Nếu cần hiểu một object đang thuộc project nào, truy ngược theo chuỗi:

```text
Frame -> Task -> File -> Folder -> Project
Task -> File -> Folder -> Project
Material -> File -> Folder -> Project
File -> Folder -> Project
Folder -> Project
Application -> Project
Comment -> one of File/Task/Frame/Application -> Project
ApplicationVote -> Application -> Project
```
