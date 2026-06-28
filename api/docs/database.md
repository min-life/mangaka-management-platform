# Tài liệu Database (Database Schema Documentation)

Tài liệu này mô tả cấu trúc cơ sở dữ liệu của dự án Mangaka Management Platform. Cấu trúc được định nghĩa thông qua Prisma (`schema.prisma`) sử dụng PostgreSQL.

## 1. User & Authentication (Người dùng & Xác thực)

### Bảng `users` (User)
- **Công dụng:** Lưu trữ thông tin người dùng trong hệ thống (biên tập viên, quản lý, admin...).
- **Các trường (Fields):**
  - `id` (Int): Khóa chính, tự tăng.
  - `displayName` (String?): Tên hiển thị.
  - `avatarUrl` (String?): Đường dẫn tới ảnh đại diện.
  - `email` (String): Địa chỉ email (duy nhất).
  - `password` (String?): Mật khẩu (đã mã hóa).
  - `googleId` (String?): ID Google để đăng nhập bằng Google (duy nhất).
  - `isActive` (Boolean): Trạng thái tài khoản (kích hoạt hay chưa).
  - `emailVerifyToken` / `emailVerifyExpiresAt`: Token và hạn dùng để xác thực email.
  - `passwordResetToken` / `passwordResetExpiresAt`: Token và hạn dùng để reset mật khẩu.
  - `createdBy`, `updatedBy`: ID của người tạo/cập nhật.
  - `createdAt`, `updatedAt`: Thời gian tạo/cập nhật.

### Bảng `roles` (Role)
- **Công dụng:** Lưu trữ các vai trò (nhóm quyền) trong hệ thống hoặc dự án.
- **Các trường:**
  - `id` (Int): Khóa chính.
  - `code` (String): Mã vai trò (duy nhất).
  - `scope` (SCOPE): Phạm vi của vai trò (`SYS` - Hệ thống, `PRJ` - Dự án).
  - `name` (String): Tên vai trò.
  - `isDefault` (Boolean): Đánh dấu vai trò mặc định.
  - `createdBy`, `updatedBy`, `createdAt`, `updatedAt`: Các trường Audit (ghi vết).

### Bảng `user_roles` (UserRole)
- **Công dụng:** Bảng trung gian gán vai trò cho người dùng (N-N).
- **Các trường:**
  - `userId` (Int): Khóa ngoại tham chiếu bảng `users`.
  - `roleId` (Int): Khóa ngoại tham chiếu bảng `roles`.

### Bảng `permissions` (Permission)
- **Công dụng:** Định nghĩa các quyền chi tiết trong hệ thống (vd: `CREATE_PROJECT`, `VIEW_FILE`).
- **Các trường:**
  - `id` (Int): Khóa chính.
  - `name` (String): Tên quyền (duy nhất).
  - `scope` (SCOPE): Phạm vi của quyền (`SYS` hoặc `PRJ`).
  - `description` (String?): Mô tả chi tiết quyền.

### Bảng `role_permissions` (RolePermission)
- **Công dụng:** Bảng trung gian gán quyền cho vai trò (N-N).
- **Các trường:**
  - `roleId` (Int): Khóa ngoại tham chiếu `roles`.
  - `permissionId` (Int): Khóa ngoại tham chiếu `permissions`.

### Bảng `refresh_tokens` (RefreshToken)
- **Công dụng:** Lưu trữ refresh token cho chức năng xác thực (cấp lại access token).
- **Các trường:**
  - `token` (String): Khóa chính, giá trị token.
  - `userId` (Int): ID người dùng sở hữu token.
  - `expiresAt` (DateTime): Thời gian hết hạn.

### Bảng `blacklist_tokens` (BlacklistToken)
- **Công dụng:** Lưu trữ các token đã bị thu hồi/đăng xuất để chặn tái sử dụng.
- **Các trường:**
  - `token` (String): Khóa chính, giá trị token bị chặn.
  - `expiresAt` (DateTime): Hạn xóa token khỏi danh sách đen.

---

## 2. Project & Editor Board (Dự án & Bảng Biên Tập)

### Bảng `projects` (Project)
- **Công dụng:** Quản lý thông tin dự án truyện tranh hoặc tác phẩm.
- **Các trường:**
  - `id` (Int): Khóa chính.
  - `name` (String): Tên dự án.
  - `description` (String?): Mô tả dự án.
  - `imageUrl` (String?): Ảnh đại diện dự án.
  - `editorBoardId` (Int?): Liên kết với bảng biên tập quản lý dự án này.
  - `createdBy`, `updatedBy`, `createdAt`, `updatedAt`: Các trường Audit.

### Bảng `user_projects` (UserProject)
- **Công dụng:** Phân công người dùng vào dự án với vai trò cụ thể.
- **Các trường:**
  - `userId` (Int), `projectId` (Int), `roleId` (Int): Khóa chính tổng hợp.
  - `createdBy`, `updatedBy`, `createdAt`, `updatedAt`: Các trường Audit.

### Bảng `project_stats` (ProjectStat)
- **Công dụng:** Lưu trữ các số liệu thống kê (metrics) của một dự án.
- **Các trường:**
  - `id` (Int): Khóa chính.
  - `projectId` (Int): ID dự án.
  - `metrics` (Json): Dữ liệu thống kê dạng JSON.
  - `updatedAt` (DateTime): Thời gian cập nhật gần nhất.

### Bảng `editor_boards` (EditorBoard)
- **Công dụng:** Bảng biên tập (phòng ban/nhóm) quản lý một hoặc nhiều dự án.
- **Các trường:**
  - `id` (Int): Khóa chính.
  - `name` (String): Tên bảng biên tập.
  - `description` (String?): Mô tả.
  - `imageUrl` (String?): Ảnh đại diện.
  - `createdBy`, `updatedBy`, `createdAt`, `updatedAt`: Các trường Audit.

### Bảng `user_editor_boards` (UserEditorBoard)
- **Công dụng:** Bảng trung gian phân công người dùng làm thành viên của bảng biên tập.
- **Các trường:**
  - `userId` (Int), `editorBoardId` (Int): Khóa chính tổng hợp.
  - `isLead` (Boolean): Người này có phải là trưởng bảng (Lead) hay không.

---

## 3. File Management (Quản lý File & Thư mục)

### Bảng `folders` (Folder)
- **Công dụng:** Quản lý cấu trúc thư mục của một dự án (chứa file/chương truyện).
- **Các trường:**
  - `id` (Int): Khóa chính.
  - `title` (String): Tên thư mục.
  - `description` (String?): Mô tả.
  - `parentId` (Int?): ID thư mục cha (cấu trúc cây).
  - `projectId` (Int): ID dự án chứa thư mục.
  - `createdBy`, `updatedBy`, `createdAt`, `updatedAt`: Các trường Audit.

### Bảng `files` (File)
- **Công dụng:** Quản lý thông tin file tài liệu, bản thảo.
- **Các trường:**
  - `id` (Int): Khóa chính.
  - `title` (String): Tên file.
  - `description` (String?): Mô tả.
  - `folderId` (Int): Nằm trong thư mục nào.
  - `createdBy`, `updatedBy`, `createdAt`, `updatedAt`: Các trường Audit.

### Bảng `file_materials` (FileMaterial)
- **Công dụng:** Lưu trữ các tài nguyên/assets đính kèm hoặc nội dung chi tiết của một file (ví dụ thông tin trang truyện, kích thước).
- **Các trường:**
  - `id` (Int): Khóa chính.
  - `fileId` (Int): ID của file.
  - `materials` (Json): Nội dung chi tiết (JSON).
  - `createdBy`, `updatedBy`, `createdAt`, `updatedAt`: Các trường Audit.

---

## 4. Task & Collaboration (Công việc & Phối hợp)

### Bảng `tasks` (Task)
- **Công dụng:** Quản lý công việc (nhận xét, sửa lỗi, vẽ lại,...) gắn liền với bản thảo/file.
- **Các trường:**
  - `id` (Int): Khóa chính.
  - `title` (String): Tiêu đề task.
  - `description` (String?): Mô tả chi tiết.
  - `status` (PROGRESS_STATUS): Trạng thái (`PENDING`, `INPROGRESS`, `REVIEW`, `DONE`).
  - `deadline` (DateTime?): Hạn chót.
  - `parentId` (Int?): Task cha (nếu là sub-task).
  - `fileId` (Int): Task này thuộc file bản thảo nào.
  - `assignedBy` (Int?): Người được giao việc.
  - `createdBy`, `updatedBy`, `createdAt`, `updatedAt`: Các trường Audit.

### Bảng `task_comment_frames` (TaskCommentFrame)
- **Công dụng:** Lưu tọa độ vùng được đánh dấu trên ảnh (khung nhận xét) dành cho Task.
- **Các trường:**
  - `id` (Int): Khóa chính.
  - `startX`, `startY`, `endX`, `endY` (Decimal): Tọa độ góc của khung (bounding box).
  - `taskId` (Int): ID của Task tương ứng.
  - `createdBy`, `updatedBy`, `createdAt`, `updatedAt`: Các trường Audit.

### Bảng `comments` (Comment)
- **Công dụng:** Bình luận, trao đổi của người dùng. Có thể đính kèm vào File, Task, Frame, hoặc Application.
- **Các trường:**
  - `id` (Int): Khóa chính.
  - `content` (Json): Nội dung bình luận (hỗ trợ rich text dạng JSON).
  - `fileId`, `taskId`, `frameId`, `applicationId` (Int?): Đối tượng mà comment đang đính kèm tới (liên kết linh hoạt).
  - `createdBy`, `createdAt`, `updatedAt`: Các trường Audit.

---

## 5. Applications (Đơn từ, Quy trình phê duyệt)

### Bảng `applications` (Application)
- **Công dụng:** Đơn yêu cầu phê duyệt (vd: xin duyệt bản thảo, yêu cầu xuất bản).
- **Các trường:**
  - `id` (Int): Khóa chính.
  - `projectId` (Int): Đơn thuộc dự án nào.
  - `title` (String): Tiêu đề đơn.
  - `description` (String?): Nội dung chi tiết.
  - `materials` (Json): Tài liệu đính kèm theo đơn.
  - `type` (APPLICATION_TYPE): Loại đơn (`MANUSCRIPT_REVIEW`, `PUBLISH_REQUEST`).
  - `status` (APPLICATION_STATUS): Trạng thái (`PENDING`, `INTERNAL_APPROVED`, `SUBMITTED`, `APPROVE`, `REJECT`, `CANCELLED`).
  - `verifyBy` (Int?): Người trực tiếp duyệt đơn.
  - `createdBy`, `updatedBy`, `createdAt`, `updatedAt`: Các trường Audit.

### Bảng `application_votes` (ApplicationVote)
- **Công dụng:** Lưu quyết định bỏ phiếu/nhận xét của thành viên trong một Đơn.
- **Các trường:**
  - `applicationId` (Int): Đơn được bỏ phiếu.
  - `userId` (Int): Người bỏ phiếu.
  - `decision` (VOTE_DECISION): Quyết định (`APPROVE`, `REJECT`, `ABSTAIN` - trắng án/bỏ qua).
  - `comment` (String?): Lời nhắn kèm theo phiếu.
  - `createdAt`, `updatedAt`: Các trường Audit.

---

## 6. Activity Logs & Notifications (Lịch sử hoạt động & Thông báo)

### Bảng `activity_logs` (ActivityLog)
- **Công dụng:** Ghi nhận lại toàn bộ lịch sử thao tác của người dùng trên hệ thống để theo dõi (Audit Log).
- **Các trường:**
  - `id` (Int): Khóa chính.
  - `action` (ACTIVITY_ACTION): Loại thao tác (vd: `TASK_CREATED`, `FILE_DELETED`, ...).
  - `entityType` (ENTITY_TYPE): Loại đối tượng bị tác động (`PROJECT`, `FILE`, `TASK`, ...).
  - `entityId` (Int): ID của đối tượng bị tác động.
  - `projectId`, `editorBoardId` (Int?): ID ngữ cảnh phụ (weak references để lưu log).
  - `actorId` (Int): Người thực hiện hành động.
  - `metadata` (Json?): Thông tin bổ sung (dạng JSON).
  - `createdAt` (DateTime): Thời gian thực hiện.

### Bảng `notifications` (Notification)
- **Công dụng:** Gửi thông báo tới người dùng liên quan đến các hoạt động (từ ActivityLog).
- **Các trường:**
  - `id` (Int): Khóa chính.
  - `userId` (Int): Người nhận thông báo.
  - `activityLogId` (Int): ID hoạt động (Log) gây ra thông báo này để truy xuất dữ liệu liên quan.
  - `isRead` (Boolean): Trạng thái đã đọc/chưa đọc.
  - `createdAt`, `updatedAt`: Các trường Audit.

---

## 7. Các bảng không còn được sử dụng (Unused Tables)

Dựa trên cấu trúc sơ đồ dữ liệu (`schema.prisma`) và mã nguồn hiện tại, **tất cả các bảng (tables) đều đang được sử dụng**.
Không có bảng nào bị đánh dấu là không sử dụng (deprecated/unused).
