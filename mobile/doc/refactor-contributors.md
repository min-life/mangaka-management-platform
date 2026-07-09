# Kế Hoạch Refactor Màn Hình Contributor (Project Detail)

## 1. Tổng Quan

Refactor màn hình `ProjectContributorsScreen` (`src/screens/projectContributors/index.tsx`) với 3 thay đổi chính:

1. **Bỏ thống kê task** (Tasks, Pending, Review, Done) trên mỗi card member
2. **Thêm tính năng xóa member** — icon sọt rác trên mỗi card (trừ Owner)
3. **Thêm tính năng thêm member** — icon `+` ở header bên phải, mở popup tìm theo email

---

## 2. Phân Tích API Liên Quan

### API đã có sẵn (backend):

| Mục đích | Method | Endpoint | Body/Params |
|---|---|---|---|
| Tìm user theo email | `GET` | `/api/users?search=<email>` | `search`, `page`, `limit` |
| Thêm members vào project | `POST` | `/api/projects/{id}/members` | `{ userIds: number[], roleId: number }` |
| Xóa member khỏi project | `DELETE` | `/api/projects/{id}/members/{userId}` | — |
| Lấy roles (để lấy default PRJ role) | `GET` | `/api/roles?scope=PRJ` | `scope=PRJ` |

### API cần tạo mới ở mobile (`src/services/`):

- `searchUsersByEmail(email: string)` → gọi `GET /api/users?search=email`
- `addProjectMembers(projectId, userIds, roleId)` → gọi `POST /api/projects/{id}/members`
- `removeProjectMember(projectId, userId)` → gọi `DELETE /api/projects/{id}/members/{userId}`
- `fetchDefaultProjectRoleId()` → gọi `GET /api/roles?scope=PRJ` rồi tìm role có `isDefault=true`

---

## 3. Chi Tiết Thay Đổi

### 3.1 Bỏ thống kê task

**File:** `src/screens/projectContributors/index.tsx`

- Xóa component `TaskMetric`
- Xóa block `<View className="mt-4 flex-row flex-wrap gap-2">` chứa 4 `<TaskMetric>` trong `ContributorRow`
- Giữ nguyên phần avatar, tên, email, role label, ngày tham gia

### 3.2 Thêm icon sọt rác (Xóa member)

**File:** `src/screens/projectContributors/index.tsx`

- Thêm prop `onDelete` vào `ContributorRow`
- Nếu `isOwner === false`, hiển thị icon sọt rác (MaterialIcon `delete`) ở **bên phải** của card, cùng hàng với role badge
- Khi nhấn icon sọt rác:
  - Hiển thị `Alert.alert` xác nhận: "Bạn có chắc muốn xóa {memberName} khỏi project?"
  - Nếu OK → gọi `DELETE /api/projects/{id}/members/{userId}`
  - Reload danh sách members
- Member có label **Owner** sẽ **không hiển thị** icon sọt rác

### 3.3 Thêm icon `+` ở header (Thêm member)

**File:** `src/screens/projectContributors/index.tsx`

- Thêm icon `+` (MaterialIcon `add`) vào **header bên phải** của `EditorBoardTopBar` (hoặc tự render nút riêng nếu component không hỗ trợ)
- Khi nhấn icon `+` → mở **Modal/Popup thêm member**

### 3.4 Popup Thêm Member (AddMemberModal)

**File mới:** `src/screens/projectContributors/AddMemberModal.tsx`

**UI Flow:**

```
┌─────────────────────────────────────┐
│  Thêm thành viên              [ X ] │
│─────────────────────────────────────│
│  🔍 Nhập email để tìm kiếm...      │
│─────────────────────────────────────│
│                                     │
│  Kết quả tìm kiếm:                 │
│  ┌─────────────────────────────┐    │
│  │ ☐ user1@email.com - Tên 1  │    │
│  │ ☐ user2@email.com - Tên 2  │    │
│  │ ☑ user3@email.com - Tên 3  │    │
│  └─────────────────────────────┘    │
│                                     │
│  Đã chọn: 1 người                  │
│  ┌─────────────────────────────┐    │
│  │ user3@email.com         [x] │    │
│  └─────────────────────────────┘    │
│                                     │
│        [ Thêm thành viên ]          │
└─────────────────────────────────────┘
```

**Logic chi tiết:**

1. User nhập email vào TextInput (debounce 500ms)
2. Gọi `GET /api/users?search=<email>&page=1&limit=10` để tìm user
3. Hiển thị danh sách kết quả, mỗi item có checkbox
4. Lọc bỏ các user **đã là member** của project (so sánh id với danh sách members hiện tại)
5. User tick chọn → thêm vào danh sách "Đã chọn" ở dưới
6. Nhấn "Thêm thành viên":
   - Gọi `GET /api/roles?scope=PRJ` lấy role có `isDefault=true` → lấy `roleId`
   - Gọi `POST /api/projects/{id}/members` với `{ userIds: [...selectedIds], roleId }`
   - Nếu thành công: đóng modal, reload danh sách members
   - Nếu lỗi: hiển thị thông báo lỗi

---

## 4. Danh Sách Files Cần Thay Đổi

| File | Hành động | Mô tả |
|---|---|---|
| `src/services/projectApi.ts` | **MODIFY** | Thêm 2 hàm: `addProjectMembers`, `removeProjectMember` |
| `src/services/userApi.ts` | **MODIFY** | Thêm hàm `searchUsers` |
| `src/services/projectApi.ts` | **MODIFY** | Thêm hàm `fetchDefaultProjectRoleId` (hoặc tạo `roleApi.ts`) |
| `src/screens/projectContributors/index.tsx` | **MODIFY** | Xóa TaskMetric, thêm icon delete, thêm icon + header, tích hợp modal |
| `src/screens/projectContributors/AddMemberModal.tsx` | **NEW** | Component modal thêm member |

---

## 5. Thứ Tự Thực Hiện

1. **Bước 1**: Tạo các hàm API mới (`searchUsers`, `addProjectMembers`, `removeProjectMember`, `fetchDefaultProjectRoleId`)
2. **Bước 2**: Xóa `TaskMetric` và thống kê task khỏi `ContributorRow`
3. **Bước 3**: Thêm icon sọt rác + logic xóa member vào `ContributorRow`
4. **Bước 4**: Tạo `AddMemberModal.tsx`
5. **Bước 5**: Thêm icon `+` ở header + tích hợp modal vào màn hình chính
6. **Bước 6**: Test toàn bộ flow

---

## 6. Lưu Ý

- **Không sửa code bên `api/` hay `web/`** — chỉ code trong `mobile/`
- API `GET /api/users` hỗ trợ search theo cả `displayName` và `email` (mode: insensitive)
- API `POST /api/projects/{id}/members` yêu cầu `roleId` bắt buộc → dùng role mặc định PRJ (isDefault=true)
- API `DELETE /api/projects/{id}/members/{userId}` backend đã check không cho xóa owner → vẫn nên ẩn icon sọt rác trên UI cho Owner
- Cần debounce khi search email để tránh gọi API quá nhiều
- Danh sách kết quả search cần lọc bỏ user đã là member
