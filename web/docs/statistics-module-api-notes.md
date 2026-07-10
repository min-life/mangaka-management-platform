# Module Statistics: Yêu cầu bổ sung cho Backend

Tab "Statistics" ở trang chi tiết Project (`/studio/projects/:projectId/statistics`) hiện là một
bản UI hoàn chỉnh phía frontend nhưng **chưa có dữ liệu thật** vì backend chưa hỗ trợ. Toàn bộ giá
trị hiển thị hiện đang là `*` (rỗng/0) cho tới khi các API bên dưới được bổ sung. Service phía
frontend (`web/services/project-statistics.service.ts`) đã được viết sẵn theo đúng hợp đồng API mô
tả trong tài liệu này — nghĩa là khi backend làm xong, dữ liệu thật sẽ tự động hiển thị mà **không
cần sửa gì thêm ở frontend**.

**Nguyên tắc quan trọng: không cần tạo bảng mới / không cần migration database.** Bảng
`project_stats` hiện có sẵn cột `metrics` kiểu JSON (tự do, không ràng buộc schema) — ta tận dụng
cột này để lưu số liệu theo từng tháng/năm, thay vì tạo bảng riêng.

## 1. API hiện có nhưng chưa dùng được

- `GET /projects/:id/stats` / `POST /projects/:id/stats`
  (`api/src/projects/projects.controller.ts:536-575`) và module `api/src/project-stats/` — đang
  đọc/ghi nguyên khối `metrics: Json` cho mỗi project (mỗi project 1 dòng). Vấn đề:
  - `POST` hiện **ghi đè toàn bộ** `metrics` mỗi lần gọi → nếu dùng để import CSV theo từng tháng
    sẽ làm mất dữ liệu các tháng đã import trước đó.
  - `GET` trả về nguyên khối JSON không có cấu trúc rõ ràng (`metrics: unknown`), không có cách lọc
    theo tháng/năm.

  → Không cần đổi bảng, nhưng logic của 2 API này (hoặc 2 API mới cạnh nó) cần được viết lại như
  mục 2 và 3 bên dưới.

## 2. Cấu trúc dữ liệu đề xuất (lưu trong cột `metrics` có sẵn)

Không tạo bảng mới. Vẫn dùng bảng `project_stats` hiện tại (1 dòng cho mỗi project), nhưng bên
trong cột `metrics` lưu nhiều kỳ tháng/năm dưới dạng object, key theo định dạng `"YYYY-MM"`:

```json
{
  "periods": {
    "2026-07": { "sales": 12800, "views": 482000, "ratingsCount": 340, "averageRating": 4.6 },
    "2026-06": { "sales": 9000, "views": 310000, "ratingsCount": 280, "averageRating": 4.5 }
  }
}
```

Mỗi lần import thêm dữ liệu cho 1 tháng, backend chỉ cần **merge (ghi/ghi đè) đúng key tháng đó**
vào object `periods`, giữ nguyên các tháng khác — không đụng tới schema database.

## 3. Việc cần backend làm — API import CSV (mới)

```http
POST /projects/:projectId/statistics/import
Content-Type: multipart/form-data
field: file (CSV)
```

- **Input:** file CSV với các cột `month, year, sales, views, ratingsCount, averageRating`.
- **Xử lý:** đọc từng dòng CSV → merge vào `metrics.periods["YYYY-MM"]` của bản ghi `project_stats`
  ứng với project đó (tạo bản ghi mới nếu project chưa có dòng nào, cập nhật nếu đã có). Import
  lại cùng 1 tháng/năm thì **ghi đè kỳ đó**, không cộng dồn, không tạo trùng.
- **Cần xử lý rõ các trường hợp lỗi:**
  - Thiếu file → báo lỗi "Thiếu file CSV" (400)
  - File sai định dạng (không phải CSV / không đọc được) → báo lỗi "File không đúng định dạng" (400)
  - Dữ liệu trong file không hợp lệ (ví dụ sales âm, tháng không nằm trong khoảng 1–12, thiếu cột...)
    → báo lỗi kèm rõ **dòng nào, cột nào, lý do gì** (422), ví dụ:
    ```json
    {
      "statusCode": 422,
      "message": "File CSV có dữ liệu không hợp lệ.",
      "errors": [
        { "row": 3, "field": "sales", "reason": "phải là số nguyên không âm" },
        { "row": 5, "field": "month", "reason": "phải nằm trong khoảng 1-12" }
      ]
    }
    ```
  - Thành công → trả về số dòng đã import và các kỳ (tháng/năm) đã bị ảnh hưởng:
    `{ "data": { "imported": 3, "skipped": 0, "periodsAffected": ["2026-07", "2026-06"] } }`

## 4. Việc cần backend làm — API lấy số liệu để hiển thị (mới)

```http
GET /projects/:projectId/statistics?month=7&year=2026
```

- **Xử lý:** đọc `metrics.periods` của project đó, lấy đúng kỳ `month/year` được yêu cầu, và kèm
  theo vài kỳ liền trước (ví dụ 6 tháng gần nhất) để vẽ biểu đồ xu hướng. **Lưu ý: dữ liệu theo
  tháng (vì CSV nhập theo tháng), không phải theo ngày.**
- **Response mẫu:**
  ```json
  {
    "data": {
      "totals": {
        "totalSales": 12800,
        "totalViews": 482000,
        "totalRatingsCount": 340,
        "averageRating": 4.6
      },
      "salesOverTime": [
        { "date": "2026-02", "value": 6000 },
        { "date": "2026-03", "value": 7200 },
        { "date": "2026-07", "value": 12800 }
      ],
      "viewsOverTime": [
        { "date": "2026-02", "value": 210000 },
        { "date": "2026-07", "value": 482000 }
      ]
    }
  }
  ```
- **Quan trọng:** Nếu kỳ `month/year` được yêu cầu **chưa có dữ liệu** (chưa import) → trả về
  **200 với số liệu rỗng/về 0** (`totalSales: 0`, mảng rỗng...), **không** trả lỗi 404. Lý do:
  frontend cần phân biệt "chưa có dữ liệu" (hiển thị thông báo "Không có dữ liệu thống kê.") với
  "lỗi hệ thống thật sự" (hiển thị banner lỗi đỏ).
  - Chỉ trả 404 khi project không tồn tại.
  - Trả 400 khi `month`/`year` truyền vào sai định dạng (tháng không nằm trong 1–12...).

## 5. Tóm tắt việc cần request backend

1. ~~Tạo bảng mới~~ → **Không cần** — tận dụng cột `metrics: Json` có sẵn ở bảng `project_stats`.
2. Làm API **import CSV**: `POST /projects/:projectId/statistics/import` (mục 3).
3. Làm API **lấy số liệu thống kê theo tháng/năm**: `GET /projects/:projectId/statistics` (mục 4).
4. Đảm bảo logic ghi dữ liệu là **merge theo từng tháng**, không ghi đè mất dữ liệu các tháng khác.

## 6. Fallback hiện tại ở Frontend

- Toàn bộ tab Statistics: KPI (Sales/Views/Ratings/Average Rating) và 2 biểu đồ theo thời gian.
- Frontend coi lỗi `404` từ `GET /projects/:id/statistics` là "chưa có dữ liệu cho kỳ này" và hiển
  thị `Không có dữ liệu thống kê.` thay vì báo lỗi — xem hàm `getProjectStatistics` trong
  `web/services/project-statistics.service.ts`. Khi API ở mục 4 hoàn thành và trả về `200` (kể cả
  khi số liệu bằng 0), cơ chế kiểm tra rỗng (`isStatisticsEmpty`) vẫn hoạt động đúng mà **không cần
  sửa gì thêm ở frontend**.
- Giao diện upload CSV (kèm hiển thị lỗi cho các trường hợp ở mục 3) **chưa được làm ở frontend** —
  hiện chỉ mới có phần hiển thị số liệu. Sẽ bổ sung UI import sau khi API ở mục 3 sẵn sàng.
