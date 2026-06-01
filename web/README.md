# Web

Frontend web app của Mangaka Management Platform, xây dựng bằng Next.js 16, React 19, TypeScript và Tailwind CSS v4.

## Cai dat

Du an dang dung `npm`, nen chay trong thu muc `web/`:

```bash
npm install
```

## Chay du an

```bash
npm run dev
```

Mo trinh duyet tai `http://localhost:3000`.

## Lenh huu ich

```bash
npm run build
npm run start
npm run lint
```

## Cau truc thu muc

```text
web/
|-- app/
|   |-- layout.tsx
|   |-- page.tsx
|   |-- globals.css
|   `-- home/
|       `-- components/
|-- components/
|   |-- ui/
|   |-- layouts/
|   `-- shared/
|-- hooks/
|-- lib/
|-- public/
|-- stores/
`-- types/
```

### Y nghia tung thu muc

- `app/`: Noi dung chinh theo App Router cua Next.js. `layout.tsx` dinh nghia bo cuc goc, `page.tsx` la trang chu, `globals.css` chua style toan cuc.
- `app/home/components/`: Cac component rieng cho trang chu hoac khu vuc home.
- `components/ui/`: Bo component UI tai su dung nhu button, input, dialog, table, sidebar, toast.
- `components/layouts/`: Cac layout thanh phan cap cao, dung de xay dung bo cuc trang.
- `components/shared/`: Component dung chung giua nhieu tinh nang, khong thuoc rieng ve mot man hinh.
- `hooks/`: Custom React hooks.
- `lib/`: Ham tien ich, cau hinh API va cac helper dung chung.
- `stores/`: Quan ly state tap trung neu du an can chia se state giua nhieu component.
- `types/`: Kieu TypeScript dung chung cho toan project.
- `public/`: Tai nguyen tinh nhu anh, icon, file tinh.

## Alias import

Du an da cau hinh alias `@/*` trong `tsconfig.json`, nen co the import theo kieu:

```ts
import { cn } from '@/lib/utils';
```

## Ghi chu

- `package-lock.json` da co san, nen uu tien su dung `npm` de cai dat va chay du an.
- Thu muc `app/` dang la diem vao chinh cua website.
