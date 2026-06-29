# AI Backend Guide 02 - Auth And Permission Flow

## Auth flow

### Register and email verify

1. Client gọi `POST /api/auth/register`.
2. Backend lowercase email, hash password, tạo user `isActive=false`.
3. Backend lấy default role scope `SYS` và tạo `UserRole`.
4. Backend tạo `emailVerifyToken`, `emailVerifyExpiresAt` và gửi verify email.
5. Client gửi token đến `POST /api/auth/verify-email`.
6. Backend bật `isActive=true`, xóa verify token và hạn token.

Không cho login nếu user chưa active.

Theo `api/docs/workflow.md`, `POST /api/auth/register` thành công trả `201 Created` và không có body. Client nên chuyển sang màn check email dựa trên status code, không đợi `{ data }`.

### Login

1. Client gọi `POST /api/auth/login`.
2. Backend kiểm email/password.
3. Backend tạo access token JWT bằng `ACCESS_TOKEN_SECRET`.
4. Backend tạo refresh token JWT bằng `REFRESH_TOKEN_SECRET`, lưu vào bảng `refresh_tokens`.
5. Backend set cookie `refreshToken` với `httpOnly`, `sameSite=none`, path `/api/auth`.
6. Body trả về có `accessToken`.

Lỗi user chưa active được gộp chung vào `401 Unauthorized` giống sai email/password để tránh dò trạng thái tài khoản.

Mobile/frontend cần lưu access token để gắn header:

```http
Authorization: Bearer <accessToken>
```

### Refresh

1. Client gọi `POST /api/auth/refresh`.
2. Backend lấy refresh token từ cookie `refreshToken` hoặc body.
3. Backend kiểm refresh token tồn tại trong DB và chưa hết hạn.
4. Backend verify JWT refresh token.
5. Backend tạo access token mới và refresh token mới.
6. Backend xóa refresh token cũ.

Đây là refresh token rotation. AI không được giả định refresh token cũ vẫn dùng lại được.

### Logout

1. Client gọi `POST /api/auth/logout`.
2. Nếu request có Bearer access token, backend decode `exp` và upsert token vào `blacklist_tokens`.
3. Backend xóa refresh token khỏi DB.
4. Backend clear cookie `refreshToken`.

Access token sau logout sẽ bị chặn bởi `AccessTokenStrategy`.

### Change password while logged in

Endpoint:

```text
PATCH /api/users/me/password
```

Runtime hiện tại:

- Kiểm tra mật khẩu cũ.
- Hash mật khẩu mới.
- Xóa refresh token cũ của user.
- Tạo access token mới và set refresh cookie mới.
- Cookie của endpoint này hiện dùng `sameSite=strict` và không set `path` riêng như auth login/refresh.
- Body trả về:

```json
{
  "data": {
    "accessToken": "<new-access-token>"
  }
}
```

Mobile/frontend không được parse endpoint này như `{ success: true }`; sau khi đổi password phải thay access token đang lưu bằng token mới.

### Admin user stats and force reset

Admin endpoints mới trong users module:

```text
GET /api/users/stats
POST /api/users/:id/force-reset-password
```

Runtime hiện tại:

- `GET /api/users/stats` cần `admin`, trả `{ data: { total, active, inactive } }`.
- `POST /api/users/:id/force-reset-password` cần `admin`, tạo mật khẩu tạm bằng `randomUUID().slice(0, 10)`, hash vào user, xóa refresh token cũ và trả `{ data: { newPassword } }`.

Vì force reset trả mật khẩu tạm dạng plain text một lần trong response, UI/admin workflow phải xử lý như secret tạm thời, không log ra console hay lưu lâu dài.

### Forgot/reset password

1. `POST /api/auth/forgot` tạo password reset token và gửi email.
2. `POST /api/auth/reset` kiểm token, hash password mới, xóa reset token.
3. Backend xóa toàn bộ refresh token của user sau reset password.

`POST /api/auth/forgot` luôn trả success nếu request hợp lệ về format, kể cả email không tồn tại. Đây là hành vi chống dò email theo `api/docs/workflow.md`.

`POST /api/auth/reset` hiện trả:

```json
{
  "data": {
    "success": true
  }
}
```

Reset password sẽ lỗi `400` nếu token sai/hết hạn hoặc mật khẩu mới giống mật khẩu cũ.

### Google OAuth

1. `GET /api/auth/google` chuyển user sang Google.
2. Callback nhận Google profile.
3. Backend tìm user bằng `googleId` hoặc email.
4. Nếu user tồn tại nhưng chưa có `googleId`, backend link Google vào user đó.
5. Nếu user tồn tại nhưng chưa active, backend vẫn link Google và bật `isActive=true`.
6. Nếu user chưa tồn tại, backend tạo user active, `password=null`, gán default SYS role.
7. Backend set refresh cookie và redirect về frontend với access token trên query hiện tại:

```text
WEB_ORIGIN/auth/oauth-success?access_token=<accessToken>
```

### Link Google account

1. User đã login gọi `GET /api/users/me/link-account`.
2. `GoogleLinkGuard` tạo OAuth state ký bằng access token secret.
3. Callback `GET /api/users/me/link-account/callback` verify state.
4. Backend chỉ link nếu Google email khớp email user hiện tại.

Callback link Google redirect về frontend:

| Kết quả | Redirect |
| --- | --- |
| Thành công | `/auth/oauth-success?linked=google` |
| State sai | `/auth/oauth-error?reason=invalid_state` |
| Google account thiếu email/id | `/auth/oauth-error?reason=invalid_google_account` |
| Google account đã link user khác | `/auth/oauth-error?reason=google_account_already_linked` |
| Email Google không khớp user hiện tại | `/auth/oauth-error?reason=email_mismatch` |

## Permission flow

### Guard pipeline

```text
Request
  -> GlobalAuthGuard
     -> skip if @Public()
     -> AccessTokenGuard/Strategy
        -> verify Bearer JWT
        -> reject token in blacklist_tokens
        -> ensure user exists
  -> PermissionGuard
     -> skip if @Public()
     -> skip if no @Permissions()
     -> collect user permissions
     -> compare ANY or ALL
```

### Permission sources

| Source | Logic |
| --- | --- |
| Global SYS permission | Query `user_roles -> role_permissions -> permissions`. |
| Board permission | User must be in `UserEditorBoard`. Creator is `board:owner`; lead is `board:leader`; otherwise `board:member`. |
| Project permission | User must be in `UserProject`. Creator is `project:owner`; otherwise permissions come from PRJ role. |
| Nested resource permission | Backend finds the project behind folder/file/material/task/frame/comment/application, then applies project permission logic. |

Important runtime detail:

- `GET /api/permissions/me/sys` chỉ trả quyền global từ SYS roles.
- `GET /api/permissions/me/projects/:id` trả `project:owner` nếu user là creator; nếu không thì trả quyền từ PRJ role của user trong project.
- `GET /api/permissions/me/boards/:id` trả đúng một trong các quyền derived: `board:owner`, `board:leader`, `board:member`.
- Với application id cụ thể, nếu user là project owner thì backend tự thêm `project:application.approve`.
- Một số controller cho phép `board:leader` đọc/cập nhật resource trong cây project, nhưng `GET /api/permissions/me/projects/:id` không tự trả `board:leader`; client cần gọi thêm board permission khi screen liên quan editor board.
- Các comment endpoint mới dùng bảng `comments` chung. Với route lồng như `/files/:id/comments`, `/tasks/:id/comments`, `/frames/:id/comments`, `/applications/:id/comments`, `:id` là parent resource id chứ không phải comment id.

### Permission mode

`ANY` means user needs at least one listed permission.

`ALL` means user needs every listed permission.

Most controllers currently use `ANY`.

## Permission strings AI must recognize

System/admin:

```text
admin
user:read, user:update, user:delete, user:create
role:read, role:update, role:delete, role:create
permission:read, permission:update
```

Board:

```text
board:owner
board:leader
board:member
```

Project:

```text
project:owner
project:read
project:update
project:delete
project:member.read
project:member.update
project:member.add
project:member.remove
project:folder.create
project:folder.update
project:folder.delete
project:file.create
project:file.update
project:file.delete
project:material.create
project:material.update
project:material.delete
project:task.create
project:task.update
project:task.delete
project:frame.create
project:frame.update
project:frame.delete
project:comment.create
project:comment.update
project:comment.delete
project:application.create
project:application.read
project:application.update
project:application.delete
project:application.approve
```

## AI integration rules for auth/permission

- Always include `/api` prefix for backend routes.
- Use Bearer access token for protected endpoints.
- Be ready to call refresh when API returns unauthorized due to expired access token.
- Do not use refresh token rotation as if refresh token is stable.
- Do not show admin/project action buttons only from frontend assumptions; call permission endpoints when possible:
  - `GET /api/permissions/me/sys`
  - `GET /api/permissions/me/projects/:id`
  - `GET /api/permissions/me/boards/:id`
- Do not treat `board:leader` as a project role. It is derived from `UserEditorBoard.isLead`.
- Do not treat `project:owner` as a stored permission. It is derived from `Project.createdBy`.
