# Hướng dẫn: Đưa một Page từ Stitch về dự án Mobile

> Tài liệu này mô tả quy trình chuẩn để chuyển đổi một màn hình thiết kế từ **Google Stitch** sang **React Native** trong dự án Mangaka Management Platform.

---

## Tổng quan công nghệ

| Công nghệ | Vai trò |
|-----------|---------|
| [Google Stitch](https://stitch.withgoogle.com) | Công cụ thiết kế UI — nguồn xuất HTML |
| React Native + Expo | Framework mobile |
| NativeWind v4 | Tailwind CSS cho React Native |
| Gluestack UI v3 | Component library |
| `@expo/vector-icons` (MaterialIcons) | Bộ icon vector |
| `@react-navigation/native-stack` | Điều hướng giữa các màn hình |

---

## Cấu trúc thư mục chuẩn

Mỗi page mới **phải** tuân theo cấu trúc sau:

```
src/
├── types/
│   └── [screenName].ts            ← Interfaces & types riêng của screen
│
├── constants/
│   ├── colors.ts                  ← Token màu chung toàn app (không sửa tùy tiện)
│   └── [screenName]Data.ts        ← Data tĩnh: arrays, objects, mock data
│
├── components/
│   ├── shared/
│   │   ├── MaterialIcon.tsx       ← Icon wrapper dùng chung (thêm icon mới tại đây)
│   │   └── BottomNavBar.tsx       ← Bottom navigation dùng chung
│   └── sub-component/
│       └── [ComponentName].tsx    ← Sub-component nhỏ, tái sử dụng được
│
├── navigation/
│   ├── types.ts                   ← RootStackParamList — đăng ký route mới tại đây
│   └── RootNavigator.tsx          ← Stack navigator — thêm <Stack.Screen> tại đây
│
└── screens/
    └── [screenName]/
        └── index.tsx              ← Main Screen — chỉ chứa layout + logic điều hướng
```

---

## Quy trình từng bước

### Bước 1 — Tìm Screen ID trên Stitch

Dùng MCP tool `stitch/list_screens` để lấy danh sách screens:

```
Tool: stitch/list_screens
Args: { projectId: "11703340732051233510" }
```

Ghi lại `screenId` của màn hình cần convert (ví dụ: `a52c78e6130c49959399438d13a10034`).

---

### Bước 2 — Lấy HTML source

**2a.** Lấy `downloadUrl` từ screen:

```
Tool: stitch/get_screen
Args: { projectId: "11703340732051233510", screenId: "<screenId>" }
```

**2b.** Tải nội dung HTML:

```
Tool: read_url_content
Args: { url: "<downloadUrl từ bước 2a>" }
```

**2c.** Đọc file HTML đã tải về để phân tích cấu trúc.

---

### Bước 3 — Phân tích HTML

Trước khi code, cần xác định rõ:

| Cần xác định | Cách tìm trong HTML |
|-------------|---------------------|
| Cấu trúc layout | `<header>`, `<main>`, `<nav>`, `<aside>` |
| Màu sắc | Các giá trị `style="background-color: ..."` và class Tailwind |
| Typography | `font-family`, `font-size`, `font-weight` |
| Icons | Thẻ `<span class="material-symbols-outlined">tên_icon</span>` |
| Sections & components | Các `<section>`, `<div>` có comment `<!-- ... -->` |
| Interactions | `<script>` cuối file |

---

### Bước 4 — Tạo file Types

Tạo `src/types/[screenName].ts`:

```ts
// Ví dụ: src/types/taskDetail.ts
export type ReviewTab = 'Overview' | 'Discussion' | 'Action';

export interface Contributor {
  id: string;
  name: string;
  role: string;
  // ...
}
```

> **Quy tắc:** Chỉ đặt types liên quan trực tiếp đến screen này.
> Types dùng chung toàn app (như `BottomTab`) đặt trong `src/types/common.ts`.

---

### Bước 5 — Tạo file Data

Tạo `src/constants/[screenName]Data.ts`:

```ts
// Ví dụ: src/constants/taskDetailData.ts
import { Colors } from '@/src/constants/colors';
import { Contributor } from '@/src/types/taskDetail';

export const TASK_INFO = {
  chapter: 'Chapter 4',
  pageCode: 'C04_P45',
  // ...
};

export const CONTRIBUTORS: Contributor[] = [
  { id: '1', name: 'Kaito Yamamoto', role: 'Lead Artist', ... },
];
```

> **Quy tắc:** Không đặt JSX trong file này. Chỉ data thuần.

---

### Bước 6 — Thêm Icons còn thiếu

Mở `src/components/shared/MaterialIcon.tsx` và thêm vào `ICON_MAP`:

```ts
// Map: tên Material Symbols (snake_case từ Stitch) → tên MaterialIcons (expo/vector-icons)
const ICON_MAP: Record<string, MaterialIconName> = {
  // ...icons hiện có...

  // ── [Tên Screen] ───────────────────────
  share:        'share',
  visibility:   'visibility',
  check_circle: 'check-circle',
};
```

> **Tìm tên icon:** Tra cứu tại [fonts.google.com/icons](https://fonts.google.com/icons).
> Nếu icon chưa có trong map, component sẽ tự động hiển thị `help-outline` và log warning.

---

### Bước 7 — Tạo Sub-components

Với mỗi khối UI lặp lại hoặc đủ phức tạp, tạo file riêng trong `src/components/sub-component/`:

```tsx
// Ví dụ: src/components/sub-component/ContributorRow.tsx
import React from 'react';
import { View, Text } from 'react-native';
import { Contributor } from '@/src/types/taskDetail';

interface ContributorRowProps {
  contributor: Contributor;
}

export default function ContributorRow({ contributor }: ContributorRowProps) {
  return (
    <View className="flex-row items-center gap-3">
      {/* ... */}
    </View>
  );
}
```

> **Quy tắc:** Sub-component **không được** gọi `useNavigation`. Nếu cần điều hướng, truyền qua prop `onPress`.

---

### Bước 8 — Tạo Main Screen

Tạo `src/screens/[screenName]/index.tsx`:

```tsx
// Chỉ import, không có inline data hay type definition
import React, { useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

import { RootStackNavProp } from '@/src/navigation/types';
import { Colors } from '@/src/constants/colors';
import { TASK_INFO } from '@/src/constants/taskDetailData';
import MaterialIcon from '@/src/components/shared/MaterialIcon';
import ContributorRow from '@/src/components/sub-component/ContributorRow';

export default function TaskDetailScreen() {
  const navigation = useNavigation<RootStackNavProp>();
  // ...logic...
  return ( /* ...JSX... */ );
}
```

> **Quy tắc:** File `index.tsx` chỉ được chứa Main Screen component. Không có data, không có type, không có sub-component.

---

### Bước 9 — Đăng ký Navigation

**9a.** Thêm route vào `src/navigation/types.ts`:

```ts
export type RootStackParamList = {
  Home: undefined;
  Tasks: undefined;
  TaskDetail: undefined;         // ← thêm vào đây
  // TaskDetail: { taskId: string };  // nếu cần truyền params
};
```

**9b.** Thêm `<Stack.Screen>` vào `src/navigation/RootNavigator.tsx`:

```tsx
import TaskDetailScreen from '@/src/screens/taskDetail';

// ...
<Stack.Screen name="TaskDetail" component={TaskDetailScreen} />
```

**9c.** Thêm navigate tại screen trước đó:

```tsx
// Ví dụ: từ TasksScreen navigate sang TaskDetail
<TaskCard onPress={() => navigation.navigate('TaskDetail')} />
```

---

## Các lưu ý quan trọng

### Import CSS
```ts
// ✅ Đúng — dùng đường dẫn tương đối
import './global.css';

// ❌ Sai — alias @ không hoạt động với .css trong Metro/NativeWind
import '@/global.css';
```

### Màu sắc
```ts
// ✅ Dùng Colors token có sẵn khi có thể
import { Colors } from '@/src/constants/colors';
style={{ backgroundColor: Colors.bg }}

// ✅ Khai báo const cục bộ nếu screen có màu riêng (như TaskDetail dùng dark cũ của Stitch)
const C = { bg: '#16130c', surface: '#231f18', ... } as const;
```

### react-dom shim
Dự án đã có sẵn `shims/react-dom.js` để fix lỗi `@react-aria` trong `@gluestack-ui`.
Không cần làm gì thêm — Metro tự resolve qua `metro.config.js`.

### Khi thêm package mới
```bash
npm install <package> --legacy-peer-deps
```
Luôn dùng `--legacy-peer-deps` để tránh conflict với `react-aria` và `@gluestack-ui`.

---

## Checklist trước khi hoàn thành

- [ ] `src/types/[screenName].ts` — đã tạo
- [ ] `src/constants/[screenName]Data.ts` — đã tạo
- [ ] Sub-components trong `src/components/sub-component/` — đã tạo
- [ ] Icons mới đã thêm vào `MaterialIcon.tsx`
- [ ] `src/screens/[screenName]/index.tsx` — đã tạo, không có inline data/type
- [ ] Route đã thêm vào `src/navigation/types.ts`
- [ ] `<Stack.Screen>` đã thêm vào `RootNavigator.tsx`
- [ ] Navigate từ screen trước đã được wire
- [ ] Nút Back (`navigation.goBack()`) đã có trong header

---

## Screens đã convert

| # | Tên Screen | Screen ID | Thư mục |
|---|-----------|-----------|---------|
| 1 | Home - Updated Colors | `a6d0604a...` | `src/screens/home/` |
| 2 | Tasks | `f35c4a3d...` | `src/screens/tasks/` |
| 3 | Task Detail & Review | `a52c78e6...` | `src/screens/taskDetail/` |

## Screens chưa convert

| # | Tên Screen | Screen ID |
|---|-----------|-----------|
| 4 | Login | `1598c0f6...` |
| 5 | Project Detail - Dragon Blade | `c24e5f31...` |
| 6 | Profile | `22583f09...` |
| 7 | Notification Inbox - Streamlined | `f0495fb9...` |
| 8 | Notification Inbox - Card-Based | `75d9163c...` |
| 9 | Notification Inbox - Classic List | `18b4f0b1...` |
