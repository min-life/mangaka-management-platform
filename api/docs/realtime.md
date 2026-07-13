# Real-time WebSockets API (Socket.IO)

Tài liệu này mô tả cách Frontend (hoặc Client) kết nối với Backend thông qua giao thức WebSockets (dự kiến sử dụng Socket.IO) để nhận dữ liệu Real-time (Thời gian thực) về Activity Logs và Notifications.

## 1. Cấu hình Kết Nối (Connection)

Khuyến nghị sử dụng thư viện `socket.io-client`.

- **Endpoint (Namespace):** `ws://<domain_api>/realtime` (Ví dụ: `ws://localhost:3000/realtime`)
- **Transport:** Yêu cầu ưu tiên sử dụng `websocket` để tăng hiệu suất.
- **Xác thực (Authentication):** Client bắt buộc phải truyền JWT Access Token vào payload `auth` khi khởi tạo kết nối.

### Ví dụ khởi tạo kết nối:
```javascript
import { io } from "socket.io-client";

const socket = io("ws://localhost:3000/realtime", {
  transports: ["websocket"],
  auth: {
    token: "Bearer <YOUR_ACCESS_TOKEN>" // Token JWT dùng như khi call API
  }
});

socket.on("connect", () => {
  console.log("Connected to Realtime Server with ID:", socket.id);
});

socket.on("connect_error", (err) => {
  console.error("Connection failed:", err.message); // Có thể do token hết hạn hoặc sai
});
```

---

## 2. Nhận Thông Báo Cá Nhân (Notifications)

Mặc định khi kết nối thành công và xác thực xong, server sẽ tự động cho socket của bạn join vào một "Room" riêng biệt dành riêng cho User ID của bạn. Bất cứ khi nào có thông báo gửi đích danh cho bạn, server sẽ emit event xuống.

### Lắng nghe sự kiện `notification:new`
Sự kiện này được kích hoạt khi có một Notification mới được hệ thống tạo ra (ví dụ: ai đó nhắc tới bạn, ai đó giao task cho bạn).

```javascript
socket.on("notification:new", (data) => {
  console.log("Bạn có thông báo mới!", data);
  /*
  Cấu trúc data trả về mẫu:
  {
    id: 124,
    userId: 5,
    activityLogId: 88,
    isRead: false,
    createdAt: "2026-06-28T14:00:00.000Z",
    // Có thể populate thêm dữ liệu của activityLog
    activityLog: {
      action: "TASK_ASSIGNED",
      actor: { id: 2, displayName: "Nguyễn Văn A" },
      ...
    }
  }
  */
});
```

---

## 3. Nhận Nhật Ký Hoạt Động Của Dự Án (Activity Logs)

Khác với Notifications (cá nhân), Activity Logs là các hoạt động xảy ra bên trong một Dự án (Project) hoặc Bảng biên tập (Editor Board). Để nhận được realtime log của một Project cụ thể, Client cần phải chủ động `subscribe` (đăng ký) vào Project đó. Thường được gọi khi User truy cập vào trang chi tiết Project.

### 3.1. Đăng ký nhận log của Project (Client -> Server)
```javascript
// Yêu cầu server cho join vào room của Project ID = 10
socket.emit("project:subscribe", { projectId: 10 });
```

### 3.2. Hủy đăng ký khi rời trang (Client -> Server)
```javascript
// Báo server ngừng gửi event của Project ID = 10
socket.emit("project:unsubscribe", { projectId: 10 });
```

### 3.3. Lắng nghe sự kiện `activity:new` (Server -> Client)
Khi có bất kỳ thành viên nào trong Project thao tác (thêm file, đổi trạng thái task, bình luận...), server sẽ emit event này đến tất cả những ai đang subscribe.

```javascript
socket.on("activity:new", (activity) => {
  console.log("Có hoạt động mới trong dự án:", activity);
  /*
  Cấu trúc activity trả về mẫu:
  {
    id: 99,
    action: "FILE_UPLOADED",
    entityType: "FILE",
    entityId: 105,
    projectId: 10,
    actorId: 2,
    metadata: { fileName: "chapter_01_page_05.jpg" },
    createdAt: "2026-06-28T14:05:00.000Z",
    actor: {
       id: 2,
       displayName: "Nguyễn Văn A",
       avatarUrl: "..."
    }
  }
  */
});
```

---

## 4. Xử lý Lỗi (Error Handling)

Server có thể emit sự kiện `exception` hoặc trả về ack callback báo lỗi nếu yêu cầu không hợp lệ (ví dụ: xin subscribe vào project mà user không có quyền truy cập).

```javascript
socket.on("exception", (error) => {
  console.error("Lỗi từ server WebSocket:", error);
  // Ví dụ: { status: 403, message: "Forbidden: You don't have access to this project" }
});
```

---

## 5. Bình Luận Thời Gian Thực (Real-time Comments)

Để hỗ trợ việc nhiều người dùng cùng thảo luận trên một File, Task hoặc Frame (vùng đánh dấu trên ảnh) mà không cần tải lại trang, hệ thống cung cấp luồng Real-time riêng cho Comments.

### 5.1. Phân chia trách nhiệm (Responsibilities)

**Phía Backend (BE) cần làm:**
1. **Thiết lập Room:** Tạo các socket room tương ứng với từng thực thể (ví dụ: `file_comments_10`, `task_comments_20`).
2. **Xử lý sự kiện Subscribe/Unsubscribe:** Cho phép client join/leave các room này thông qua sự kiện (ví dụ: `comment:subscribe`). Phải kiểm tra quyền truy cập của người dùng đối với File/Task trước khi cho phép join.
3. **Phát sóng (Broadcast) dữ liệu mới:** Khi có một bình luận mới được tạo (thông qua REST API `POST /api/comments`), BE phải tự động emit sự kiện (vd: `comment:new`) kèm theo dữ liệu bình luận đó tới đúng room tương ứng. Tương tự cho các thao tác sửa (`comment:updated`) và xóa (`comment:deleted`).

**Phía Frontend (FE) cần làm:**
1. **Quản lý kết nối & Subscribe:** Khi người dùng mở trang chi tiết (ví dụ xem một File hoặc Task), FE gửi sự kiện `comment:subscribe` kèm theo ID của File/Task đó. Khi rời khỏi trang, FE **bắt buộc** phải gửi `comment:unsubscribe` để tránh memory leak và nhận rác dữ liệu.
2. **Gửi Comment:** FE **vẫn sử dụng REST API truyền thống** (`POST /api/comments`) để gửi nội dung bình luận thay vì dùng Socket. Điều này giúp tận dụng các cơ chế upload file đính kèm, middleware xác thực HTTP và lấy status code/error chính xác dễ dàng hơn.
3. **Lắng nghe & Cập nhật UI:** FE lắng nghe sự kiện `comment:new` từ socket. Khi nhận được dữ liệu, FE tiến hành append (thêm) bình luận mới vào cuối mảng (state) để hiển thị ngay lập tức mà không cần gọi lại API GET. Tương tự, cập nhật hoặc xóa phần tử trong DOM khi nhận được `comment:updated` hoặc `comment:deleted`.

### 5.2. Kịch bản các sự kiện (Events) chi tiết

**Đăng ký nhận comment (Client -> Server):**
```javascript
// Đăng ký nhận comment cho File ID = 15
socket.emit("comment:subscribe", { entityType: "FILE", entityId: 15 });

// Đăng ký nhận comment cho Task ID = 8
socket.emit("comment:subscribe", { entityType: "TASK", entityId: 8 });
```

**Hủy đăng ký (Client -> Server):**
```javascript
socket.emit("comment:unsubscribe", { entityType: "FILE", entityId: 15 });
```

**Lắng nghe sự kiện (Server -> Client):**
```javascript
// Khi có người bình luận mới
socket.on("comment:new", (commentData) => {
  console.log("Bình luận mới:", commentData);
  // FE: Thêm commentData vào mảng comments hiện tại của state để hiển thị ngay
});

// Khi có người sửa bình luận
socket.on("comment:updated", (commentData) => {
  console.log("Bình luận đã sửa:", commentData);
  // FE: Tìm comment trong mảng theo ID và cập nhật lại nội dung
});

// Khi có người xóa bình luận
socket.on("comment:deleted", ({ commentId }) => {
  console.log("Bình luận đã bị xóa, ID:", commentId);
  // FE: Lọc (filter) commentId ra khỏi mảng hiển thị
});
```

