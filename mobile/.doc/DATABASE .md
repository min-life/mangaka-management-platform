# DATABASE.md

Tài liệu này mô tả cấu trúc database PostgreSQL được sinh từ Prisma migration hiện tại, sau khi đã áp dụng migration cập nhật mới nhất.

> Mục tiêu: giúp AI / developer hiểu nhanh schema, enum, bảng, khóa chính, khóa ngoại, index và các điểm cần lưu ý khi viết query hoặc code backend.

---

## 1. Tổng quan hệ thống

Database phục vụ một hệ thống quản lý dự án / manuscript / file review với các nhóm chức năng chính:

- **Authentication & User Management**: `users`, `refresh_tokens`, `blacklist_tokens`
- **RBAC / Permission**: `roles`, `permissions`, `role_permissions`, `user_roles`
- **Project & Editorial Board**: `projects`, `editor_boards`, `user_editor_boards`, `user_projects`
- **Folder / File / Material**: `folders`, `files`, `file_materials`
- **Task & Comment Review**: `tasks`, `task_comment_frames`, `task_comments`
- **Application / Request Workflow**: `applications`
- **Statistics**: `project_stats`

Database dùng PostgreSQL với các kiểu dữ liệu đáng chú ý:

- `SERIAL` cho primary key dạng integer tự tăng
- `TEXT` cho text field
- `BOOLEAN` cho cờ trạng thái
- `TIMESTAMP(3)` cho ngày giờ
- `JSONB` cho dữ liệu linh hoạt như materials, content, metrics
- `DECIMAL(10,4)` cho tọa độ frame comment
- PostgreSQL `ENUM` cho trạng thái và scope

---

## 2. Enums

### `SCOPE`

Dùng để phân biệt phạm vi quyền / role.

```sql
CREATE TYPE "SCOPE" AS ENUM ('SYS', 'PRJ');
```

| Value | Ý nghĩa |
|---|---|
| `SYS` | Scope cấp hệ thống |
| `PRJ` | Scope cấp project |

---

### `PROGRESS_STATUS`

Dùng cho trạng thái của `tasks`.

```sql
CREATE TYPE "PROGRESS_STATUS" AS ENUM ('PENDING', 'INPROGRESS', 'REVIEW', 'DONE');
```

| Value | Ý nghĩa |
|---|---|
| `PENDING` | Task mới tạo / chưa bắt đầu |
| `INPROGRESS` | Đang thực hiện |
| `REVIEW` | Đang review |
| `DONE` | Hoàn thành |

---

### `APPLICATION_STATUS`

Dùng cho trạng thái của `applications`.

```sql
CREATE TYPE "APPLICATION_STATUS" AS ENUM ('PENDING', 'APPROVE', 'REJECT', 'CANCELLED');
```

| Value | Ý nghĩa |
|---|---|
| `PENDING` | Đang chờ xử lý |
| `APPROVE` | Đã duyệt |
| `REJECT` | Bị từ chối |
| `CANCELLED` | Đã hủy |

> Lưu ý migration: enum cũ có value sai chính tả là `CANCELD`. Migration mới đổi thành `CANCELLED`. Nếu trong database còn row đang dùng `CANCELD`, cần update data trước khi alter enum.

Ví dụ fix trước migration:

```sql
UPDATE "applications"
SET "status" = 'CANCELLED'
WHERE "status"::text = 'CANCELD';
```

---

### `APPLICATION_TYPE`

Dùng cho loại application / request.

```sql
CREATE TYPE "APPLICATION_TYPE" AS ENUM ('MANUSCRIPT_REVIEW', 'PUBLISH_REQUEST');
```

| Value | Ý nghĩa |
|---|---|
| `MANUSCRIPT_REVIEW` | Yêu cầu review manuscript |
| `PUBLISH_REQUEST` | Yêu cầu publish |

---

## 3. Quy ước chung

Nhiều bảng trong database dùng chung các field audit:

| Field | Type | Ý nghĩa |
|---|---:|---|
| `created_by` | `INTEGER` nullable | User tạo record |
| `updated_by` | `INTEGER` nullable | User cập nhật record gần nhất |
| `created_at` | `TIMESTAMP(3)` | Thời điểm tạo |
| `updated_at` | `TIMESTAMP(3)` | Thời điểm cập nhật |

Các field `created_by` / `updated_by` thường reference đến `users(id)` với `ON DELETE SET NULL`.

---

## 4. Tables

---

## 4.1 `users`

Lưu thông tin tài khoản người dùng.

### Columns

| Column | Type | Nullable | Default | Ghi chú |
|---|---:|---:|---|---|
| `id` | `SERIAL` | No | auto | Primary key |
| `display_name` | `TEXT` | Yes |  | Tên hiển thị |
| `avatar_url` | `TEXT` | Yes |  | Avatar |
| `email` | `TEXT` | No |  | Email đăng nhập, unique |
| `password` | `TEXT` | Yes |  | Password hash, nullable nếu dùng Google OAuth |
| `google_id` | `TEXT` | Yes |  | Google account id, unique |
| `is_active` | `BOOLEAN` | No | `false` | Trạng thái active |
| `email_verify_token` | `TEXT` | Yes |  | Token verify email, unique |
| `email_verify_expires_at` | `TIMESTAMP(3)` | Yes |  | Hạn token verify email |
| `password_reset_token` | `TEXT` | Yes |  | Token reset password, unique |
| `password_reset_expires_at` | `TIMESTAMP(3)` | Yes |  | Hạn token reset password |
| `created_by` | `INTEGER` | Yes |  | FK đến `users(id)` |
| `updated_by` | `INTEGER` | Yes |  | FK đến `users(id)` |
| `created_at` | `TIMESTAMP(3)` | No | `CURRENT_TIMESTAMP` |  |
| `updated_at` | `TIMESTAMP(3)` | No | `CURRENT_TIMESTAMP` |  |

### Constraints & Indexes

- Primary key: `users_pkey(id)`
- Unique:
  - `users_email_key(email)`
  - `users_google_id_key(google_id)`
  - `users_email_verify_token_key(email_verify_token)`
  - `users_password_reset_token_key(password_reset_token)`

### Relations

- Self-reference:
  - `created_by -> users(id)` `ON DELETE SET NULL`
  - `updated_by -> users(id)` `ON DELETE SET NULL`
- Một user có thể:
  - có nhiều system roles qua `user_roles`
  - tham gia nhiều projects qua `user_projects`
  - tham gia nhiều editor boards qua `user_editor_boards`
  - tạo / cập nhật nhiều records khác

---

## 4.2 `roles`

Lưu role trong hệ thống hoặc trong project.

### Columns

| Column | Type | Nullable | Default | Ghi chú |
|---|---:|---:|---|---|
| `id` | `SERIAL` | No | auto | Primary key |
| `code` | `TEXT` | No |  | Mã role, unique |
| `scope` | `SCOPE` | No | `SYS` | Scope role |
| `name` | `TEXT` | No |  | Tên role |
| `is_default` | `BOOLEAN` | No | `false` | Role mặc định |
| `created_by` | `INTEGER` | Yes |  | FK đến `users(id)` |
| `updated_by` | `INTEGER` | Yes |  | FK đến `users(id)` |
| `created_at` | `TIMESTAMP(3)` | No | `CURRENT_TIMESTAMP` |  |
| `updated_at` | `TIMESTAMP(3)` | No | `CURRENT_TIMESTAMP` |  |

### Constraints & Indexes

- Primary key: `roles_pkey(id)`
- Unique:
  - `roles_code_key(code)`

### Relations

- `created_by -> users(id)` `ON DELETE SET NULL`
- `updated_by -> users(id)` `ON DELETE SET NULL`
- Many-to-many với `users` qua `user_roles`
- Many-to-many với `permissions` qua `role_permissions`
- Được dùng trong `user_projects.role_id`

### Migration note

Field cũ:

```sql
"isDefault" BOOLEAN NOT NULL DEFAULT false
```

Field mới:

```sql
"is_default" BOOLEAN NOT NULL DEFAULT false
```

Migration hiện tại đang `DROP COLUMN "isDefault"` rồi `ADD COLUMN "is_default"`, nên dữ liệu cũ trong `isDefault` sẽ mất nếu không migrate thủ công trước.

Nếu cần giữ data:

```sql
ALTER TABLE "roles" ADD COLUMN "is_default" BOOLEAN NOT NULL DEFAULT false;
UPDATE "roles" SET "is_default" = "isDefault";
ALTER TABLE "roles" DROP COLUMN "isDefault";
```

---

## 4.3 `permissions`

Lưu danh sách quyền.

### Columns

| Column | Type | Nullable | Default | Ghi chú |
|---|---:|---:|---|---|
| `id` | `SERIAL` | No | auto | Primary key |
| `name` | `TEXT` | No |  | Tên quyền, unique |
| `scope` | `SCOPE` | No | `SYS` | Scope quyền |
| `description` | `TEXT` | Yes |  | Mô tả quyền |

### Constraints & Indexes

- Primary key: `permissions_pkey(id)`
- Unique:
  - `permissions_name_key(name)`

### Relations

- Many-to-many với `roles` qua `role_permissions`

---

## 4.4 `user_roles`

Bảng join user - role ở scope hệ thống.

### Columns

| Column | Type | Nullable | Default | Ghi chú |
|---|---:|---:|---|---|
| `user_id` | `INTEGER` | No |  | FK đến `users(id)` |
| `role_id` | `INTEGER` | No |  | FK đến `roles(id)` |

### Constraints & Indexes

- Composite primary key: `(user_id, role_id)`
- Index:
  - `user_roles_user_id_idx(user_id)`
  - `user_roles_role_id_idx(role_id)`

### Relations

- `user_id -> users(id)` `ON DELETE RESTRICT`
- `role_id -> roles(id)` `ON DELETE CASCADE`

---

## 4.5 `role_permissions`

Bảng join role - permission.

### Columns

| Column | Type | Nullable | Default | Ghi chú |
|---|---:|---:|---|---|
| `role_id` | `INTEGER` | No |  | FK đến `roles(id)` |
| `permission_id` | `INTEGER` | No |  | FK đến `permissions(id)` |

### Constraints & Indexes

- Composite primary key: `(role_id, permission_id)`
- Index:
  - `role_permissions_role_id_idx(role_id)`
  - `role_permissions_permission_id_idx(permission_id)`

### Relations

- `role_id -> roles(id)` `ON DELETE CASCADE`
- `permission_id -> permissions(id)` `ON DELETE CASCADE`

---

## 4.6 `editor_boards`

Lưu hội đồng biên tập.

### Columns

| Column | Type | Nullable | Default | Ghi chú |
|---|---:|---:|---|---|
| `id` | `SERIAL` | No | auto | Primary key |
| `name` | `TEXT` | No |  | Tên editor board |
| `created_by` | `INTEGER` | Yes |  | FK đến `users(id)` |
| `updated_by` | `INTEGER` | Yes |  | FK đến `users(id)` |
| `created_at` | `TIMESTAMP(3)` | No | `CURRENT_TIMESTAMP` |  |
| `updated_at` | `TIMESTAMP(3)` | No | `CURRENT_TIMESTAMP` |  |

### Relations

- `created_by -> users(id)` `ON DELETE SET NULL`
- `updated_by -> users(id)` `ON DELETE SET NULL`
- Một editor board có nhiều project qua `projects.editor_board_id`
- Many-to-many với users qua `user_editor_boards`

---

## 4.7 `user_editor_boards`

Bảng join user - editor board.

### Columns

| Column | Type | Nullable | Default | Ghi chú |
|---|---:|---:|---|---|
| `user_id` | `INTEGER` | No |  | FK đến `users(id)` |
| `editor_board_id` | `INTEGER` | No |  | FK đến `editor_boards(id)` |
| `is_lead` | `BOOLEAN` | No | `false` | User có phải lead của board không |

### Constraints & Indexes

- Composite primary key: `(user_id, editor_board_id)`
- Index:
  - `user_editor_boards_user_id_idx(user_id)`
  - `user_editor_boards_editor_board_id_idx(editor_board_id)`

### Relations

- `user_id -> users(id)` `ON DELETE RESTRICT`
- `editor_board_id -> editor_boards(id)` `ON DELETE CASCADE`

---

## 4.8 `projects`

Lưu project.

### Columns

| Column | Type | Nullable | Default | Ghi chú |
|---|---:|---:|---|---|
| `id` | `SERIAL` | No | auto | Primary key |
| `name` | `TEXT` | No |  | Tên project |
| `editor_board_id` | `INTEGER` | Yes |  | FK đến `editor_boards(id)` |
| `created_by` | `INTEGER` | Yes |  | FK đến `users(id)` |
| `updated_by` | `INTEGER` | Yes |  | FK đến `users(id)` |
| `created_at` | `TIMESTAMP(3)` | No | `CURRENT_TIMESTAMP` |  |
| `updated_at` | `TIMESTAMP(3)` | No | `CURRENT_TIMESTAMP` |  |

### Constraints & Indexes

- Primary key: `projects_pkey(id)`
- Index:
  - `projects_editor_board_id_idx(editor_board_id)`

### Relations

- `editor_board_id -> editor_boards(id)` `ON DELETE SET NULL`
- `created_by -> users(id)` `ON DELETE SET NULL`
- `updated_by -> users(id)` `ON DELETE SET NULL`
- Một project có nhiều:
  - folders
  - applications
  - project_stats
  - users qua `user_projects`

---

## 4.9 `user_projects`

Bảng join user - project - role.

### Columns

| Column | Type | Nullable | Default | Ghi chú |
|---|---:|---:|---|---|
| `user_id` | `INTEGER` | No |  | FK đến `users(id)` |
| `project_id` | `INTEGER` | No |  | FK đến `projects(id)` |
| `role_id` | `INTEGER` | No |  | FK đến `roles(id)` |
| `created_by` | `INTEGER` | Yes |  | Audit |
| `updated_by` | `INTEGER` | Yes |  | Audit |
| `created_at` | `TIMESTAMP(3)` | No | `CURRENT_TIMESTAMP` |  |
| `updated_at` | `TIMESTAMP(3)` | No | `CURRENT_TIMESTAMP` |  |

### Constraints & Indexes

- Composite primary key: `(user_id, project_id, role_id)`
- Index:
  - `user_projects_user_id_idx(user_id)`
  - `user_projects_project_id_idx(project_id)`
  - `user_projects_role_id_idx(role_id)`

### Relations

- `user_id -> users(id)` `ON DELETE CASCADE`
- `project_id -> projects(id)` `ON DELETE CASCADE`
- `role_id -> roles(id)` `ON DELETE CASCADE`

> Bảng này cho phép một user có nhiều role trong cùng một project vì PK gồm cả `role_id`.

---

## 4.10 `folders`

Lưu folder trong project. Hỗ trợ folder cha - con.

### Columns

| Column | Type | Nullable | Default | Ghi chú |
|---|---:|---:|---|---|
| `id` | `SERIAL` | No | auto | Primary key |
| `title` | `TEXT` | No |  | Tên folder |
| `description` | `TEXT` | Yes |  | Mô tả |
| `parent_id` | `INTEGER` | Yes |  | Folder cha |
| `project_id` | `INTEGER` | No |  | FK đến `projects(id)` |
| `created_by` | `INTEGER` | Yes |  | FK đến `users(id)` |
| `updated_by` | `INTEGER` | Yes |  | FK đến `users(id)` |
| `created_at` | `TIMESTAMP(3)` | No | `CURRENT_TIMESTAMP` |  |
| `updated_at` | `TIMESTAMP(3)` | No | `CURRENT_TIMESTAMP` |  |

### Constraints & Indexes

- Primary key: `folders_pkey(id)`
- Index:
  - `folders_project_id_idx(project_id)`
  - `folders_parent_id_idx(parent_id)`

### Relations

- `project_id -> projects(id)` `ON DELETE CASCADE`
- `parent_id -> folders(id)` `ON DELETE CASCADE`
- `created_by -> users(id)` `ON DELETE SET NULL`
- `updated_by -> users(id)` `ON DELETE SET NULL`
- Một folder có nhiều `files`

> Nếu folder cha bị xóa, folder con cũng bị xóa theo do `ON DELETE CASCADE`.

---

## 4.11 `files`

Lưu file metadata trong folder.

### Columns

| Column | Type | Nullable | Default | Ghi chú |
|---|---:|---:|---|---|
| `id` | `SERIAL` | No | auto | Primary key |
| `title` | `TEXT` | No |  | Tên file |
| `description` | `TEXT` | Yes |  | Mô tả |
| `folder_id` | `INTEGER` | No |  | FK đến `folders(id)` |
| `created_by` | `INTEGER` | Yes |  | FK đến `users(id)` |
| `updated_by` | `INTEGER` | Yes |  | FK đến `users(id)` |
| `created_at` | `TIMESTAMP(3)` | No | `CURRENT_TIMESTAMP` |  |
| `updated_at` | `TIMESTAMP(3)` | No | `CURRENT_TIMESTAMP` |  |

### Constraints & Indexes

- Primary key: `files_pkey(id)`
- Index:
  - `files_folder_id_idx(folder_id)`

### Relations

- `folder_id -> folders(id)` `ON DELETE CASCADE`
- `created_by -> users(id)` `ON DELETE SET NULL`
- `updated_by -> users(id)` `ON DELETE SET NULL`
- Một file có nhiều:
  - file materials
  - tasks

---

## 4.12 `file_materials`

Lưu materials gắn với file.

### Columns

| Column | Type | Nullable | Default | Ghi chú |
|---|---:|---:|---|---|
| `id` | `SERIAL` | No | auto | Primary key |
| `file_id` | `INTEGER` | No |  | FK đến `files(id)` |
| `materials` | `JSONB` | No |  | Dữ liệu material dạng JSON |
| `created_by` | `INTEGER` | Yes |  | FK đến `users(id)` |
| `updated_by` | `INTEGER` | Yes |  | FK đến `users(id)` |
| `created_at` | `TIMESTAMP(3)` | No | `CURRENT_TIMESTAMP` |  |
| `updated_at` | `TIMESTAMP(3)` | No | `CURRENT_TIMESTAMP` |  |

### Constraints & Indexes

- Primary key: `file_materials_pkey(id)`
- Index:
  - `file_materials_file_id_idx(file_id)`

### Relations

- `file_id -> files(id)` `ON DELETE CASCADE`
- `created_by -> users(id)` `ON DELETE SET NULL`
- `updated_by -> users(id)` `ON DELETE SET NULL`

---

## 4.13 `tasks`

Lưu task review / xử lý file. Hỗ trợ task cha - con.

### Columns

| Column | Type | Nullable | Default | Ghi chú |
|---|---:|---:|---|---|
| `id` | `SERIAL` | No | auto | Primary key |
| `title` | `TEXT` | No |  | Tên task |
| `description` | `TEXT` | Yes |  | Mô tả |
| `status` | `PROGRESS_STATUS` | No | `PENDING` | Trạng thái task |
| `parent_id` | `INTEGER` | Yes |  | Task cha |
| `file_id` | `INTEGER` | No |  | FK đến `files(id)` |
| `assigned_by` | `INTEGER` | Yes |  | User assign task |
| `created_by` | `INTEGER` | Yes |  | FK đến `users(id)` |
| `updated_by` | `INTEGER` | Yes |  | FK đến `users(id)` |
| `created_at` | `TIMESTAMP(3)` | No | `CURRENT_TIMESTAMP` |  |
| `updated_at` | `TIMESTAMP(3)` | No | `CURRENT_TIMESTAMP` |  |

### Constraints & Indexes

- Primary key: `tasks_pkey(id)`
- Index:
  - `tasks_file_id_idx(file_id)`
  - `tasks_parent_id_idx(parent_id)`
  - `tasks_assigned_by_idx(assigned_by)`

### Relations

- `parent_id -> tasks(id)` `ON DELETE CASCADE`
- `file_id -> files(id)` `ON DELETE CASCADE`
- `assigned_by -> users(id)` `ON DELETE SET NULL`
- `created_by -> users(id)` `ON DELETE SET NULL`
- `updated_by -> users(id)` `ON DELETE SET NULL`
- Một task có nhiều `task_comment_frames`

---

## 4.14 `task_comment_frames`

Lưu vùng frame comment trên task, ví dụ vùng highlight trên manuscript / file preview.

### Columns

| Column | Type | Nullable | Default | Ghi chú |
|---|---:|---:|---|---|
| `id` | `SERIAL` | No | auto | Primary key |
| `start_x` | `DECIMAL(10,4)` | No |  | Tọa độ X bắt đầu |
| `start_y` | `DECIMAL(10,4)` | No |  | Tọa độ Y bắt đầu |
| `end_x` | `DECIMAL(10,4)` | No |  | Tọa độ X kết thúc |
| `end_y` | `DECIMAL(10,4)` | No |  | Tọa độ Y kết thúc |
| `task_id` | `INTEGER` | No |  | FK đến `tasks(id)` |
| `created_by` | `INTEGER` | Yes |  | FK đến `users(id)` |
| `updated_by` | `INTEGER` | Yes |  | FK đến `users(id)` |
| `created_at` | `TIMESTAMP(3)` | No | `CURRENT_TIMESTAMP` |  |
| `updated_at` | `TIMESTAMP(3)` | No | `CURRENT_TIMESTAMP` |  |

### Constraints & Indexes

- Primary key: `task_comment_frames_pkey(id)`
- Index:
  - `task_comment_frames_task_id_idx(task_id)`

### Relations

- `task_id -> tasks(id)` `ON DELETE CASCADE`
- `created_by -> users(id)` `ON DELETE SET NULL`
- `updated_by -> users(id)` `ON DELETE SET NULL`
- Một frame có nhiều `task_comments`

---

## 4.15 `task_comments`

Lưu nội dung comment của task frame.

### Columns

| Column | Type | Nullable | Default | Ghi chú |
|---|---:|---:|---|---|
| `id` | `SERIAL` | No | auto | Primary key |
| `content` | `JSONB` | No |  | Nội dung comment dạng JSON |
| `frame_id` | `INTEGER` | No |  | FK đến `task_comment_frames(id)` |
| `created_by` | `INTEGER` | Yes |  | FK đến `users(id)` |
| `created_at` | `TIMESTAMP(3)` | No | `CURRENT_TIMESTAMP` |  |
| `updated_at` | `TIMESTAMP(3)` | No | `CURRENT_TIMESTAMP` |  |

### Constraints & Indexes

- Primary key: `task_comments_pkey(id)`
- Index:
  - `task_comments_frame_id_idx(frame_id)`

### Relations

- `frame_id -> task_comment_frames(id)` `ON DELETE CASCADE`
- `created_by -> users(id)` `ON DELETE SET NULL`

---

## 4.16 `applications`

Lưu application / request liên quan đến project.

### Columns

| Column | Type | Nullable | Default | Ghi chú |
|---|---:|---:|---|---|
| `id` | `SERIAL` | No | auto | Primary key |
| `project_id` | `INTEGER` | No |  | FK đến `projects(id)` |
| `title` | `TEXT` | No |  | Tiêu đề application |
| `description` | `TEXT` | Yes |  | Mô tả |
| `materials` | `JSONB` | No |  | Materials dạng JSON |
| `type` | `APPLICATION_TYPE` | No |  | Loại application |
| `status` | `APPLICATION_STATUS` | No | `PENDING` | Trạng thái application |
| `verify_by` | `INTEGER` | Yes |  | User verify application |
| `created_by` | `INTEGER` | Yes |  | User tạo |
| `updated_by` | `INTEGER` | Yes |  | User cập nhật |
| `created_at` | `TIMESTAMP(3)` | No | `CURRENT_TIMESTAMP` |  |
| `updated_at` | `TIMESTAMP(3)` | No | `CURRENT_TIMESTAMP` |  |

### Constraints & Indexes

- Primary key: `applications_pkey(id)`
- Index:
  - `applications_project_id_idx(project_id)`
  - `applications_verify_by_idx(verify_by)`

### Relations

- `project_id -> projects(id)` `ON DELETE CASCADE`
- `verify_by -> users(id)` `ON DELETE SET NULL`
- `created_by -> users(id)` `ON DELETE SET NULL`
- `updated_by -> users(id)` `ON DELETE SET NULL`

---

## 4.17 `project_stats`

Lưu thống kê của project.

### Columns

| Column | Type | Nullable | Default | Ghi chú |
|---|---:|---:|---|---|
| `id` | `SERIAL` | No | auto | Primary key |
| `project_id` | `INTEGER` | No |  | FK đến `projects(id)` |
| `metrics` | `JSONB` | No |  | Metrics dạng JSON |
| `updated_at` | `TIMESTAMP(3)` | No | `CURRENT_TIMESTAMP` | Lần cập nhật metrics |

### Constraints & Indexes

- Primary key: `project_stats_pkey(id)`
- Index:
  - `project_stats_project_id_idx(project_id)`

### Relations

- `project_id -> projects(id)` `ON DELETE CASCADE`

> Hiện tại `project_id` không unique, nghĩa là một project có thể có nhiều record stats. Nếu chỉ muốn 1 stats / project, cần thêm unique index cho `project_id`.

---

## 4.18 `refresh_tokens`

Lưu refresh token của user.

### Columns

| Column | Type | Nullable | Default | Ghi chú |
|---|---:|---:|---|---|
| `token` | `TEXT` | No |  | Primary key |
| `user_id` | `INTEGER` | No |  | FK đến `users(id)` |
| `expires_at` | `TIMESTAMP(3)` | No |  | Thời điểm hết hạn |

### Constraints & Indexes

- Primary key: `refresh_tokens_pkey(token)`
- Index:
  - `refresh_tokens_user_id_idx(user_id)`

### Relations

- `user_id -> users(id)` `ON DELETE CASCADE`

---

## 4.19 `blacklist_tokens`

Lưu token đã bị blacklist / revoke.

### Columns

| Column | Type | Nullable | Default | Ghi chú |
|---|---:|---:|---|---|
| `token` | `TEXT` | No |  | Primary key |
| `expires_at` | `TIMESTAMP(3)` | No |  | Thời điểm hết hạn blacklist |

### Constraints & Indexes

- Primary key: `blacklist_tokens_pkey(token)`

---

## 5. Relationship Map

```text
users
├── user_roles ───────────── roles
│                              └── role_permissions ─── permissions
│
├── user_projects ────────── projects
│              │              ├── folders ─── files ─── file_materials
│              │              │                  └── tasks ─── task_comment_frames ─── task_comments
│              │              ├── applications
│              │              └── project_stats
│              │
│              └──────────── roles
│
├── user_editor_boards ───── editor_boards ─── projects
│
├── refresh_tokens
│
└── audit relations created_by / updated_by across many tables
```

---

## 6. Delete Behavior Summary

| Parent | Child | Delete behavior |
|---|---|---|
| `users` | `users.created_by`, `users.updated_by` | `SET NULL` |
| `users` | most `created_by`, `updated_by`, `assigned_by`, `verify_by` | `SET NULL` |
| `users` | `user_roles.user_id` | `RESTRICT` |
| `users` | `user_projects.user_id` | `CASCADE` |
| `users` | `user_editor_boards.user_id` | `RESTRICT` |
| `users` | `refresh_tokens.user_id` | `CASCADE` |
| `roles` | `user_roles.role_id` | `CASCADE` |
| `roles` | `user_projects.role_id` | `CASCADE` |
| `roles` | `role_permissions.role_id` | `CASCADE` |
| `permissions` | `role_permissions.permission_id` | `CASCADE` |
| `editor_boards` | `projects.editor_board_id` | `SET NULL` |
| `editor_boards` | `user_editor_boards.editor_board_id` | `CASCADE` |
| `projects` | `folders.project_id` | `CASCADE` |
| `projects` | `applications.project_id` | `CASCADE` |
| `projects` | `project_stats.project_id` | `CASCADE` |
| `folders` | `folders.parent_id` | `CASCADE` |
| `folders` | `files.folder_id` | `CASCADE` |
| `files` | `file_materials.file_id` | `CASCADE` |
| `files` | `tasks.file_id` | `CASCADE` |
| `tasks` | `tasks.parent_id` | `CASCADE` |
| `tasks` | `task_comment_frames.task_id` | `CASCADE` |
| `task_comment_frames` | `task_comments.frame_id` | `CASCADE` |

---

## 7. Important Indexes

### Unique indexes

| Table | Index | Column |
|---|---|---|
| `users` | `users_email_key` | `email` |
| `users` | `users_google_id_key` | `google_id` |
| `users` | `users_email_verify_token_key` | `email_verify_token` |
| `users` | `users_password_reset_token_key` | `password_reset_token` |
| `roles` | `roles_code_key` | `code` |
| `permissions` | `permissions_name_key` | `name` |

### Foreign key indexes

Các bảng join và bảng con đã có index trên các FK chính:

- `user_roles(user_id)`, `user_roles(role_id)`
- `user_projects(user_id)`, `user_projects(project_id)`, `user_projects(role_id)`
- `projects(editor_board_id)`
- `role_permissions(role_id)`, `role_permissions(permission_id)`
- `user_editor_boards(user_id)`, `user_editor_boards(editor_board_id)`
- `folders(project_id)`, `folders(parent_id)`
- `files(folder_id)`
- `file_materials(file_id)`
- `tasks(file_id)`, `tasks(parent_id)`, `tasks(assigned_by)`
- `task_comment_frames(task_id)`
- `task_comments(frame_id)`
- `applications(project_id)`, `applications(verify_by)`
- `project_stats(project_id)`
- `refresh_tokens(user_id)`

---

## 8. AI Query Guidelines

Khi AI viết query / service logic dựa trên database này, cần chú ý:

### User role logic

- Role hệ thống: lấy qua `user_roles`
- Role trong project: lấy qua `user_projects`
- `roles.scope` có thể là:
  - `SYS`: role hệ thống
  - `PRJ`: role trong project

Ví dụ logic phân quyền:

```text
User có quyền nếu:
1. User có role SYS chứa permission cần kiểm tra
hoặc
2. User có role PRJ trong project hiện tại và role đó chứa permission cần kiểm tra
```

---

### Project ownership / membership

Muốn lấy danh sách project của user:

```sql
SELECT p.*
FROM "projects" p
JOIN "user_projects" up ON up."project_id" = p."id"
WHERE up."user_id" = $1;
```

Muốn lấy role của user trong project:

```sql
SELECT r.*
FROM "roles" r
JOIN "user_projects" up ON up."role_id" = r."id"
WHERE up."user_id" = $1
  AND up."project_id" = $2;
```

---

### Folder tree

`folders.parent_id` self-reference đến `folders.id`.

- Root folder: `parent_id IS NULL`
- Child folders: `parent_id = parent_folder_id`
- Xóa folder cha sẽ xóa toàn bộ folder con và file bên trong theo cascade chain.

---

### File materials

`file_materials.materials` là `JSONB`, nên schema cụ thể của JSON không được enforce ở DB level.

AI / backend nên kiểm tra shape JSON ở application layer, ví dụ bằng DTO / Zod / class-validator.

---

### Task tree

`tasks.parent_id` self-reference đến `tasks.id`.

- Task cha: `parent_id IS NULL`
- Subtask: `parent_id = parent_task_id`
- Xóa task cha sẽ xóa task con.

---

### Comment frame

`task_comment_frames` dùng tọa độ `DECIMAL(10,4)`:

- `start_x`, `start_y`
- `end_x`, `end_y`

Nên thống nhất hệ tọa độ ở frontend / backend, ví dụ:

```text
0.0000 -> 1.0000 nếu dùng normalized coordinate
hoặc pixel coordinate nếu dùng kích thước thực tế
```

Database hiện tại không enforce range tọa độ.

---

### Application workflow

`applications.status` có default `PENDING`.

Flow gợi ý:

```text
PENDING -> APPROVE
PENDING -> REJECT
PENDING -> CANCELLED
```

`verify_by` nullable, chỉ nên có giá trị khi application đã được verify / approve / reject.

---

## 9. Migration Notes

Migration mới nhất thực hiện 3 thay đổi chính:

### 9.1 Rename enum value

Từ:

```sql
'CANCELD'
```

Thành:

```sql
'CANCELLED'
```

Cần đảm bảo không còn row nào đang dùng `CANCELD` trước khi alter enum.

---

### 9.2 Add permission description

Bảng `permissions` được thêm column:

```sql
"description" TEXT
```

Column nullable nên không ảnh hưởng dữ liệu cũ.

---

### 9.3 Rename role default field

Bảng `roles` đổi field:

```sql
"isDefault"
```

thành:

```sql
"is_default"
```

Migration hiện tại drop column cũ và add column mới default `false`, nên có thể mất dữ liệu cũ.

Nếu muốn giữ dữ liệu, nên dùng migration an toàn:

```sql
ALTER TABLE "roles" ADD COLUMN "is_default" BOOLEAN NOT NULL DEFAULT false;
UPDATE "roles" SET "is_default" = "isDefault";
ALTER TABLE "roles" DROP COLUMN "isDefault";
```

---

## 10. Potential Improvements

Các cải thiện nên cân nhắc trong tương lai:

1. Thêm `updated_at` auto-update bằng Prisma `@updatedAt` hoặc trigger PostgreSQL.
2. Thêm unique constraint cho `project_stats.project_id` nếu mỗi project chỉ có một stats record.
3. Thêm index cho các JSONB column nếu query thường xuyên:
   - `file_materials.materials`
   - `applications.materials`
   - `task_comments.content`
   - `project_stats.metrics`
4. Thêm check constraint cho `task_comment_frames` nếu tọa độ phải nằm trong range cụ thể.
5. Chuẩn hóa enum naming:
   - `APPROVE` có thể đổi thành `APPROVED`
   - `REJECT` có thể đổi thành `REJECTED`
6. Cân nhắc thêm field assignee cho `tasks`, vì hiện tại chỉ có `assigned_by`, chưa thấy `assigned_to`.
7. Cân nhắc `ON DELETE CASCADE` với `user_roles.user_id`; hiện tại đang là `RESTRICT`, nên không thể xóa user nếu còn user role.

---

## 11. Final Schema Snapshot

Các thay đổi mới nhất đã được phản ánh trong tài liệu này:

- `APPLICATION_STATUS`: `PENDING | APPROVE | REJECT | CANCELLED`
- `roles.is_default`: boolean, default `false`
- `permissions.description`: nullable text
