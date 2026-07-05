# Luồng Phối hợp Màn hình (Frontend Flows)

Tài liệu này mô tả cách Frontend điều hướng và gọi API để mang lại trải nghiệm mượt mà nhất. 
*(Chi tiết về API Endpoints như Input/Output Schema nằm ở phần "API Endpoints Workflow" bên dưới).*

## 1. Luồng Xác thực (Auth Flow)

### 1.1 Luồng Đăng ký & Kích hoạt
1. **Đăng ký (`/register`)**: User điền form -> Gọi `POST /api/auth/register`. Thành công sẽ chuyển hướng sang trang báo Check Email.
2. **Kích hoạt (`/verify-email`)**: User bấm link từ email -> Mở Frontend lấy tham số `token` -> Gọi `POST /api/auth/verify-email`. Kích hoạt thành công chuyển về trang Đăng nhập.

### 1.2 Luồng Đăng nhập & Duy trì phiên
1. **Đăng nhập (`/login`)**: Gọi `POST /api/auth/login`. Thành công sẽ lưu `accessToken` (Memory/Local Storage). `refreshToken` được giữ trong Cookie HttpOnly.
2. **Tự động gia hạn (Refresh Token)**: Axios Interceptor bắt lỗi 401. Gọi ngầm `POST /api/auth/refresh` lấy token mới và gọi lại request bị lỗi. Nếu thất bại, văng về trang Đăng nhập.

### 1.3 Luồng Quên & Đặt lại mật khẩu
1. **Quên pass (`/forgot-password`)**: Gọi `POST /api/auth/forgot`. Luôn chuyển hướng sang trang Check Email để chống dò quét tài khoản.
2. **Đặt lại pass (`/reset-password`)**: Nhận token từ URL, nhập pass mới -> Gọi `POST /api/auth/reset`. Đổi thành công sẽ tự động đăng xuất các thiết bị khác.

### 1.4 Luồng Đăng nhập Google
1. **Điều hướng**: Từ `/login`, bấm nút Google -> Redirect Location sang `GET /api/auth/google`.
2. **Callback**: Google trả về backend -> Backend redirect ngược về Frontend (`/auth/oauth-success`) kèm Access Token trong URL parameter (`?access_token=...`).

## 2. Luồng Quản lý Người dùng (Users Flow)

### 2.1 Cá nhân (Profile)
1. **Xem & Sửa Profile**: Vào `/profile`, gọi `GET /api/users/me`. Khi cập nhật thông tin gọi `PATCH /api/users/me`.
2. **Đổi mật khẩu**: Gọi `PATCH /api/users/me/password`. Thành công, backend trả về cặp token mới -> Frontend lưu lại ngầm mà không làm văng user.
3. **Liên kết Google**: Bấm nút -> Chuyển hướng `GET /api/users/me/link-account`. Khi quay lại sẽ hiện Toast thành công/thất bại.

### 2.2 Quản trị viên (Admin)
1. **Dashboard Users (`/admin/users`)**: Gọi `GET /api/users/stats` để vẽ chart, gọi `GET /api/users` đổ data vào Table.
2. **Quản lý 1 User**: Vào chi tiết, có thể Khóa (`PATCH /api/users/:id`), phân quyền Role (`PUT /api/users/:id/roles`) hoặc ép đổi pass (`POST /api/users/:id/force-reset-password`).

## 3. Luồng Vai trò & Phân quyền (Roles & Permissions Flow)

### 3.1 Giao diện theo Quyền (Authorization UX)
1. **Toàn cục**: Load app, gọi `GET /api/permissions/me/sys` để ẩn/hiện các menu hệ thống.
2. **Trong Dự án/Ban**: Vào dự án gọi `GET /api/permissions/me/projects/:id` để hiện các nút nâng cao (như Xóa dự án, Duyệt đơn) tùy thuộc vào chức danh (Role) trong dự án đó.

### 3.2 Quản trị Roles
1. **Tạo & Cập nhật**: Vào `/admin/roles`. Cập nhật thông tin gọi `PATCH`, cấp quyền gọi `PUT /api/roles/:id/permissions` (ghi đè toàn bộ mảng ID quyền).
2. **Xóa Role**: Gọi `DELETE /api/roles/:id`. Lỗi 409 nếu Role đang có người dùng/dự án sử dụng.

## 4. Luồng Dự án (Projects Flow)

### 4.1 Khởi tạo & Xóa
1. **Tạo**: Bấm tạo, gọi `POST /api/projects`. Người tạo tự động thành Owner dự án.
2. **Rời/Xóa**: Member có thể tự rời (`DELETE /api/projects/:id/members/me`). Owner không thể rời, chỉ có thể xóa cứng dự án (`DELETE /api/projects/:id`).

### 4.2 Cấu hình Bảng vẽ (Editor Board)
1. **Gán ban biên tập**: Vào Settings dự án, chọn 1 Ban biên tập -> `POST /api/projects/:id/editor-boards`.
2. **Tháo gỡ**: Bấm Hủy liên kết -> `DELETE /api/projects/:id/editor-boards`.

### 4.3 Quản lý Thành viên
1. **Thêm/Sửa/Xóa**: Hiển thị bảng thành viên. Thay đổi dropdown chức danh -> `PATCH /api/projects/:id/members/:userId`. Kích người -> `DELETE /api/projects/:id/members/:userId`.

## 5. Luồng Ban Biên Tập (Editor Boards Flow)

### 5.1 Quản trị Ban
1. **Tạo & Kích thành viên**: Người tạo tự thành Chủ ban (`isLead = true`). Có thể kích member (`DELETE /api/editor-boards/:id/members/:userId`).
2. **Bổ nhiệm Trưởng ban**: Bấm menu kebab cạnh tên -> Chọn "Bổ nhiệm Lead" -> `PATCH /api/editor-boards/:id/members/:userId/lead`. Người cũ sẽ tự động giáng chức thành member.

## 6. Luồng Đơn từ & Bỏ phiếu (Applications Flow)

### 6.1 Xét duyệt & Bỏ phiếu (Vote)
1. **Mở Đơn (`/applications/:id`)**: Thành viên Ban biên tập xem đơn và tài liệu.
2. **Bỏ phiếu**: Bấm Chấp thuận / Từ chối / Trắng án -> Gọi `POST /api/applications/:id/votes`. (Cho phép bấm lại để đổi phiếu - Upsert).

### 6.2 Quyết định cuối cùng (Finalize) & Luồng Phê duyệt 2 Bước
1. **Đối với Đơn thường (Publish Request, v.v.)**: Trưởng ban (Lead) hoặc Board Owner ra quyết định cuối bằng cách gọi `PATCH /api/applications/:id/status`.
2. **Đối với Đơn tạo thư mục (`CREATE_ARC`, `CREATE_CHAPTER`)**: Áp dụng luồng phê duyệt 2 bước nghiêm ngặt:
   - **Bước 1 (Duyệt cấp Dự án)**: Người có quyền duyệt trong dự án (`project:owner` hoặc `project:application.approve`) duyệt đơn từ `PENDING` -> `INTERNAL_APPROVED` (hoặc `REJECT`). Đơn ở trạng thái này mới được đẩy lên Ban biên tập (Editor Board).
   - **Bước 2 (Duyệt cấp Ban biên tập)**: Trưởng ban (`board:leader` hoặc `board:owner`) duyệt từ `INTERNAL_APPROVED` -> `APPROVE` (hoặc `REJECT`).
   - **Tự động hóa sau phê duyệt**: Khi đơn đạt trạng thái `APPROVE`, hệ thống sẽ tự động tạo thư mục gốc (`ARC`) hoặc thư mục con (`Chapter`) tương ứng, đồng thời tự động tạo 1 File và 1 FileMaterial đầu tiên chứa bản thảo đính kèm từ đơn.

## 7. Luồng Công việc (Tasks Flow)

### 7.1 Bảng kéo thả (Kanban)
1. **Kéo thẻ Task**: Từ PENDING sang IN_PROGRESS -> Gọi `PATCH /api/tasks/:id` với `status = INPROGRESS`.
2. **Lỗi Dependency**: Nếu task cha chưa xong, backend ném lỗi 400 (Mã `EVLSUBTASKDEP`). Frontend bắt lỗi, hiện Toast và kéo thẻ về vị trí cũ.
3. **Thảo luận**: Bấm vào Task để chat. Gọi API Comment (`GET/POST /api/tasks/:id/comments`) để lấy hoặc tạo bình luận. API GET `/api/tasks/:id/comments` trả về cả bình luận của task và bình luận được ghim trên bản vẽ (frames).
4. **Đánh dấu lỗi (Frames)**: Trên giao diện xem trước ảnh (Material), người dùng kéo thả tạo khung (Frame) bằng `POST /api/materials/:id/frames`. Sau đó tạo bình luận ghim trên khung `POST /api/frames/:id/comments`. Có thể xem danh sách khung bằng `GET /api/materials/:id/frames` hoặc `GET /api/tasks/:id/frames`. 
5. **Chỉnh sửa bình luận**: Người dùng hoặc project owner có thể cập nhật (`PATCH /api/comments/:id`) hoặc xóa bình luận (`DELETE /api/comments/:id`).

### 7.2 Khởi tạo Task & Tạo Nhánh Bản Vẽ (Material Branching)
1. **Khởi tạo Task**: Khi tạo task mới (`POST /api/files/:id/tasks`), hệ thống hỗ trợ tạo nhánh (branching) bản vẽ để các task song song làm việc độc lập.
2. **Clone từ Base Material**: Truyền `cloneBaseMaterial: true` để tạo một bản copy của bản vẽ gốc (material không thuộc task nào) và gán cho task mới.
3. **Clone từ Task khác**: Truyền `cloneMaterialFromTaskId: [ID]` để tạo một bản copy của bản vẽ mới nhất từ một task khác. Phiên bản copy này sẽ hoàn toàn độc lập (sạch), không chứa frame/comment của task cũ, giúp người dùng bắt đầu một phiên làm việc mới trên nền bản vẽ đó.

## 8. Luồng Thư mục & Tập tin (Folders & Files Flow)

### 8.1 Cây thư mục (Folder Tree)
1. **Quy tắc phân loại**:
   - **ARC (Thư mục gốc)**: Là thư mục không có thư mục cha (`parentId: null`). Có thể chứa Chapter hoặc File.
   - **Chapter (Thư mục con)**: Là thư mục có thư mục cha (`parentId != null`). Chỉ được phép chứa File, không được chứa thư mục con (chiều sâu tối đa 2 cấp).
2. **Xem cây thư mục**: Vào chi tiết dự án, gọi `GET /api/projects/:id/folders`.
   - Có thể truyền query `type=ARC` để lấy danh sách các thư mục gốc, hoặc `type=CHAPTER` để lấy danh sách thư mục con.
   - Hoặc truyền `parentId` để lấy trực tiếp các Chapter của một ARC.
3. **Tạo thư mục**: Không cho phép tạo trực tiếp thông qua API. Để tạo thư mục (ARC hoặc Chapter), người dùng bắt buộc phải tạo Đơn duyệt (Application) loại `CREATE_ARC` hoặc `CREATE_CHAPTER` đính kèm bản thảo (materials) tương ứng thông qua API tạo đơn của dự án. Hệ thống sẽ tự động tạo thư mục sau khi đơn được duyệt qua 2 cấp (Dự án và Ban biên tập).
   - **Ràng buộc khi tạo Đơn**: Khi tạo đơn `CREATE_CHAPTER`, bắt buộc phải truyền `parentFolderId` hợp lệ (thuộc về một ARC - thư mục cha có `parentId` bằng null) để đảm bảo chiều sâu tối đa không vượt quá 2 cấp.

### 8.2 Quản lý File & Material (Phiên bản)
1. **Tải lên File/Material (Upload)**: Khi người dùng muốn cập nhật/thêm bản vẽ mới cho File, Frontend cần khởi tạo một đối tượng `FormData`, dùng `formData.append('file', fileObject)` để đính kèm file vật lý, sau đó gọi `POST /api/files/:id/materials` (sử dụng Content-Type `multipart/form-data`).
2. **Phản hồi Upload**: Backend sẽ tải file lên AWS S3 và tự động lưu URL vào CSDL. Nếu thành công (✅), giao diện sẽ hiển thị Toast thành công và load lại danh sách Materials. Nếu thất bại hoặc file quá 500MB (❌), hiển thị Toast thông báo lỗi từ backend.
3. **Khôi phục phiên bản**: Xem lịch sử version (Materials) của một File. Bấm Khôi phục -> Gọi `POST /api/materials/:id/restore` để đưa phiên bản cũ làm bản chính thức hiện tại.

## 9. Luồng Đánh dấu Khung hình (Frames Flow)

### 9.1 Vẽ Frame & Báo cáo lỗi
1. **Tạo Frame**: User mở một File hình ảnh, khoanh vùng (vẽ bounding box) -> Frontend tính toán tọa độ (x, y, width, height) -> Gọi `POST /api/files/:id/frames`.
2. **Tương tác**: Click vào vùng đã khoanh để xem chi tiết bình luận, hoặc gắn một Task mới trực tiếp vào vùng đó.

## 10. Luồng Bình luận Đa năng (Universal Comments Flow)

### 10.1 Thảo luận (Files, Tasks, Applications, Frames)
1. **Hiển thị**: Khi mở bất kỳ đối tượng nào hỗ trợ thảo luận, gọi `GET /api/<module>/:id/comments` (VD: `/api/files/:1/comments`).
2. **Nhắn tin**: Nhập text và gửi -> Gọi `POST /api/<module>/:id/comments`. Backend tự động gắn đúng `fileId`, `taskId`, v.v. dựa trên endpoint tương ứng.

## 11. Luồng Thống kê (Stats Flow)

### 11.1 Thống kê Dự án
1. **Xem tiến độ**: Gọi `GET /api/projects/:id/stats` để vẽ các biểu đồ tiến độ, số task hoàn thành, số đơn từ.

## 12. Luồng Lịch sử Hoạt động (Activity Logs Flow)

### 12.1 Theo dõi hoạt động
1. **Xem hoạt động**: Hiển thị dòng thời gian (timeline) các hành động của user (tạo/xóa file, comment, tạo task, v.v.). Gọi `GET /api/activity-logs` (hoặc API tương ứng của từng module như `GET /api/projects/:id/activity-logs`).
2. **Phản hồi**: Trả về danh sách được phân trang. Frontend render giao diện Feed.

## 13. Luồng Thông báo (Notifications Flow)

### 13.1 Nhận và đọc thông báo
1. **Lấy thông báo**: Lấy danh sách các thông báo của user hiện tại qua `GET /api/notifications`.
2. **Đánh dấu đã đọc**: User bấm vào 1 thông báo -> Gọi `PATCH /api/notifications/:id/read`. Bấm "Đọc tất cả" -> Gọi `PATCH /api/notifications/read-all`.
3. **Hiển thị**: Nếu API trả về thành công, cập nhật trạng thái UI (mất dấu chấm đỏ chưa đọc).

---

# API Endpoints Workflow


## Activity Logs

### Get my activity logs with pagination 
**GET** `/api/activity-logs`

#### Parameters
| Name | In | Required | Type | Description |
|------|----|----------|------|-------------|
| `page` | `query` | `No` | `number` |  |
| `limit` | `query` | `No` | `number` |  |

#### Responses
- **200**: Return paginated activity logs

---

## App

### Health check endpoint 
**GET** `/api`

#### Responses
- **200**: API is running

---

## Auth

### Register a new user 
**POST** `/api/auth/register`

#### Request Body
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | `string` | `Yes` |  |
| `password` | `string` | `Yes` |  |
| `displayName` | `string` | `Yes` |  |

#### Responses
- **201**: User registered successfully
- **409**: Email already exists

---

### Verify user email 
**POST** `/api/auth/verify-email`

#### Request Body
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `token` | `string` | `Yes` |  |

#### Responses
- **200**: Email verified successfully
- **400**: Invalid, expired, or already used verify email token

---

### Request password reset 
**POST** `/api/auth/forgot`

#### Request Body
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | `string` | `Yes` |  |

#### Responses
- **200**: Password reset email sent if email exists

---

### Reset password with token 
**POST** `/api/auth/reset`

#### Request Body
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `token` | `string` | `Yes` |  |
| `password` | `string` | `Yes` |  |

#### Responses
- **200**: Password reset successfully
- **400**: Invalid token or new password cannot be the same as old password

---

### Initiate Google OAuth 
**GET** `/api/auth/google`

#### Responses
- **200**: Redirects to Google OAuth

---

### Google OAuth callback 
**GET** `/api/auth/google/callback`

#### Responses
- **200**: Authentication successful

---

### Login with email and password 
**POST** `/api/auth/login`

#### Request Body
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | `string` | `Yes` |  |
| `password` | `string` | `Yes` |  |

#### Responses
- **200**: Login successful

---

### Refresh access token 
**POST** `/api/auth/refresh`

#### Responses
- **200**: Token refreshed successfully

---

### Logout user 
**POST** `/api/auth/logout`

#### Responses
- **200**: Logout successful

---

## Users

### Get current user profile 
**GET** `/api/users/me`

#### Responses
- **200**: User profile retrieved successfully

---

### Update current user profile 
**PATCH** `/api/users/me`

#### Request Body
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `displayName` | `string` | `No` |  |
| `avatarUrl` | `string` | `No` |  |

#### Responses
- **200**: Profile updated successfully

---

### Check if current user has password
**GET** `/api/users/me/has-password`

#### Responses
- **200**: Returns boolean indicating if user has password

---

### Create new password for current user
**POST** `/api/users/me/password`

#### Request Body
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `newPassword` | `string` | `Yes` | New password to set (minLength: 6) |

#### Responses
- **200**: Password created successfully
- **400**: User already has a password

---

### Update current user password 
**PATCH** `/api/users/me/password`

#### Request Body
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `currentPassword` | `string` | `Yes` |  |
| `newPassword` | `string` | `Yes` |  |

#### Responses
- **200**: Password updated successfully

---

### Initiate Google account linking 
**GET** `/api/users/me/link-account`

#### Responses
- **200**: Redirects to Google OAuth

---

### Google account linking callback 
**GET** `/api/users/me/link-account/callback`

#### Responses
- **200**: Account linked successfully

---

### Get user statistics (admin only) 
**GET** `/api/users/stats`

#### Responses
- **200**: Statistics retrieved successfully (Returns total, active, inactive, growthByMonth, and growthByYear)

---

### Get all users (admin only) 
**GET** `/api/users`

#### Parameters
| Name | In | Required | Type | Description |
|------|----|----------|------|-------------|
| `search` | `query` | `No` | `string` |  |
| `isActive` | `query` | `No` | `boolean` |  |
| `field` | `query` | `No` | `string` |  |
| `order` | `query` | `No` | `string` |  |
| `page` | `query` | `No` | `number` |  |
| `limit` | `query` | `No` | `number` |  |

#### Responses
- **200**: Users retrieved successfully
  
  **Response Schema:**
  | Field | Type | Description |
  |-------|------|-------------|
  | `data` | `array` |  |
  | `pagination` | `string` |  |


---

### Create staff user (admin only) 
**POST** `/api/users`

#### Request Body
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | `string` | `Yes` |  |
| `displayName` | `string` | `No` |  |
| `avatarUrl` | `string` | `No` |  |
| `password` | `string` | `No` |  |
| `roleIds` | `array` | `Yes` |  |

#### Responses
- **201**: User created successfully

---

### Get user roles 
**GET** `/api/users/{userId}/roles`

#### Parameters
| Name | In | Required | Type | Description |
|------|----|----------|------|-------------|
| `userId` | `path` | `Yes` | `number` | User ID |

#### Responses
- **200**: User roles retrieved successfully

---

### Append roles to user 
**POST** `/api/users/{userId}/roles`

#### Parameters
| Name | In | Required | Type | Description |
|------|----|----------|------|-------------|
| `userId` | `path` | `Yes` | `number` | User ID |

#### Request Body
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `roleIds` | `array` | `Yes` |  |

#### Responses
- **200**: Roles appended successfully

---

### Replace user roles 
**PUT** `/api/users/{userId}/roles`

#### Parameters
| Name | In | Required | Type | Description |
|------|----|----------|------|-------------|
| `userId` | `path` | `Yes` | `number` | User ID |

#### Request Body
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `roleIds` | `array` | `Yes` |  |

#### Responses
- **200**: Roles replaced successfully

---

### Get user projects 
**GET** `/api/users/{userId}/projects`

#### Parameters
| Name | In | Required | Type | Description |
|------|----|----------|------|-------------|
| `userId` | `path` | `Yes` | `number` | User ID |

#### Responses
- **200**: User projects retrieved successfully

---

### Get user editor boards 
**GET** `/api/users/{userId}/editor-boards`

#### Parameters
| Name | In | Required | Type | Description |
|------|----|----------|------|-------------|
| `userId` | `path` | `Yes` | `number` | User ID |

#### Responses
- **200**: User editor boards retrieved successfully

---

### Get user by ID 
**GET** `/api/users/{id}`

#### Parameters
| Name | In | Required | Type | Description |
|------|----|----------|------|-------------|
| `id` | `path` | `Yes` | `number` | User ID |

#### Responses
- **200**: User retrieved successfully

---

### Update user 
**PATCH** `/api/users/{id}`

#### Parameters
| Name | In | Required | Type | Description |
|------|----|----------|------|-------------|
| `id` | `path` | `Yes` | `number` | User ID |

#### Request Body
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | `string` | `No` |  |
| `displayName` | `string` | `No` |  |
| `avatarUrl` | `string` | `No` |  |
| `password` | `string` | `No` |  |
| `isActive` | `boolean` | `No` |  |

#### Responses
- **200**: User updated successfully

---

### Force reset user password (admin only) 
**POST** `/api/users/{id}/force-reset-password`

#### Parameters
| Name | In | Required | Type | Description |
|------|----|----------|------|-------------|
| `id` | `path` | `Yes` | `number` | User ID |

#### Responses
- **200**: Password reset successfully

---

## Roles

### Get all roles 
**GET** `/api/roles`

#### Responses
- **200**: Roles retrieved successfully

---

### Create a new role 
**POST** `/api/roles`

#### Request Body
| Field | Type | Required | Description |
|-------|------|----------|-------------|

#### Responses
- **200**: Role created successfully

---

### Get role by ID 
**GET** `/api/roles/{id}`

#### Parameters
| Name | In | Required | Type | Description |
|------|----|----------|------|-------------|
| `id` | `path` | `Yes` | `number` | Role ID |

#### Responses
- **200**: Role retrieved successfully

---

### Update role 
**PATCH** `/api/roles/{id}`

#### Parameters
| Name | In | Required | Type | Description |
|------|----|----------|------|-------------|
| `id` | `path` | `Yes` | `number` | Role ID |

#### Request Body
| Field | Type | Required | Description |
|-------|------|----------|-------------|

#### Responses
- **200**: Role updated successfully

---

### Delete role 
**DELETE** `/api/roles/{id}`

#### Parameters
| Name | In | Required | Type | Description |
|------|----|----------|------|-------------|
| `id` | `path` | `Yes` | `number` | Role ID |

#### Responses
- **200**: Role deleted successfully

---

### Get role permissions 
**GET** `/api/roles/{id}/permissions`

#### Parameters
| Name | In | Required | Type | Description |
|------|----|----------|------|-------------|
| `id` | `path` | `Yes` | `number` | Role ID |

#### Responses
- **200**: Role permissions retrieved successfully

---

### Replace role permissions 
**PUT** `/api/roles/{id}/permissions`

#### Parameters
| Name | In | Required | Type | Description |
|------|----|----------|------|-------------|
| `id` | `path` | `Yes` | `number` | Role ID |

#### Request Body
| Field | Type | Required | Description |
|-------|------|----------|-------------|

#### Responses
- **200**: Role permissions replaced successfully

---


## Notifications

### Get current user notifications 
**GET** `/api/notifications`

#### Responses
- **200**: Return list of notifications

---

### Get unread notification count 
**GET** `/api/notifications/unread-count`

#### Responses
- **200**: Return unread notifications count for the current user

---

### Mark a notification as read 
**PATCH** `/api/notifications/{id}/read`

#### Parameters
| Name | In | Required | Type | Description |
|------|----|----------|------|-------------|
| `id` | `path` | `Yes` | `number` | Notification ID |

#### Responses
- **200**: Return updated notification

---

### Mark all notifications as read 
**PATCH** `/api/notifications/read-all`

#### Responses
- **200**: Return success status

---

## Permissions

### Get all permissions 
**GET** `/api/permissions`

#### Responses
- **200**: 

---

### Get a specific permission by ID 
**GET** `/api/permissions/{id}`

#### Parameters
| Name | In | Required | Type | Description |
|------|----|----------|------|-------------|
| `id` | `path` | `Yes` | `number` | Permission ID |

#### Responses
- **200**: 
  
  **Response Schema:**
  | Field | Type | Description |
  |-------|------|-------------|


---

### Update a specific permission 
**PATCH** `/api/permissions/{id}`

#### Parameters
| Name | In | Required | Type | Description |
|------|----|----------|------|-------------|
| `id` | `path` | `Yes` | `number` | Permission ID |

#### Request Body
| Field | Type | Required | Description |
|-------|------|----------|-------------|

#### Responses
- **200**: 
  
  **Response Schema:**
  | Field | Type | Description |
  |-------|------|-------------|


---

### Get current user global permissions 
**GET** `/api/permissions/me/sys`

#### Responses
- **200**: 
  
  **Response Schema:**
  | Field | Type | Description |
  |-------|------|-------------|


---

### Get current user permissions for a specific project 
**GET** `/api/permissions/me/projects/{id}`

#### Parameters
| Name | In | Required | Type | Description |
|------|----|----------|------|-------------|
| `id` | `path` | `Yes` | `number` | Project ID |

#### Responses
- **200**: 
  
  **Response Schema:**
  | Field | Type | Description |
  |-------|------|-------------|


---

### Get current user permissions for a specific board 
**GET** `/api/permissions/me/boards/{id}`

#### Parameters
| Name | In | Required | Type | Description |
|------|----|----------|------|-------------|
| `id` | `path` | `Yes` | `number` | Board ID |

#### Responses
- **200**: 
  
  **Response Schema:**
  | Field | Type | Description |
  |-------|------|-------------|


---

## Projects

### Get projects 
**GET** `/api/projects`

#### Parameters
| Name | In | Required | Type | Description |
|------|----|----------|------|-------------|
| `name` | `query` | `No` | `string` |  |
| `me` | `query` | `No` | `boolean` |  |
| `field` | `query` | `No` | `string` |  |
| `order` | `query` | `No` | `string` |  |
| `page` | `query` | `No` | `number` |  |
| `limit` | `query` | `No` | `number` |  |

#### Responses
- **200**: Projects retrieved successfully
  
  **Response Schema:**
  | Field | Type | Description |
  |-------|------|-------------|
  | `data` | `array` |  (Note: Does not return members, use GET /api/projects/:id/members) |
  | `pagination` | `string` |  |


---

### Create project 
**POST** `/api/projects`

#### Request Body
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | `string` | `Yes` |  |
| `editorBoardId` | `number` | `No` |  |
| `description` | `string` | `No` |  |
| `imageUrl` | `string` | `No` |  |

#### Responses
- **201**: Project created successfully
- **403**: Forbidden if editorBoardId is provided and creator of board does not match creator of project
  
  **Response Schema:**
  | Field | Type | Description |
  |-------|------|-------------|
  | `data` | `string` |  |


---

### Get all tasks of current user in a specific project 
**GET** `/api/projects/{id}/tasks`

#### Parameters
| Name | In | Required | Type | Description |
|------|----|----------|------|-------------|
| `id` | `path` | `Yes` | `number` | Project id |
| `me` | `query` | `No` | `boolean` |  |
| `search` | `query` | `No` | `string` |  |
| `status` | `query` | `No` | `string` |  |
| `field` | `query` | `No` | `string` |  |
| `order` | `query` | `No` | `string` |  |
| `page` | `query` | `No` | `number` |  |
| `limit` | `query` | `No` | `number` |  |

#### Responses
- **200**: User tasks in project retrieved successfully
  
  **Response Schema:**
  | Field | Type | Description |
  |-------|------|-------------|
  | `data` | `array` |  |
  | `pagination` | `string` |  |


---

### Get project details 
**GET** `/api/projects/{id}`

#### Parameters
| Name | In | Required | Type | Description |
|------|----|----------|------|-------------|
| `id` | `path` | `Yes` | `number` | Project id |

#### Responses
- **200**: Project retrieved successfully
  
  **Response Schema:**
  | Field | Type | Description |
  |-------|------|-------------|
  | `data` | `string` |  |


---

### Update project 
**PATCH** `/api/projects/{id}`

#### Parameters
| Name | In | Required | Type | Description |
|------|----|----------|------|-------------|
| `id` | `path` | `Yes` | `number` | Project id |

#### Request Body
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | `string` | `No` |  |
| `description` | `string` | `No` |  |
| `imageUrl` | `string` | `No` |  |
| `editorBoardId` | `number` | `No` |  |

#### Responses
- **200**: Project updated successfully
- **403**: Forbidden if editorBoardId is provided and creator of board does not match creator of project
  
  **Response Schema:**
  | Field | Type | Description |
  |-------|------|-------------|
  | `data` | `string` |  |


---

### Delete project 
**DELETE** `/api/projects/{id}`

#### Parameters
| Name | In | Required | Type | Description |
|------|----|----------|------|-------------|
| `id` | `path` | `Yes` | `number` | Project id |

#### Responses
- **200**: Project deleted successfully

---

### Get project members 
**GET** `/api/projects/{id}/members`

#### Parameters
| Name | In | Required | Type | Description |
|------|----|----------|------|-------------|
| `id` | `path` | `Yes` | `number` | Project id |
| `search` | `query` | `No` | `string` |  |
| `field` | `query` | `No` | `string` |  |
| `order` | `query` | `No` | `string` |  |
| `page` | `query` | `No` | `number` |  |
| `limit` | `query` | `No` | `number` |  |

#### Responses
- **200**: Project members retrieved successfully
  
  **Response Schema:**
  | Field | Type | Description |
  |-------|------|-------------|
  | `data` | `array` |  |
  | `pagination` | `string` |  |


---

### Add members to project 
**POST** `/api/projects/{id}/members`

#### Parameters
| Name | In | Required | Type | Description |
|------|----|----------|------|-------------|
| `id` | `path` | `Yes` | `number` | Project id |

#### Request Body
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `userIds` | `array` | `Yes` |  |
| `roleId` | `number` | `Yes` |  |

#### Responses
- **201**: Members added successfully

---

### Get project member details 
**GET** `/api/projects/{id}/members/{userId}`

#### Parameters
| Name | In | Required | Type | Description |
|------|----|----------|------|-------------|
| `id` | `path` | `Yes` | `number` | Project id |
| `userId` | `path` | `Yes` | `number` | User id |

#### Responses
- **200**: Project member retrieved successfully
  
  **Response Schema:**
  | Field | Type | Description |
  |-------|------|-------------|
  | `data` | `string` |  |


---

### Update project member role 
**PATCH** `/api/projects/{id}/members/{userId}`

#### Parameters
| Name | In | Required | Type | Description |
|------|----|----------|------|-------------|
| `id` | `path` | `Yes` | `number` | Project id |
| `userId` | `path` | `Yes` | `number` | User id |

#### Request Body
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `roleId` | `number` | `Yes` |  |

#### Responses
- **200**: Project member updated successfully
  
  **Response Schema:**
  | Field | Type | Description |
  |-------|------|-------------|
  | `data` | `string` |  |


---

### Remove member from project 
**DELETE** `/api/projects/{id}/members/{userId}`

#### Parameters
| Name | In | Required | Type | Description |
|------|----|----------|------|-------------|
| `id` | `path` | `Yes` | `number` | Project id |
| `userId` | `path` | `Yes` | `number` | User id |

#### Responses
- **200**: Project member removed successfully

---

### Leave project 
**DELETE** `/api/projects/{id}/members/me`

#### Parameters
| Name | In | Required | Type | Description |
|------|----|----------|------|-------------|
| `id` | `path` | `Yes` | `number` | Project id |

#### Responses
- **200**: Successfully left the project

---

### Get project editor board 
**GET** `/api/projects/{id}/editor-boards`

#### Parameters
| Name | In | Required | Type | Description |
|------|----|----------|------|-------------|
| `id` | `path` | `Yes` | `number` | Project id |

#### Responses
- **200**: Project editor board retrieved successfully
  
  **Response Schema:**
  | Field | Type | Description |
  |-------|------|-------------|
  | `data` | `object` |  |


---

### Set project editor board 
**POST** `/api/projects/{id}/editor-boards`

#### Parameters
| Name | In | Required | Type | Description |
|------|----|----------|------|-------------|
| `id` | `path` | `Yes` | `number` | Project id |

#### Request Body
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `editorBoardId` | `number` | `Yes` |  |

#### Responses
- **200**: Project editor board updated successfully
  
  **Response Schema:**
  | Field | Type | Description |
  |-------|------|-------------|
  | `data` | `string` |  |


---

### Remove project editor board 
**DELETE** `/api/projects/{id}/editor-boards`

#### Parameters
| Name | In | Required | Type | Description |
|------|----|----------|------|-------------|
| `id` | `path` | `Yes` | `number` | Project id |

#### Responses
- **200**: Project editor board removed successfully
  
  **Response Schema:**
  | Field | Type | Description |
  |-------|------|-------------|
  | `data` | `string` |  |


---

### Get project applications 
**GET** `/api/projects/{id}/applications`

#### Parameters
| Name | In | Required | Type | Description |
|------|----|----------|------|-------------|
| `id` | `path` | `Yes` | `number` | Project id |
| `search` | `query` | `No` | `string` |  |
| `type` | `query` | `No` | `string` |  |
| `status` | `query` | `No` | `string` |  |
| `field` | `query` | `No` | `string` |  |
| `order` | `query` | `No` | `string` |  |
| `page` | `query` | `No` | `number` |  |
| `limit` | `query` | `No` | `number` |  |

#### Responses
- **200**: Project applications retrieved successfully
  
  **Response Schema:**
  | Field | Type | Description |
  |-------|------|-------------|
  | `data` | `array` |  |
  | `pagination` | `string` |  |


---

### Create project application 
**POST** `/api/projects/{id}/applications`

#### Parameters
| Name | In | Required | Type | Description |
|------|----|----------|------|-------------|
| `id` | `path` | `Yes` | `number` | Project id |

#### Request Body
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | `string` | `Yes` |  |
| `description` | `string` | `No` |  |
| `materials` | `object` | `Yes` |  |
| `type` | `string` | `Yes` | `PUBLISH_REQUEST`, `MANUSCRIPT_REVIEW`, `CREATE_ARC`, `CREATE_CHAPTER` |
| `parentFolderId` | `number` | `No` | Required for `CREATE_CHAPTER` type. Must be ID of an ARC (parentless folder) |

#### Responses
- **201**: Project application created successfully
  
  **Response Schema:**
  | Field | Type | Description |
  |-------|------|-------------|
  | `data` | `string` |  |


---

### Get project folders 
**GET** `/api/projects/{id}/folders`

#### Parameters
| Name | In | Required | Type | Description |
|------|----|----------|------|-------------|
| `id` | `path` | `Yes` | `number` | Project id |
| `search` | `query` | `No` | `string` |  |
| `parentId` | `query` | `No` | `number` |  |
| `field` | `query` | `No` | `string` |  |
| `order` | `query` | `No` | `string` |  |
| `page` | `query` | `No` | `number` |  |
| `limit` | `query` | `No` | `number` |  |

#### Responses
- **200**: Project folders retrieved successfully
  
  **Response Schema:**
  | Field | Type | Description |
  |-------|------|-------------|
  | `data` | `array` |  |
  | `pagination` | `string` |  |


---

---

---

### Create project folder 
**POST** `/api/projects/{id}/folders`

#### Parameters
| Name | In | Required | Type | Description |
|------|----|----------|------|-------------|
| `id` | `path` | `Yes` | `number` | Project id |

#### Responses
- **201**: Folder created successfully

---

### Get project activity logs 
**GET** `/api/projects/{id}/activity-logs`

#### Parameters
| Name | In | Required | Type | Description |
|------|----|----------|------|-------------|
| `id` | `path` | `Yes` | `number` | Project id |

#### Responses
- **200**: Activity logs retrieved successfully

---

### Get project stats 
**GET** `/api/projects/{id}/stats`

#### Parameters
| Name | In | Required | Type | Description |
|------|----|----------|------|-------------|
| `id` | `path` | `Yes` | `number` | Project id |

#### Responses
- **200**: Project stats retrieved successfully
  
  **Response Schema:**
  | Field | Type | Description |
  |-------|------|-------------|
  | `data` | `string` |  |


---

### Import project stats 
**POST** `/api/projects/{id}/stats`

#### Parameters
| Name | In | Required | Type | Description |
|------|----|----------|------|-------------|
| `id` | `path` | `Yes` | `number` | Project id |

#### Request Body
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `metrics` | `object` | `Yes` |  |

#### Responses
- **201**: Project stats imported successfully
  
  **Response Schema:**
  | Field | Type | Description |
  |-------|------|-------------|
  | `data` | `string` |  |


---

## Editor Boards

### Create editor board 
**POST** `/api/editor-boards`

#### Request Body
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | `string` | `Yes` |  |
| `description` | `string` | `No` |  |
| `imageUrl` | `string` | `No` |  |

#### Responses
- **201**: Editor board created successfully
  
  **Response Schema:**
  | Field | Type | Description |
  |-------|------|-------------|
  | `data` | `string` |  |


---

### Get editor boards 
**GET** `/api/editor-boards`

#### Parameters
| Name | In | Required | Type | Description |
|------|----|----------|------|-------------|
| `name` | `query` | `No` | `string` |  |
| `me` | `query` | `No` | `boolean` |  |
| `field` | `query` | `No` | `string` |  |
| `order` | `query` | `No` | `string` |  |
| `page` | `query` | `No` | `number` |  |
| `limit` | `query` | `No` | `number` |  |

#### Responses
- **200**: Editor boards retrieved successfully
  
  **Response Schema:**
  | Field | Type | Description |
  |-------|------|-------------|
  | `data` | `array` |  |
  | `pagination` | `string` |  |


---

### Get editor board details 
**GET** `/api/editor-boards/{id}`

#### Parameters
| Name | In | Required | Type | Description |
|------|----|----------|------|-------------|
| `id` | `path` | `Yes` | `number` | Editor board id |

#### Responses
- **200**: Editor board retrieved successfully
  
  **Response Schema:**
  | Field | Type | Description |
  |-------|------|-------------|
  | `data` | `string` |  |


---

### Delete editor board 
**DELETE** `/api/editor-boards/{id}`

#### Parameters
| Name | In | Required | Type | Description |
|------|----|----------|------|-------------|
| `id` | `path` | `Yes` | `number` | Editor board id |

#### Responses
- **200**: Editor board deleted successfully

---

### Update editor board 
**PATCH** `/api/editor-boards/{id}`

#### Parameters
| Name | In | Required | Type | Description |
|------|----|----------|------|-------------|
| `id` | `path` | `Yes` | `number` | Editor board id |

#### Request Body
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | `string` | `No` |  |
| `description` | `string` | `No` |  |
| `imageUrl` | `string` | `No` |  |

#### Responses
- **200**: Editor board updated successfully
  
  **Response Schema:**
  | Field | Type | Description |
  |-------|------|-------------|
  | `data` | `string` |  |


---

### Add members to editor board 
**POST** `/api/editor-boards/{id}/members`

#### Parameters
| Name | In | Required | Type | Description |
|------|----|----------|------|-------------|
| `id` | `path` | `Yes` | `number` | Editor board id |

#### Request Body
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `userIds` | `array` | `Yes` |  |

#### Responses
- **201**: Members added successfully

---

### Get editor board members 
**GET** `/api/editor-boards/{id}/members`

#### Parameters
| Name | In | Required | Type | Description |
|------|----|----------|------|-------------|
| `id` | `path` | `Yes` | `number` | Editor board id |
| `search` | `query` | `No` | `string` |  |
| `field` | `query` | `No` | `string` |  |
| `order` | `query` | `No` | `string` |  |
| `page` | `query` | `No` | `number` |  |
| `limit` | `query` | `No` | `number` |  |

#### Responses
- **200**: Editor board members retrieved successfully
  
  **Response Schema:**
  | Field | Type | Description |
  |-------|------|-------------|
  | `data` | `array` |  |
  | `pagination` | `string` |  |


---

### Get editor board member details 
**GET** `/api/editor-boards/{id}/members/{userId}`

#### Parameters
| Name | In | Required | Type | Description |
|------|----|----------|------|-------------|
| `id` | `path` | `Yes` | `number` | Editor board id |
| `userId` | `path` | `Yes` | `number` | User id |

#### Responses
- **200**: Editor board member retrieved successfully
  
  **Response Schema:**
  | Field | Type | Description |
  |-------|------|-------------|
  | `data` | `string` |  |


---

### Remove member from editor board 
**DELETE** `/api/editor-boards/{id}/members/{userId}`

#### Parameters
| Name | In | Required | Type | Description |
|------|----|----------|------|-------------|
| `id` | `path` | `Yes` | `number` | Editor board id |
| `userId` | `path` | `Yes` | `number` | User id |

#### Responses
- **200**: Member removed successfully

---

### Leave editor board 
**DELETE** `/api/editor-boards/{id}/members/me`

#### Parameters
| Name | In | Required | Type | Description |
|------|----|----------|------|-------------|
| `id` | `path` | `Yes` | `number` | Editor board id |

#### Responses
- **200**: Successfully left the board

---

### Set editor board member as lead 
**PATCH** `/api/editor-boards/{id}/members/{userId}/lead`

#### Parameters
| Name | In | Required | Type | Description |
|------|----|----------|------|-------------|
| `id` | `path` | `Yes` | `number` | Editor board id |
| `userId` | `path` | `Yes` | `number` | User id |

#### Responses
- **200**: Editor board member updated successfully
  
  **Response Schema:**
  | Field | Type | Description |
  |-------|------|-------------|
  | `data` | `string` |  |


---

### Get editor board projects 
**GET** `/api/editor-boards/{id}/projects`

#### Parameters
| Name | In | Required | Type | Description |
|------|----|----------|------|-------------|
| `id` | `path` | `Yes` | `number` | Editor board id |
| `search` | `query` | `No` | `string` |  |
| `field` | `query` | `No` | `string` |  |
| `order` | `query` | `No` | `string` |  |
| `page` | `query` | `No` | `number` |  |
| `limit` | `query` | `No` | `number` |  |

#### Responses
- **200**: Editor board projects retrieved successfully
  
  **Response Schema:**
  | Field | Type | Description |
  |-------|------|-------------|
  | `data` | `array` |  |
  | `pagination` | `string` |  |


---

### Add projects to editor board 
**POST** `/api/editor-boards/{id}/projects`

#### Parameters
| Name | In | Required | Type | Description |
|------|----|----------|------|-------------|
| `id` | `path` | `Yes` | `number` | Editor board id |

#### Request Body
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `projectIds` | `array` | `Yes` |  |

#### Responses
- **200**: Projects added successfully
  
  **Response Schema:**
  | Field | Type | Description |
  |-------|------|-------------|
  | `data` | `string` |  |


---

---

### Get editor board activity logs 
**GET** `/api/editor-boards/{id}/activity-logs`

#### Parameters
| Name | In | Required | Type | Description |
|------|----|----------|------|-------------|
| `id` | `path` | `Yes` | `number` | Editor board id |

#### Responses
- **200**: Activity logs retrieved successfully

---

### Get editor board applications 
**GET** `/api/editor-boards/{id}/applications`

#### Parameters
| Name | In | Required | Type | Description |
|------|----|----------|------|-------------|
| `id` | `path` | `Yes` | `number` | Editor board id |
| `search` | `query` | `No` | `string` |  |
| `field` | `query` | `No` | `string` |  |
| `order` | `query` | `No` | `string` |  |
| `page` | `query` | `No` | `number` |  |
| `limit` | `query` | `No` | `number` |  |

#### Responses
- **200**: Editor board applications retrieved successfully
  
  **Response Schema:**
  | Field | Type | Description |
  |-------|------|-------------|
  | `data` | `array` |  |
  | `pagination` | `string` |  |


---

## Applications

### Get application comments 
**GET** `/api/applications/{id}/comments`

#### Parameters
| Name | In | Required | Type | Description |
|------|----|----------|------|-------------|
| `id` | `path` | `Yes` | `number` | Application id |
| `field` | `query` | `No` | `string` |  |
| `order` | `query` | `No` | `string` |  |
| `page` | `query` | `No` | `number` |  |
| `limit` | `query` | `No` | `number` |  |

#### Responses
- **200**: Application comments retrieved successfully
  
  **Response Schema:**
  | Field | Type | Description |
  |-------|------|-------------|
  | `data` | `array` |  |
  | `pagination` | `string` |  |


---

### Create comment for application 
**POST** `/api/applications/{id}/comments`

#### Parameters
| Name | In | Required | Type | Description |
|------|----|----------|------|-------------|
| `id` | `path` | `Yes` | `number` | Application id |

#### Request Body
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `content` | `object` | `Yes` |  |

#### Responses
- **201**: Comment created successfully
  
  **Response Schema:**
  | Field | Type | Description |
  |-------|------|-------------|
  | `data` | `string` |  |


---

### Get applications 
**GET** `/api/applications`

#### Parameters
| Name | In | Required | Type | Description |
|------|----|----------|------|-------------|
| `projectId` | `query` | `No` | `number` |  |
| `search` | `query` | `No` | `string` |  |
| `type` | `query` | `No` | `string` |  |
| `status` | `query` | `No` | `string` |  |
| `field` | `query` | `No` | `string` |  |
| `order` | `query` | `No` | `string` |  |
| `page` | `query` | `No` | `number` |  |
| `limit` | `query` | `No` | `number` |  |

#### Responses
- **200**: Applications retrieved successfully
  
  **Response Schema:**
  | Field | Type | Description |
  |-------|------|-------------|
  | `data` | `array` |  |
  | `pagination` | `string` |  |


---

### Get application details 
**GET** `/api/applications/{id}`

#### Parameters
| Name | In | Required | Type | Description |
|------|----|----------|------|-------------|
| `id` | `path` | `Yes` | `number` | Application id |

#### Responses
- **200**: Application retrieved successfully
  
  **Response Schema:**
  | Field | Type | Description |
  |-------|------|-------------|
  | `data` | `string` |  |


---

### Update application 
**PATCH** `/api/applications/{id}`

#### Parameters
| Name | In | Required | Type | Description |
|------|----|----------|------|-------------|
| `id` | `path` | `Yes` | `number` | Application id |

#### Request Body
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | `string` | `No` |  |
| `description` | `string` | `No` |  |
| `materials` | `object` | `No` |  |

#### Responses
- **200**: Application updated successfully
  
  **Response Schema:**
  | Field | Type | Description |
  |-------|------|-------------|
  | `data` | `string` |  |


---

### Delete application 
**DELETE** `/api/applications/{id}`

#### Parameters
| Name | In | Required | Type | Description |
|------|----|----------|------|-------------|
| `id` | `path` | `Yes` | `number` | Application id |

#### Responses
- **200**: Application deleted successfully

---

### Update application status 
**PATCH** `/api/applications/{id}/status`

#### Parameters
| Name | In | Required | Type | Description |
|------|----|----------|------|-------------|
| `id` | `path` | `Yes` | `number` | Application id |

#### Request Body
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `status` | `string` | `Yes` |  |
| `voteDeadline` | `string` | `No` | Applicable only when status is SUBMITTED |
| `comment` | `string` | `No` | Comment to attach when updating status |

#### Responses
- **200**: Application status updated successfully (and auto-creates folder/file if Arc/Chapter is APPROVED, and creates comment if provided)
  
  **Response Schema:**
  | Field | Type | Description |
  |-------|------|-------------|
  | `data` | `string` |  |


---

### Get application votes 
**GET** `/api/applications/{id}/votes`

#### Parameters
| Name | In | Required | Type | Description |
|------|----|----------|------|-------------|
| `id` | `path` | `Yes` | `number` | Application id |

#### Responses
- **200**: Application votes retrieved successfully

---

### Cast a vote on application 
**POST** `/api/applications/{id}/votes`

#### Parameters
| Name | In | Required | Type | Description |
|------|----|----------|------|-------------|
| `id` | `path` | `Yes` | `number` | Application id |

#### Request Body
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `decision` | `string` | `Yes` |  |
| `comment` | `string` | `No` |  |

#### Responses
- **200**: Vote casted successfully
  
  **Response Schema:**
  | Field | Type | Description |
  |-------|------|-------------|
  | `applicationId` | `number` |  |
  | `userId` | `number` |  |
  | `decision` | `string` |  |
  | `comment` | `object` |  |
  | `createdAt` | `string` |  |
  | `updatedAt` | `string` |  |
  | `user` | `string` |  |


---

---

### Add a material item to application 
**POST** `/api/applications/{id}/materials/add`

#### Parameters
| Name | In | Required | Type | Description |
|------|----|----------|------|-------------|
| `id` | `path` | `Yes` | `number` | Application id |

#### Responses
- **200**: Application updated successfully

---

### Update a material item in application 
**PATCH** `/api/applications/{id}/materials/{index}`

#### Parameters
| Name | In | Required | Type | Description |
|------|----|----------|------|-------------|
| `id` | `path` | `Yes` | `number` | Application id |
| `index` | `path` | `Yes` | `number` | Index |

#### Responses
- **200**: Application updated successfully

---

### Delete a material item from application 
**DELETE** `/api/applications/{id}/materials/{index}`

#### Parameters
| Name | In | Required | Type | Description |
|------|----|----------|------|-------------|
| `id` | `path` | `Yes` | `number` | Application id |
| `index` | `path` | `Yes` | `number` | Index |

#### Responses
- **200**: Application updated successfully

---

## Folders

### Get folder details 
**GET** `/api/folders/{id}`

#### Parameters
| Name | In | Required | Type | Description |
|------|----|----------|------|-------------|
| `id` | `path` | `Yes` | `number` | Folder id |

#### Responses
- **200**: Folder retrieved successfully
  
  **Response Schema:**
  | Field | Type | Description |
  |-------|------|-------------|
  | `data` | `string` |  |


---

### Update folder 
**PATCH** `/api/folders/{id}`

#### Parameters
| Name | In | Required | Type | Description |
|------|----|----------|------|-------------|
| `id` | `path` | `Yes` | `number` | Folder id |

#### Request Body
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | `string` | `No` |  |
| `description` | `string` | `No` |  |

#### Responses
- **200**: Folder updated successfully
  
  **Response Schema:**
  | Field | Type | Description |
  |-------|------|-------------|
  | `data` | `string` |  |


---

### Delete folder 
**DELETE** `/api/folders/{id}`

#### Parameters
| Name | In | Required | Type | Description |
|------|----|----------|------|-------------|
| `id` | `path` | `Yes` | `number` | Folder id |

#### Responses
- **200**: Folder deleted successfully

---

### Get folder files 
**GET** `/api/folders/{id}/files`

#### Parameters
| Name | In | Required | Type | Description |
|------|----|----------|------|-------------|
| `id` | `path` | `Yes` | `number` | Folder id |
| `search` | `query` | `No` | `string` |  |
| `field` | `query` | `No` | `string` |  |
| `order` | `query` | `No` | `string` |  |
| `page` | `query` | `No` | `number` |  |
| `limit` | `query` | `No` | `number` |  |

#### Responses
- **200**: Folder files retrieved successfully
  
  **Response Schema:**
  | Field | Type | Description |
  |-------|------|-------------|
  | `data` | `array` |  |
  | `pagination` | `string` |  |


---

### Create file in folder 
**POST** `/api/folders/{id}/files`

#### Parameters
| Name | In | Required | Type | Description |
|------|----|----------|------|-------------|
| `id` | `path` | `Yes` | `number` | Folder id |

#### Request Body
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | `string` | `Yes` |  |
| `description` | `string` | `No` |  |

#### Responses
- **201**: File created successfully
  
  **Response Schema:**
  | Field | Type | Description |
  |-------|------|-------------|
  | `data` | `string` |  |


---

---

### Create child folder 
**POST** `/api/folders/{id}/children`

#### Parameters
| Name | In | Required | Type | Description |
|------|----|----------|------|-------------|
| `id` | `path` | `Yes` | `number` | Folder id |

#### Responses
- **201**: Child folder created successfully

---

### Get folder children 
**GET** `/api/folders/{id}/children`

#### Parameters
| Name | In | Required | Type | Description |
|------|----|----------|------|-------------|
| `id` | `path` | `Yes` | `number` | Folder id |
| `search` | `query` | `No` | `string` |  |
| `field` | `query` | `No` | `string` |  |
| `order` | `query` | `No` | `string` |  |
| `page` | `query` | `No` | `number` |  |
| `limit` | `query` | `No` | `number` |  |

#### Responses
- **200**: Folder children retrieved successfully
  
  **Response Schema:**
  | Field | Type | Description |
  |-------|------|-------------|
  | `data` | `array` |  |
  | `pagination` | `string` |  |


---

---

## Files

### Get file comments 
**GET** `/api/files/{id}/comments`

#### Parameters
| Name | In | Required | Type | Description |
|------|----|----------|------|-------------|
| `id` | `path` | `Yes` | `number` | File id |
| `field` | `query` | `No` | `string` |  |
| `order` | `query` | `No` | `string` |  |
| `page` | `query` | `No` | `number` |  |
| `limit` | `query` | `No` | `number` |  |

#### Responses
- **200**: File comments retrieved successfully
  
  **Response Schema:**
  | Field | Type | Description |
  |-------|------|-------------|
  | `data` | `array` |  |
  | `pagination` | `string` |  |


---

### Create comment for file 
**POST** `/api/files/{id}/comments`

#### Parameters
| Name | In | Required | Type | Description |
|------|----|----------|------|-------------|
| `id` | `path` | `Yes` | `number` | File id |

#### Request Body
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `content` | `object` | `Yes` |  |

#### Responses
- **201**: Comment created successfully
  
  **Response Schema:**
  | Field | Type | Description |
  |-------|------|-------------|
  | `data` | `string` |  |


---

### Get file details 
**GET** `/api/files/{id}`

#### Parameters
| Name | In | Required | Type | Description |
|------|----|----------|------|-------------|
| `id` | `path` | `Yes` | `number` | File id |

#### Responses
- **200**: File retrieved successfully
  
  **Response Schema:**
  | Field | Type | Description |
  |-------|------|-------------|
  | `data` | `string` |  |


---

### Update file 
**PATCH** `/api/files/{id}`

#### Parameters
| Name | In | Required | Type | Description |
|------|----|----------|------|-------------|
| `id` | `path` | `Yes` | `number` | File id |

#### Request Body
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | `string` | `No` |  |
| `description` | `string` | `No` |  |

#### Responses
- **200**: File updated successfully
  
  **Response Schema:**
  | Field | Type | Description |
  |-------|------|-------------|
  | `data` | `string` |  |


---

### Delete file 
**DELETE** `/api/files/{id}`

#### Parameters
| Name | In | Required | Type | Description |
|------|----|----------|------|-------------|
| `id` | `path` | `Yes` | `number` | File id |

#### Responses
- **200**: File deleted successfully

---

### Get file material versions 
**GET** `/api/files/{id}/versions`

#### Parameters
| Name | In | Required | Type | Description |
|------|----|----------|------|-------------|
| `id` | `path` | `Yes` | `number` | File id |
| `page` | `query` | `No` | `number` |  |
| `limit` | `query` | `No` | `number` |  |

#### Responses
- **200**: File material versions retrieved successfully
  
  **Response Schema:**
  | Field | Type | Description |
  |-------|------|-------------|
  | `data` | `array` |  |
  | `pagination` | `string` |  |


---

### Get file materials 
**GET** `/api/files/{id}/materials`

#### Parameters
| Name | In | Required | Type | Description |
|------|----|----------|------|-------------|
| `id` | `path` | `Yes` | `number` | File id |

#### Responses
- **200**: File materials retrieved successfully
  
  **Response Schema:**
  | Field | Type | Description |
  |-------|------|-------------|
  | `data` | `string` |  |


---

### Create material for file 
**POST** `/api/files/{id}/materials`

#### Parameters
| Name | In | Required | Type | Description |
|------|----|----------|------|-------------|
| `id` | `path` | `Yes` | `number` | File id |

#### Request Body
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `file` | `binary` | `Yes` | File vật lý (Hỗ trợ ảnh, pdf, psd, tối đa 500MB) truyền dưới dạng `multipart/form-data` |

#### Responses
- **201**: Material created successfully (Uploaded to AWS S3 & Saved to DB)
- **400**: File type not allowed or File too large
- **500**: Lỗi `SVCREATEMATERIAL` khi server upload lên AWS S3 thất bại.
- **201**: Material created successfully
  
  **Response Schema:**
  | Field | Type | Description |
  |-------|------|-------------|
  | `data` | `string` |  |


---

### Get file tasks 
**GET** `/api/files/{id}/tasks`

#### Parameters
| Name | In | Required | Type | Description |
|------|----|----------|------|-------------|
| `id` | `path` | `Yes` | `number` | File id |
| `search` | `query` | `No` | `string` |  |
| `status` | `query` | `No` | `string` |  |
| `field` | `query` | `No` | `string` |  |
| `order` | `query` | `No` | `string` |  |
| `page` | `query` | `No` | `number` |  |
| `limit` | `query` | `No` | `number` |  |

#### Responses
- **200**: File tasks retrieved successfully
  
  **Response Schema:**
  | Field | Type | Description |
  |-------|------|-------------|
  | `data` | `array` |  |
  | `pagination` | `string` |  |


---

### Create task for file 
**POST** `/api/files/{id}/tasks`

#### Parameters
| Name | In | Required | Type | Description |
|------|----|----------|------|-------------|
| `id` | `path` | `Yes` | `number` | File id |

#### Request Body
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | `string` | `Yes` |  |
| `description` | `string` | `No` |  |
| `status` | `string` | `No` |  |
| `deadline` | `string` | `No` |  |
| `parentId` | `number` | `No` |  |
| `assignedBy` | `number` | `No` |  |

#### Responses
- **201**: Task created successfully
  
  **Response Schema:**
  | Field | Type | Description |
  |-------|------|-------------|
  | `data` | `string` |  |


---

---

### Get file activity logs 
**GET** `/api/files/{id}/activity-logs`

#### Parameters
| Name | In | Required | Type | Description |
|------|----|----------|------|-------------|
| `id` | `path` | `Yes` | `number` | File id |

#### Responses
- **200**: Activity logs retrieved successfully

---

## Materials

### Get material details 
**GET** `/api/materials/{id}`

#### Parameters
| Name | In | Required | Type | Description |
|------|----|----------|------|-------------|
| `id` | `path` | `Yes` | `number` | Material id |

#### Responses
- **200**: Material retrieved successfully
  
  **Response Schema:**
  | Field | Type | Description |
  |-------|------|-------------|
  | `data` | `string` |  |


---

### Update material 
**PATCH** `/api/materials/{id}`

#### Parameters
| Name | In | Required | Type | Description |
|------|----|----------|------|-------------|
| `id` | `path` | `Yes` | `number` | Material id |
| `deleteImage` | `query` | `No` | `boolean` | Flag to delete IMAGE slot |
| `deleteText` | `query` | `No` | `boolean` | Flag to delete TEXT slot |
| `deleteSource` | `query` | `No` | `boolean` | Flag to delete SOURCE slot |

#### Request Body
`Content-Type: multipart/form-data`
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `image` | `file` | `No` | Image material file |
| `text` | `file` | `No` | Text material file |
| `source` | `file` | `No` | Source material file |

#### Responses
- **200**: Material updated successfully (creates a new version)
  
  **Response Schema:**
  | Field | Type | Description |
  |-------|------|-------------|
  | `data` | `string` |  |


---

### Delete material 
**DELETE** `/api/materials/{id}`

#### Parameters
| Name | In | Required | Type | Description |
|------|----|----------|------|-------------|
| `id` | `path` | `Yes` | `number` | Material id |

#### Responses
- **200**: Material deleted successfully

---

### Restore material to a previous version
**POST** `/api/materials/{id}/restore`

#### Parameters
| Name | In | Required | Type | Description |
|------|----|----------|------|-------------|
| `id` | `path` | `Yes` | `number` | Material id (the version to restore to) |

#### Responses
- **200**: Material restored successfully
  
  **Response Schema:**
  | Field | Type | Description |
  |-------|------|-------------|
  | `data` | `string` |  |

*Note: This operation deletes all materials (along with their frames and comments) that are newer than the specified material version.*


---



## Tasks

### Get task comments 
**GET** `/api/tasks/{id}/comments`

#### Parameters
| Name | In | Required | Type | Description |
|------|----|----------|------|-------------|
| `id` | `path` | `Yes` | `number` | Task id |
| `field` | `query` | `No` | `string` |  |
| `order` | `query` | `No` | `string` |  |
| `page` | `query` | `No` | `number` |  |
| `limit` | `query` | `No` | `number` |  |

#### Responses
- **200**: Task comments retrieved successfully
  
  **Response Schema:**
  | Field | Type | Description |
  |-------|------|-------------|
  | `data` | `array` |  |
  | `pagination` | `string` |  |


---

### Create comment for task 
**POST** `/api/tasks/{id}/comments`

#### Parameters
| Name | In | Required | Type | Description |
|------|----|----------|------|-------------|
| `id` | `path` | `Yes` | `number` | Task id |

#### Request Body
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `content` | `object` | `Yes` |  |

#### Responses
- **201**: Comment created successfully
  
  **Response Schema:**
  | Field | Type | Description |
  |-------|------|-------------|
  | `data` | `string` |  |


---

### Get all tasks of current user across all projects 
**GET** `/api/tasks`

#### Parameters
| Name | In | Required | Type | Description |
|------|----|----------|------|-------------|
| `me` | `query` | `No` | `boolean` |  |
| `search` | `query` | `No` | `string` |  |
| `status` | `query` | `No` | `string` |  |
| `field` | `query` | `No` | `string` |  |
| `order` | `query` | `No` | `string` |  |
| `page` | `query` | `No` | `number` |  |
| `limit` | `query` | `No` | `number` |  |

#### Responses
- **200**: User tasks retrieved successfully
  
  **Response Schema:**
  | Field | Type | Description |
  |-------|------|-------------|
  | `data` | `array` |  |
  | `pagination` | `string` |  |


---

### Get task details 
**GET** `/api/tasks/{id}`

#### Parameters
| Name | In | Required | Type | Description |
|------|----|----------|------|-------------|
| `id` | `path` | `Yes` | `number` | Task id |

#### Responses
- **200**: Task retrieved successfully
  
  **Response Schema:**
  | Field | Type | Description |
  |-------|------|-------------|
  | `data` | `string` |  |

#### Ràng buộc
- Yêu cầu xác thực JWT. Người dùng phải có quyền `project:owner`.

---

### Update task 
**PATCH** `/api/tasks/{id}`

#### Parameters
| Name | In | Required | Type | Description |
|------|----|----------|------|-------------|
| `id` | `path` | `Yes` | `number` | Task id |

#### Request Body
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | `string` | `No` |  |
| `description` | `string` | `No` |  |
| `status` | `string` | `No` |  |
| `deadline` | `string` | `No` |  |
| `parentId` | `number` | `No` |  |
| `assignedBy` | `number` | `No` |  |

#### Responses
- **200**: Task updated successfully
  
  **Response Schema:**
  | Field | Type | Description |
  |-------|------|-------------|
  | `data` | `string` |  |

#### Ràng buộc
- Yêu cầu xác thực JWT. Người dùng phải có quyền `project:owner`.

---

### Delete task 
**DELETE** `/api/tasks/{id}`

#### Parameters
| Name | In | Required | Type | Description |
|------|----|----------|------|-------------|
| `id` | `path` | `Yes` | `number` | Task id |

#### Responses
- **200**: Task deleted successfully

#### Ràng buộc
- Yêu cầu xác thực JWT. Người dùng phải có quyền `project:owner`.

---

### Get task children 
**GET** `/api/tasks/{id}/children`

#### Parameters
| Name | In | Required | Type | Description |
|------|----|----------|------|-------------|
| `id` | `path` | `Yes` | `number` | Task id |
| `search` | `query` | `No` | `string` |  |
| `status` | `query` | `No` | `string` |  |
| `field` | `query` | `No` | `string` |  |
| `order` | `query` | `No` | `string` |  |
| `page` | `query` | `No` | `number` |  |
| `limit` | `query` | `No` | `number` |  |

#### Responses
- **200**: Task children retrieved successfully
  
  **Response Schema:**
  | Field | Type | Description |
  |-------|------|-------------|
  | `data` | `array` |  |
  | `pagination` | `string` |  |


---

### Get task frames 
**GET** `/api/tasks/{id}/frames`

#### Parameters
| Name | In | Required | Type | Description |
|------|----|----------|------|-------------|
| `id` | `path` | `Yes` | `number` | Task id |
| `field` | `query` | `No` | `string` |  |
| `order` | `query` | `No` | `string` |  |
| `page` | `query` | `No` | `number` |  |
| `limit` | `query` | `No` | `number` |  |

#### Responses
- **200**: Task frames retrieved successfully
  
  **Response Schema:**
  | Field | Type | Description |
  |-------|------|-------------|
  | `data` | `array` |  |
  | `pagination` | `string` |  |


---

### Create frame for task 
**POST** `/api/tasks/{id}/frames`

#### Parameters
| Name | In | Required | Type | Description |
|------|----|----------|------|-------------|
| `id` | `path` | `Yes` | `number` | Task id |

#### Request Body
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `startX` | `number` | `Yes` |  |
| `startY` | `number` | `Yes` |  |
| `endX` | `number` | `Yes` |  |
| `endY` | `number` | `Yes` |  |

#### Responses
- **201**: Frame created successfully
  
  **Response Schema:**
  | Field | Type | Description |
  |-------|------|-------------|
  | `data` | `string` |  |


---

---

### Get task materials for select 
**GET** `/api/tasks/{id}/materials`

#### Parameters
| Name | In | Required | Type | Description |
|------|----|----------|------|-------------|
| `id` | `path` | `Yes` | `number` | Task id |

#### Responses
- **200**: Task materials for select retrieved successfully

---

## Frames

### Get frame details 
**GET** `/api/frames/{id}`

#### Parameters
| Name | In | Required | Type | Description |
|------|----|----------|------|-------------|
| `id` | `path` | `Yes` | `number` | Frame id |

#### Responses
- **200**: Frame retrieved successfully
  
  **Response Schema:**
  | Field | Type | Description |
  |-------|------|-------------|
  | `data` | `string` |  |


---

### Update frame 
**PATCH** `/api/frames/{id}`

#### Parameters
| Name | In | Required | Type | Description |
|------|----|----------|------|-------------|
| `id` | `path` | `Yes` | `number` | Frame id |

#### Request Body
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `startX` | `number` | `No` |  |
| `startY` | `number` | `No` |  |
| `endX` | `number` | `No` |  |
| `endY` | `number` | `No` |  |

#### Responses
- **200**: Frame updated successfully
  
  **Response Schema:**
  | Field | Type | Description |
  |-------|------|-------------|
  | `data` | `string` |  |


---

### Delete frame 
**DELETE** `/api/frames/{id}`

#### Parameters
| Name | In | Required | Type | Description |
|------|----|----------|------|-------------|
| `id` | `path` | `Yes` | `number` | Frame id |

#### Responses
- **200**: Frame deleted successfully

---

### Get frame comments 
**GET** `/api/frames/{id}/comments`

#### Parameters
| Name | In | Required | Type | Description |
|------|----|----------|------|-------------|
| `id` | `path` | `Yes` | `number` | Frame id |
| `field` | `query` | `No` | `string` |  |
| `order` | `query` | `No` | `string` |  |
| `page` | `query` | `No` | `number` |  |
| `limit` | `query` | `No` | `number` |  |

#### Responses
- **200**: Frame comments retrieved successfully
  
  **Response Schema:**
  | Field | Type | Description |
  |-------|------|-------------|
  | `data` | `array` |  |
  | `pagination` | `string` |  |


---

### Create comment for frame 
**POST** `/api/frames/{id}/comments`

#### Parameters
| Name | In | Required | Type | Description |
|------|----|----------|------|-------------|
| `id` | `path` | `Yes` | `number` | Frame id |

#### Request Body
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `content` | `object` | `Yes` |  |

#### Responses
- **201**: Comment created successfully
  
  **Response Schema:**
  | Field | Type | Description |
  |-------|------|-------------|
  | `data` | `string` |  |


---

## Project Stats

### Get project stat details 
**GET** `/api/project-stats/{id}`

#### Parameters
| Name | In | Required | Type | Description |
|------|----|----------|------|-------------|
| `id` | `path` | `Yes` | `number` | Project stat id |

#### Responses
- **200**: Project stat retrieved successfully
  
  **Response Schema:**
  | Field | Type | Description |
  |-------|------|-------------|
  | `data` | `string` |  |


---

### Update project stat 
**PATCH** `/api/project-stats/{id}`

#### Parameters
| Name | In | Required | Type | Description |
|------|----|----------|------|-------------|
| `id` | `path` | `Yes` | `number` | Project stat id |

#### Request Body
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `metrics` | `object` | `Yes` |  |

#### Responses
- **200**: Project stat updated successfully
  
  **Response Schema:**
  | Field | Type | Description |
  |-------|------|-------------|
  | `data` | `string` |  |


---

### Delete project stat 
**DELETE** `/api/project-stats/{id}`

#### Parameters
| Name | In | Required | Type | Description |
|------|----|----------|------|-------------|
| `id` | `path` | `Yes` | `number` | Project stat id |

#### Responses
- **200**: Project stat deleted successfully

---

## Notifications

### 1. Chi tiết các Endpoints

#### Get current user notifications
- **URL**: `GET /api/notifications`
- **Chức năng**: Lấy danh sách các thông báo của người dùng hiện tại, bao gồm chi tiết của `ActivityLog` và `Actor` (người tạo ra hành động).
- **Input**: Không yêu cầu (Lấy `userId` từ JWT).
- **Output**: JSON chứa mảng `Notification` `200 OK`.
- **Ràng buộc**: Yêu cầu xác thực JWT.

#### Mark a notification as read
- **URL**: `PATCH /api/notifications/{id}/read`
- **Chức năng**: Đánh dấu một thông báo cụ thể là đã đọc.
- **Input**: 
  - `id` (Path param): ID của thông báo.
- **Output**: JSON chứa thông báo đã được cập nhật `200 OK`.
- **Lỗi thường gặp**: `500 Internal Server Error` (nếu thông báo không tồn tại hoặc không thuộc về người dùng hiện tại).
- **Ràng buộc**: Thông báo phải thuộc về `userId` đang truy cập.

#### Mark all notifications as read
- **URL**: `PATCH /api/notifications/read-all`
- **Chức năng**: Đánh dấu tất cả thông báo của người dùng hiện tại là đã đọc.
- **Input**: Không yêu cầu.
- **Output**: JSON `{ "success": true }` `200 OK`.
- **Ràng buộc**: Áp dụng cho tất cả thông báo chưa đọc (`isRead: false`) của user hiện tại.

### 2. Frontend Flow (Luồng phối hợp các Màn hình)

- **Trang hiện tại**: Bất kỳ trang nào có biểu tượng "Chuông" (thông báo) trên Navbar.
- **Hành động của người dùng**:
  1. Khi người dùng truy cập trang lần đầu, hệ thống gọi `GET /api/notifications` để lấy danh sách thông báo và số lượng chưa đọc.
  2. Người dùng nhấn vào biểu tượng "Chuông" để mở menu thông báo.
  3. Khi click vào một thông báo chưa đọc, hệ thống gọi `PATCH /api/notifications/{id}/read`.
  4. Nếu click "Đánh dấu tất cả là đã đọc", hệ thống gọi `PATCH /api/notifications/read-all`.
- **Phản hồi của Frontend**:
  - `Thành công (✅)`: Giao diện giảm số lượng thông báo chưa đọc xuống. CSS của thông báo sẽ chuyển từ in đậm (chưa đọc) sang bình thường.
  - Ngoài ra, Frontend cần kết nối WebSocket (`socket.on('notification:new')`) qua namespace `/realtime` để realtime nhận thông báo mới và tự động cập nhật list/toast mà không cần reload trang.

---

## Activity Logs

### 1. Chi tiết các Endpoints

#### 1. Lấy hoạt động cá nhân (Personal Activity Logs)
- **URL**: `GET /api/activity-logs`
- **Chức năng**: Lấy danh sách lịch sử hoạt động của người dùng đang đăng nhập.
- **Input**:
  - `page` (Query, optional): Trang hiện tại (Mặc định: 1).
  - `limit` (Query, optional): Số lượng item trên một trang (Mặc định: 20).
- **Output**: JSON `200 OK`.
- **Ràng buộc**: Yêu cầu xác thực JWT. Bất kỳ user nào đăng nhập đều gọi được.

#### 2. Lấy hoạt động của Dự án (Project Activity Logs)
- **URL**: `GET /api/projects/:id/activity-logs`
- **Chức năng**: Lấy lịch sử hoạt động của một dự án cụ thể.
- **Input**: `id` (Param) - ID dự án. `page`, `limit` (Query).
- **Output**: JSON `200 OK`.
- **Ràng buộc**: Yêu cầu xác thực JWT. Người dùng phải có quyền `project:read` hoặc `project:owner`.

#### 3. Lấy hoạt động của Ban biên tập (Editor Board Activity Logs)
- **URL**: `GET /api/editor-boards/:id/activity-logs`
- **Chức năng**: Lấy lịch sử hoạt động của một bảng biên tập cụ thể.
- **Input**: `id` (Param) - ID bảng biên tập. `page`, `limit` (Query).
- **Output**: JSON `200 OK`.
- **Ràng buộc**: Yêu cầu xác thực JWT. Người dùng phải có quyền `board:leader`, `board:member`, hoặc `board:owner`.

### 2. Frontend Flow (Luồng phối hợp các Màn hình)

- **Trang hiện tại**: Màn hình Chi tiết Dự án (Project Details) hoặc Chi tiết Bảng (Board Details) - Tab "Lịch sử hoạt động" (Activity).
- **Hành động của người dùng**:
  1. Khi mở tab Activity trong Dự án, Frontend gọi `GET /api/projects/:id/activity-logs`.
  2. Khi mở tab Activity trong Ban biên tập, Frontend gọi `GET /api/editor-boards/:id/activity-logs`.
  3. Khi xem hoạt động cá nhân ở trang Profile, Frontend gọi `GET /api/activity-logs`.
  4. Khi scroll xuống cuối danh sách, Frontend gọi tiếp API với `page` tăng lên để load more.
- **Phản hồi của Frontend**:
  - `Thành công (✅)`: Render danh sách dạng Timeline hiển thị nội dung `Ai (actor)` đã làm `hành động gì (action)` vào `lúc nào (createdAt)`.
  - Để cập nhật thời gian thực, Frontend cần `socket.emit('project:subscribe', { projectId: X })` khi vào trang, và lắng nghe `socket.on('activity:new')`. Khi nhận sự kiện này, prepend (thêm vào đầu) activity mới vào danh sách hiện tại. Khi rời trang, gọi `socket.emit('project:unsubscribe')`.
