# AI Backend Flow Guide - Index

Nguồn gốc ban đầu: tài liệu HTML `mobile/.doc/backend-api-system-analysis.html`, đọc từ backend `api/`.

Cập nhật gần nhất: đối chiếu lại bản mới của `api/docs/` và code hiện tại trong `api/`.

## Source priority

Khi có thông tin trùng nhau:

1. Ưu tiên tài liệu trong `api/docs/`.
2. Sau đó kiểm chứng bằng runtime code trong `api/src/`, `api/prisma/schema.prisma`, DTO và service.
3. Các ghi chú UI/local mobile trong thư mục này chỉ dùng để bổ sung ngữ cảnh mobile.

Mục tiêu của bộ file này là giúp AI/agent hiểu đúng flow hiện có trước khi viết code mobile, frontend hoặc backend cho dự án Mangaka.

## Thứ tự đọc đề xuất

1. `ai-backend-01-system-map.md`
   Nắm bức tranh tổng thể: stack, domain, entity chính, response shape và API prefix.

2. `ai-backend-02-auth-permission.md`
   Nắm auth/session flow và permission model. Đây là file phải đọc trước khi đụng endpoint có JWT hoặc nút hành động theo quyền.

3. `ai-backend-03-project-board.md`
   Nắm flow project, member, role project, editor board, board lead và publish request theo board.

4. `ai-backend-04-content-review-application.md`
   Nắm flow nội dung: project -> folder -> file -> materials/version -> tasks -> frames -> universal comments -> applications/votes -> notifications -> stats.

5. `ai-backend-05-agent-rules.md`
   Quy tắc thực thi cho AI khi sửa code hoặc tích hợp API, gồm các lỗi dễ mắc trong backend hiện tại.

## Mental model rất ngắn

Mangaka backend là hệ thống quản lý quy trình sản xuất và review manga:

```text
User/Auth
  -> SYS roles/permissions
  -> Project membership with PRJ roles
  -> Project
     -> Folders
        -> Files
           -> Materials + versions
           -> Tasks
              -> Frames
                 -> Comments
              -> Comments
           -> Comments
     -> Applications
        -> Comments
        -> Votes
     -> ProjectStats
  -> EditorBoard
     -> Members/Lead
     -> Projects
     -> Publish Requests
  -> ActivityLogs
  -> Notifications
```

## Điều AI cần nhớ ngay

- Tất cả controller backend có global prefix `/api`.
- Swagger UI ở `/docs`.
- Response thường là `{ data: ... }`; list thường thêm `{ pagination: ... }`.
- API workflow chi tiết nhất hiện nằm ở `api/docs/workflow.md`.
- Data model chính thức hiện nằm ở `api/docs/database.md`.
- `api/docs/srs.md` mô tả target architecture/refactor; khi runtime code khác SRS thì ghi rõ trạng thái trước khi implement.
- Coding rules backend chính thức nằm ở `api/docs/FOLLOW.md`.
- Auth dùng access token Bearer và refresh token qua cookie `refreshToken`.
- `POST /api/auth/register`, `POST /api/auth/verify-email`, `POST /api/auth/forgot` có thể thành công với empty body; `POST /api/auth/logout` trả `204 No Content`.
- Quyền có hai tầng: `SYS` cho toàn hệ thống, `PRJ` cho từng project.
- `board:leader` được nhiều controller cho phép thao tác/đọc resource project như một reviewer/approver mở rộng.
- Comment hiện dùng bảng `comments` chung cho file/task/frame/application, không còn model riêng `TaskComment`.
- Application workflow có thêm vote và các trạng thái nội bộ/submission: `INTERNAL_APPROVED`, `SUBMITTED`, `APPROVE`, `REJECT`, `CANCELLED`.
- Material có endpoint xem version và restore version cũ bằng cách tạo bản material mới.
- Notification đọc từ `GET /api/notifications`, liên kết với `activity_logs`.
- Một số endpoint lồng nhau đang khai báo `resource` không khớp với path param `:id`; xem `ai-backend-05-agent-rules.md` trước khi sửa guard hoặc dùng các endpoint đó.
