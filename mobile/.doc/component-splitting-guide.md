# Mobile Component Splitting Guide

Tài liệu này ghi lại cách tách component đang dùng trong app `mobile`, dựa trên các màn đã refactor: `taskDetail`, `tasks`, và `profile`.

## Mục tiêu

- Giữ `index.tsx` của mỗi screen ngắn, dễ đọc.
- Tách UI thành các component có trách nhiệm rõ ràng.
- Giữ state, navigation, filter logic chính ở screen container nếu logic đó thuộc flow của màn hình.
- Dùng lại shared component có sẵn trong `src/components` thay vì copy UI.
- Dùng barrel export `components/index.ts` để import trong screen gọn hơn.

## Cấu trúc thư mục

Mỗi screen có component riêng nên dùng cấu trúc:

```txt
src/screens/<screenName>/
  index.tsx
  components/
    index.ts
    ScreenTopBar.tsx
    SomeSection.tsx
    SomeCard.tsx
    types.ts
    data.ts
    theme.ts
```

Không phải màn nào cũng cần đủ `types.ts`, `data.ts`, hoặc `theme.ts`. Chỉ tạo khi thật sự giúp file chính nhẹ hơn.

## Vai trò của `index.tsx`

`index.tsx` nên đóng vai trò container:

- Khởi tạo state của màn hình.
- Gọi `useNavigation`.
- Xử lý handler cấp màn hình như `goBack`, `navigate`, `logout`, search/filter.
- Compose các component con theo thứ tự hiển thị.
- Render shared layout cuối màn như `BottomNavBar`.

Ví dụ pattern:

```tsx
export default function TasksScreen() {
  const navigation = useNavigation<RootStackNavProp>();
  const [activeFilter, setActiveFilter] = useState<FilterChip>('All');
  const [search, setSearch] = useState('');

  const filteredTasks = TASKS.filter(...);

  return (
    <View className="flex-1" style={{ backgroundColor: Colors.bg }}>
      <TasksTopBar onBack={() => navigation.goBack()} />
      <ScrollView>
        <TasksSearchBar search={search} onSearchChange={setSearch} />
        <FilterChipBar activeFilter={activeFilter} onFilterChange={setActiveFilter} />
        {filteredTasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onPress={() => navigation.navigate('TaskDetail')}
          />
        ))}
      </ScrollView>
      <BottomNavBar activeTab="inbox" />
    </View>
  );
}
```

## Khi nào nên tách component

Nên tách khi một khối UI có một trong các dấu hiệu sau:

- Có comment section rõ ràng như `Top App Bar`, `Search Bar`, `Filter Chips`, `Action Tab`.
- Có thể đặt tên bằng một danh từ cụ thể: `TaskCard`, `ProfileMenuSection`, `ReviewTabBar`.
- Có props đầu vào rõ ràng.
- Có map list riêng.
- Có thể tái sử dụng trong cùng screen hoặc screen khác.
- Làm `index.tsx` dài hoặc khó scan.

Không cần tách quá nhỏ khi component chỉ là một wrapper rất đơn giản và không giúp tăng độ rõ ràng.

## Quy ước đặt tên

- Component cấp màn hình: prefix theo screen.
  - `TasksTopBar`
  - `TasksSearchBar`
  - `ProfileMenuSection`
  - `TaskDetailTopBar`
- Component UI nhỏ dùng trong screen:
  - `TaskCard`
  - `PriorityBadge`
  - `AvatarStack`
- File data/type/helper trong `components`:
  - `taskData.ts`
  - `types.ts`
  - `badgeStyles.ts`
  - `theme.ts`

## Props và state

State nên đặt ở nơi thấp nhất nhưng vẫn đủ điều khiển flow:

- State ảnh hưởng cả màn hình: đặt ở `index.tsx`.
- State chỉ phục vụ component nội bộ: đặt trong component đó.
- Handler navigation: thường đặt ở `index.tsx`, truyền xuống bằng prop.
- Form input đơn giản như comment/search: đặt ở screen nếu ảnh hưởng filter/render bên ngoài.

Ví dụ:

```tsx
<DiscussionTab comment={comment} onCommentChange={setComment} />
```

Component con không nên tự gọi navigation nếu hành động đó là flow chính của màn hình. Truyền `onPress`, `onBack`, `onItemPress` từ screen xuống.

## Data, types và helper

Nếu data hoặc helper làm screen dài, tách ra:

- `types.ts`: union type, interface dùng riêng cho screen.
- `taskData.ts`: mock/static data riêng của screen.
- `badgeStyles.ts`: mapping style theo status/priority.
- `theme.ts`: theme local nếu màn cần alias màu riêng.

Nếu data dùng nhiều màn, ưu tiên đặt ở `src/constants` hoặc `src/types` thay vì giữ trong screen.

## Barrel export

Mỗi folder `components` nên có `index.ts`:

```ts
export { default as TaskCard } from './TaskCard';
export { default as TasksTopBar } from './TasksTopBar';
export { TASKS } from './taskData';
export type { FilterChip } from './types';
```

Screen import từ `./components`:

```ts
import {
  TASKS,
  TaskCard,
  TasksTopBar,
  type FilterChip,
} from './components';
```

## Theme và màu

- Ưu tiên dùng `Colors` từ `src/constants/colors.ts`.
- Nếu screen cần alias riêng, tạo `components/theme.ts` và map về `Colors`.
- Tránh hard-code màu mới trong component. Nếu màu được dùng lại nhiều lần, thêm token vào `Colors`.
- Tham khảo thêm `mobile/.doc/color-theme.md`.

## Shared components

Nếu component đã nằm trong `src/components/shared` hoặc `src/components/sub-component`, tiếp tục dùng nó:

- `BottomNavBar`
- `MaterialIcon`
- `ProfileHeaderCard`
- `MenuRow`
- `MangaPreviewCard`
- `ContributorRow`
- `CommentBubble`

Không copy lại shared component vào screen folder trừ khi cần behavior riêng rõ ràng.

## Checklist refactor một screen

1. Đọc toàn bộ `index.tsx`.
2. Xác định các khối UI lớn bằng comment hoặc layout.
3. Tạo `components/`.
4. Tách component ít phụ thuộc trước: top bar, section header, button/FAB.
5. Tách card/list item.
6. Tách data/types/helper nếu `index.tsx` vẫn dài.
7. Tạo `components/index.ts`.
8. Rút `index.tsx` về container + composition.
9. Chạy `npx tsc --noEmit` trong `mobile`.
10. Nếu typecheck fail ở file không liên quan, ghi rõ lỗi còn tồn tại.

## Ví dụ đã áp dụng

### `taskDetail`

- `TaskDetailTopBar`
- `TaskPreviewSection`
- `ReviewTabBar`
- `OverviewTab`
- `DiscussionTab`
- `ActionTab`
- `theme.ts`

Screen giữ `activeTab`, `comment`, navigation.

### `tasks`

- `TasksTopBar`
- `TasksSearchBar`
- `FilterChipBar`
- `TasksSectionHeader`
- `TaskCard`
- `AvatarStack`
- `PriorityBadge`
- `StatusBadge`
- `CreateTaskFab`
- `taskData.ts`
- `types.ts`
- `badgeStyles.ts`

Screen giữ `activeFilter`, `search`, `filteredTasks`, navigation.

### `profile`

- `ProfileTopBar`
- `ProfileHeaderSection`
- `ProfileMenuSection`

Screen giữ `handleMenuPress`, navigation, logout alert.

