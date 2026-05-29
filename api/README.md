# API new

Tài liệu cài đặt và chạy cho thư mục `api`.

## Yêu cầu

- Node.js đã được cài sẵn.
- Bạn đang đứng trong thư mục `api`.

## Cài đặt

Trong thư mục `api`, ưu tiên cài dependencies bằng lệnh sau:

```bash
npm ci
```

Lệnh này cài theo đúng `package-lock.json` và thường ổn định hơn `npm i`.

Nếu `npm ci` hoặc `npm install` bị lỗi do xung đột dependency, dùng lệnh thay thế sau:

```bash
npm install --legacy-peer-deps
```

## Prisma

Sau khi cài xong dependencies, tạo Prisma client nếu cần:

```bash
npx prisma generate
```

## Chạy ứng dụng

```bash
npm run start:dev
```

## Lệnh hữu ích

- `npm run build` để build production.
- `npm run test` để chạy test.
- `npm run test:e2e` để chạy test end-to-end.
