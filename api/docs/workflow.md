# Luồng Xác thực (Authentication Workflow)

Tài liệu này mô tả chi tiết các API Endpoints liên quan đến xác thực người dùng trong `AuthController` (`api/src/auth/auth.controller.ts`), cùng với cách phối hợp luồng dữ liệu (Flow) giữa các màn hình phía Frontend.

---

## 1. Chi tiết các Endpoints

### 1.1 Đăng ký (Register)
- **URL**: `POST /api/auth/register`
- **Chức năng**: Tạo tài khoản người dùng mới và gửi email xác thực.
- **Input (Body)**: `RegisterDto` 
  - `email` (string, valid email)
  - `password` (string, min 6 ký tự)
  - `displayName` (string, min 5 ký tự)
- **Output**: `201 Created` (Không có body trả về).
- **Lỗi thường gặp**:
  - `400 Bad Request`: Lỗi định dạng dữ liệu đầu vào.
  - `409 Conflict`: Email đã tồn tại trong hệ thống.
- **Ràng buộc**: Hệ thống bắt lỗi ở tầng cơ sở dữ liệu (Unique Constraint) để chống Race Condition. Tài khoản mới tạo có trạng thái `isActive = false` và được gán role mặc định.

### 1.2 Xác thực Email (Verify Email)
- **URL**: `POST /api/auth/verify-email`
- **Chức năng**: Kích hoạt tài khoản người dùng thông qua mã xác thực (Token).
- **Input (Body)**: `VerifyEmailDto`
  - `token` (string - lấy từ đường link gửi vào email)
- **Output**: `200 OK`
- **Lỗi thường gặp**:
  - `400 Bad Request`: Token không hợp lệ, đã hết hạn, hoặc đã được sử dụng trước đó.
- **Ràng buộc**: Token chỉ dùng được 1 lần. Kích hoạt xong, token sẽ bị xóa khỏi hệ thống.

### 1.3 Quên mật khẩu (Forgot Password)
- **URL**: `POST /api/auth/forgot`
- **Chức năng**: Gửi email chứa đường dẫn khôi phục mật khẩu.
- **Input (Body)**: `ForgotPasswordDto`
  - `email` (string)
- **Output**: `200 OK` (Luôn trả về thành công để tránh dò quét email).
- **Ràng buộc**: Không tiết lộ email có thực sự tồn tại trong hệ thống hay không. Nếu email đúng, hệ thống sẽ âm thầm tạo token và gửi thư.

### 1.4 Đặt lại mật khẩu (Reset Password)
- **URL**: `POST /api/auth/reset`
- **Chức năng**: Đổi mật khẩu mới dựa vào Token khôi phục mật khẩu.
- **Input (Body)**: `ResetPasswordDto`
  - `token` (string - lấy từ đường link gửi vào email)
  - `password` (string - mật khẩu mới)
- **Output**: `200 OK`
- **Lỗi thường gặp**:
  - `400 Bad Request`: Token hết hạn, không hợp lệ, hoặc mật khẩu mới giống hệt mật khẩu cũ.
- **Ràng buộc**: Đổi mật khẩu thành công sẽ tự động **đăng xuất tài khoản này khỏi tất cả thiết bị khác** (bằng cách xóa toàn bộ Refresh Token cũ).

### 1.5 Đăng nhập (Login)
- **URL**: `POST /api/auth/login`
- **Chức năng**: Đăng nhập bằng Email và Password.
- **Input (Body)**: `LoginDto`
  - `email` (string)
  - `password` (string)
- **Output**: `200 OK`
  - Trả về JSON: `{ "accessToken": "..." }`
  - Trả về Cookie (HttpOnly): `refreshToken`
- **Lỗi thường gặp**:
  - `401 Unauthorized`: Sai thông tin đăng nhập.
- **Ràng buộc**: Tài khoản bắt buộc phải có `isActive = true`. Lỗi tài khoản chưa kích hoạt được gộp chung vào lỗi sai thông tin đăng nhập để chống dò quét trạng thái.

### 1.6 Xin cấp lại Token (Refresh Token)
- **URL**: `POST /api/auth/refresh`
- **Chức năng**: Sinh cặp Token mới khi Access Token hết hạn.
- **Input**: 
  - Đọc `refreshToken` từ HttpOnly Cookie (ưu tiên) hoặc từ Body.
- **Output**: `200 OK`
  - Trả về JSON: `{ "accessToken": "..." }`
  - Trả về Cookie (HttpOnly): `refreshToken` mới.
- **Lỗi thường gặp**:
  - `401 Unauthorized`: Refresh Token không hợp lệ hoặc đã hết hạn.
- **Ràng buộc**: Áp dụng cơ chế xoay vòng (Refresh Token Rotation). Mỗi Refresh Token chỉ dùng được 1 lần và sẽ bị thay thế bằng Token mới.

### 1.7 Đăng nhập Google (Google OAuth)
- **URL**: `GET /api/auth/google` và Callback: `GET /api/auth/google/callback`
- **Chức năng**: Đăng nhập bằng tài khoản Google.
- **Input**: Redirect URL OAuth từ Google.
- **Output**: `302 Redirect` về URL thành công của Frontend kèm Cookie `refreshToken` (nếu liên kết thành công). Trả về Access Token qua URL/Cookie tùy cấu hình.
- **Ràng buộc**: Nếu email Google đã tồn tại trong hệ thống nhưng chưa kích hoạt, hệ thống sẽ tự động liên kết tài khoản.

### 1.8 Đăng xuất (Logout)
- **URL**: `POST /api/auth/logout`
- **Chức năng**: Vô hiệu hóa Token và kết thúc phiên đăng nhập.
- **Input**: 
  - Lấy Access Token từ Header `Authorization`.
  - Lấy Refresh Token từ Cookie hoặc Body.
- **Output**: `204 No Content` (Không có body).
- **Ràng buộc**: Xóa bỏ Refresh Token hiện tại khỏi DB và đưa Access Token vào bảng Blacklist.

---

## 2. Frontend Flow (Luồng phối hợp các Màn hình)

Dưới đây là cách Frontend gọi API và điều hướng màn hình sao cho UX mượt mà và logic nhất.

### 2.1 Luồng Đăng ký tài khoản (Register Flow)
1. **Màn hình Đăng ký (`/register`)**:
   - User điền form. Bấm Submit.
   - Gọi API `POST /api/auth/register`.
   - ✅ Nếu thành công: Chuyển hướng (Navigate) sang **Màn hình Thông báo Check Email**.
   - ❌ Nếu lỗi 409: Hiển thị thông báo "Email đã được sử dụng".
2. **Hành động ở Email**:
   - User mở hòm thư, bấm vào nút/link kích hoạt.
   - Link này trỏ về Frontend, dạng như: `https://domain.com/verify-email?token=xyz...`
3. **Màn hình Xác thực (`/verify-email`)**:
   - Trình duyệt load trang. Logic (ví dụ useEffect ở React) lấy tham số `token` trên URL.
   - Lập tức gọi API `POST /api/auth/verify-email`.
   - ✅ Thành công: Hiển thị thông báo "Tài khoản kích hoạt thành công" kèm nút bấm chuyển về **Màn hình Đăng nhập**.
   - ❌ Lỗi 400: Hiển thị thông báo "Link xác thực không hợp lệ, hết hạn hoặc đã được sử dụng".

### 2.2 Luồng Đăng nhập và Duy trì phiên (Login & Session Flow)
1. **Màn hình Đăng nhập (`/login`)**:
   - User điền Email, Password.
   - Gọi API `POST /api/auth/login`.
   - ❌ Lỗi 401: Hiển thị lỗi "Thông tin đăng nhập không chính xác".
   - ✅ Thành công: Frontend lưu `accessToken` vào Memory (hoặc Local Storage tùy chiến lược). Cookie `refreshToken` được trình duyệt tự động giữ và gửi đi trong các request sau.
   - Chuyển hướng sang **Trang Chủ / Bảng điều khiển (Dashboard)**.
2. **Phiên hết hạn ngầm (Axios Interceptor)**:
   - Khi Access Token hết hạn, gọi các API dữ liệu (vd: `/users/me`) sẽ bị lỗi 401.
   - Frontend Interceptor tự động chặn lỗi 401 lại, gọi ngầm API `POST /api/auth/refresh`.
   - ✅ Thành công: Lấy `accessToken` mới, gắn vào request bị lỗi ban đầu và gọi lại. User không nhận ra sự gián đoạn.
   - ❌ Lỗi: Chuyển hướng user về **Màn hình Đăng nhập**, yêu cầu đăng nhập lại.

### 2.3 Luồng Quên / Khôi phục mật khẩu (Forgot Password Flow)
1. **Màn hình Quên mật khẩu (`/forgot-password`)**:
   - User nhập Email. Gọi `POST /api/auth/forgot`.
   - ✅ Luôn chuyển hướng sang **Màn hình Thông báo Check Email** (hành động này chống hacker dùng tool dò quét xem email nào có trong hệ thống).
2. **Hành động ở Email**:
   - User bấm vào link reset, trỏ về Frontend: `https://domain.com/reset-password?token=xyz...`
3. **Màn hình Đặt lại mật khẩu (`/reset-password`)**:
   - Hiển thị form cho nhập Mật khẩu mới và Nhập lại mật khẩu.
   - Gọi API `POST /api/auth/reset` cùng với tham số `token` từ URL.
   - ❌ Lỗi 400 (do mật khẩu trùng mật khẩu cũ): Báo "Mật khẩu mới không được giống mật khẩu cũ".
   - ✅ Thành công: Chuyển hướng về **Màn hình Đăng nhập** kèm dòng thông báo "Đổi mật khẩu thành công, mời đăng nhập".

### 2.4 Luồng Đăng nhập Google (Google OAuth Flow)
1. **Màn hình Đăng nhập (`/login`)**:
   - Bấm nút "Login with Google".
   - Frontend điều hướng thẻ trình duyệt (Location Redirect) thẳng đến URL API: `GET /api/auth/google`.
2. **Màn hình Xác thực Google**:
   - User chấp nhận quyền. Google redirect user về Callback của Backend.
3. **Chuyển về Frontend**:
   - Backend xử lý liên kết tài khoản xong sẽ redirect ngược lại về một màn hình của Frontend (VD: **Màn hình OAuth Success** `/oauth-success`).
   - Frontend bóc tách Access Token trên URL (hoặc lấy từ API khác), lưu Access Token.
   - Tự động chuyển hướng vào **Dashboard**.

### 2.5 Luồng Đăng xuất (Logout Flow)
1. **Ở bất kỳ màn hình nội bộ nào**:
   - User bấm nút Đăng xuất (trên Header / Sidebar).
   - Gọi API `POST /api/auth/logout`.
   - Frontend xóa sạch `accessToken` ở state / Local Storage.
   - Điều hướng về **Màn hình Đăng nhập** (`/login`).
