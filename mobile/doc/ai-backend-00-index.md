# AI Backend Flow Guide - Index

Nguồn gốc: tài liệu HTML `mobile/.doc/backend-api-system-analysis.html`, đọc từ backend `api/`.

Mục tiêu của bộ file này là giúp AI/agent hiểu đúng flow hiện có trước khi viết code mobile, frontend hoặc backend cho dự án Mangaka.

## Thứ tự đọc đề xuất

1. `ai-backend-01-system-map.md`
   Nắm bức tranh tổng thể: stack, domain, entity chính, response shape và API prefix.

2. `ai-backend-02-auth-permission.md`
   Nắm auth/session flow và permission model. Đây là file phải đọc trước khi đụng endpoint có JWT hoặc nút hành động theo quyền.

3. `ai-backend-03-project-board.md`
   Nắm flow project, member, role project, editor board, board lead và publish request theo board.

4. `ai-backend-04-content-review-application.md`
   Nắm flow nội dung: project -> folder -> file -> materials -> tasks -> frames -> comments -> applications -> stats.

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
           -> Materials
           -> Tasks
              -> Frames
                 -> Comments
     -> Applications
     -> ProjectStats
  -> EditorBoard
     -> Members/Lead
     -> Projects
     -> Publish Requests
```

## Điều AI cần nhớ ngay

- Tất cả controller backend có global prefix `/api`.
- Swagger UI ở `/docs`.
- Response thường là `{ data: ... }`; list thường thêm `{ pagination: ... }`.
- Auth dùng access token Bearer và refresh token qua cookie `refreshToken`.
- Quyền có hai tầng: `SYS` cho toàn hệ thống, `PRJ` cho từng project.
- Một số endpoint lồng nhau đang khai báo `resource` không khớp với path param `:id`; xem `ai-backend-05-agent-rules.md` trước khi sửa guard hoặc dùng các endpoint đó.

