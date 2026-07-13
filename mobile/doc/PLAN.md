# Kế Hoạch Kết Nối Mobile Với API Thật

## Summary

Triển khai theo hướng **read-first**: thay mock data bằng API thật cho các màn danh sách/detail chính trước, giữ các mutation phức tạp như create/update/delete/comment/vote cho phase sau. Mobile sẽ có một `apiClient` dùng chung, tự gắn `Bearer accessToken`, xử lý lỗi chuẩn, và dùng `EXPO_PUBLIC_API_BASE_URL`.

## API Mapping Theo Màn Hình

| Mobile screen | API dùng |
|---|---|
| Login | `POST /api/auth/login`, `POST /api/auth/forgot`, `POST /api/auth/logout` |
| Home | `GET /api/projects?me=true`, `GET /api/tasks?me=true`, `GET /api/notifications`, `GET /api/activity-logs` |
| Projects | `GET /api/projects?me=true&name=&field=updatedAt&order=desc` |
| Project Detail | `GET /api/projects/{id}`, `GET /api/projects/{id}/editor-boards`, `GET /api/projects/{id}/applications`, `GET /api/projects/{id}/stats` |
| Project Report | `GET /api/projects/{id}/stats`, `GET /api/projects/{id}/tasks`, `GET /api/projects/{id}/applications`, `GET /api/projects/{id}/folders` |
| Resources | `GET /api/projects/{id}/folders?parentId=...`, `GET /api/folders/{id}/children`, `GET /api/folders/{id}/files` |
| Resource File | `GET /api/files/{id}`, `GET /api/files/{id}/versions`, `GET /api/files/{id}/tasks`, `GET /api/files/{id}/comments` |
| Materials | `GET /api/files/{id}/versions`, `GET /api/files/{id}/materials`, `GET /api/materials/{id}` |
| Tasks | `GET /api/tasks?me=true` or `GET /api/projects/{id}/tasks?me=true` |
| Task Detail | `GET /api/tasks/{id}`, `GET /api/tasks/{id}/frames`, `GET /api/tasks/{id}/comments` |
| Applications | `GET /api/applications` or `GET /api/projects/{id}/applications` |
| Application Detail | `GET /api/applications/{id}`, `GET /api/applications/{id}/comments`, `GET /api/applications/{id}/votes` |
| Application Create | Phase sau: `POST /api/projects/{id}/applications` |
| Editor Boards | `GET /api/editor-boards?me=true&name=` |
| Editor Board Detail | `GET /api/editor-boards/{id}`, `GET /api/editor-boards/{id}/members`, `GET /api/editor-boards/{id}/projects`, `GET /api/editor-boards/{id}/applications` |
| Editor Board Attach Project | Phase sau: `GET /api/projects?me=true`, `POST /api/editor-boards/{id}/projects` |
| Profile | `GET /api/users/me`, `PATCH /api/users/me`, logout |
| Notifications | `GET /api/notifications`; phase sau: `PATCH /api/notifications/{id}/read`, `PATCH /api/notifications/read-all` |

## Key Implementation Changes

- Tạo mobile API foundation:
  - `src/services/apiClient.ts`: fetch wrapper, base URL, auth header, JSON parsing, normalized error.
  - Sửa `.env` convention sang `EXPO_PUBLIC_API_BASE_URL=http://localhost:3000/api`.
  - Giữ `tokenStorage.ts`, thêm refresh token sau nếu backend cookie refresh hoạt động ổn trên device.

- Tạo service theo domain:
  - `projectApi.ts`, `resourceApi.ts`, `taskApi.ts`, `applicationApi.ts`, `editorBoardApi.ts`, `userApi.ts`, `notificationApi.ts`.
  - Response giữ shape backend `{ data, pagination }`, mapper chuyển sang UI model hiện tại để giảm churn component.

- Chuẩn hóa ID:
  - Backend dùng `number`, mobile route hiện là `string`.
  - Plan implementation: route params vẫn để `string` để ít sửa navigation, service sẽ `Number(id)` khi gọi API, mapper trả `String(api.id)` cho UI.

- Thay mock theo thứ tự:
  1. Auth/Profile shell.
  2. Projects -> Project Detail -> Project Report.
  3. Resources -> Folder Detail -> Resource File -> Materials.
  4. Tasks -> Task Detail.
  5. Applications -> Application Detail.
  6. Editor Boards -> Editor Board Detail.
  7. Home/Notifications aggregate.

- UI state bắt buộc cho mỗi màn read API:
  - Loading skeleton/simple loader.
  - Empty state dùng lại component hiện có.
  - Error state có retry.
  - Search/filter ưu tiên gọi API query khi endpoint hỗ trợ; filter client-side chỉ dùng cho field API chưa hỗ trợ.

## Test Plan

- Type check: `npx tsc --noEmit` trong `mobile`.
- Manual smoke:
  - Login thành công -> Home.
  - Projects list load từ API -> mở Project Detail -> Report.
  - Project Detail -> Resources -> folder -> file -> Materials tab.
  - Tasks list all/project scoped -> Task Detail.
  - Applications all/project scoped -> Application Detail.
  - Editor Boards -> Board Detail projects/members/applications.
  - Profile hiển thị user thật, logout clear token.
- API failure scenarios:
  - Server off: màn hình hiện error + retry.
  - Token thiếu/hết hạn: quay về Login hoặc hiện auth error.
  - Empty project/folder/task/application: empty state đúng.

## Assumptions

- Phase đầu là **read-first**, chưa nối full CRUD trừ login/logout đã có.
- Backend chạy tại `http://localhost:3000/api` khi dev local; Android emulator dùng `http://10.0.2.2:3000/api`.
- Backend đã có dữ liệu seed thật đủ để test các màn chính.
- Activity Logs dùng `GET /api/activity-logs` dù swagger hiện có thể chưa phản ánh đầy đủ endpoint này.
