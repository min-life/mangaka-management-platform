# AI Backend Guide 01 - System Map

## Vai trò hệ thống

Backend trong `api/` là API NestJS cho Mangaka Management Platform. Nó quản lý người dùng, role/permission, project manga, editor board, cây nội dung, task review, comment theo vùng, đơn duyệt và stats.

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
| Deploy config | `vercel.json` dùng `@vercel/node` |

## Module backend chính

| Module | AI cần hiểu |
| --- | --- |
| `auth` | Register, verify email, login, refresh, logout, forgot/reset password, Google OAuth. |
| `users` | Profile, đổi password, tạo staff user, gán role hệ thống, link Google account. |
| `roles` | CRUD role `SYS`/`PRJ`, default role, replace permissions. |
| `permissions` | List/update permissions và trả quyền hiện tại của user. |
| `projects` | CRUD project, members, editor board, folders, applications, stats. |
| `editor-boards` | CRUD board, members, lead, projects, publish requests. |
| `folders` | Folder detail/update/delete, children, files. |
| `files` | File detail/update/delete, materials, tasks. |
| `materials` | CRUD JSON material của file. |
| `tasks` | CRUD task, child tasks, frames, aggregate comments. |
| `frames` | CRUD frame tọa độ và comments trong frame. |
| `applications` | Application detail/list/update/delete/status. |
| `project-stats` | Metrics JSON theo project stat id. |

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
  -> Task[]

Task
  -> parent Task?
  -> children Task[]
  -> TaskCommentFrame[]

TaskCommentFrame
  -> TaskComment[]
```

## Enum quan trọng

| Enum | Values |
| --- | --- |
| `SCOPE` | `SYS`, `PRJ` |
| `PROGRESS_STATUS` | `PENDING`, `INPROGRESS`, `REVIEW`, `DONE` |
| `APPLICATION_TYPE` | `MANUSCRIPT_REVIEW`, `PUBLISH_REQUEST` |
| `APPLICATION_STATUS` | `PENDING`, `APPROVE`, `REJECT`, `CANCELLED` |

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

## Rule of thumb cho AI

Nếu cần hiểu một object đang thuộc project nào, truy ngược theo chuỗi:

```text
Comment -> Frame -> Task -> File -> Folder -> Project
Frame -> Task -> File -> Folder -> Project
Task -> File -> Folder -> Project
Material -> File -> Folder -> Project
File -> Folder -> Project
Folder -> Project
Application -> Project
```

