import React from 'react';
import { MaterialIcons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';

/**
 * Kiểu tên icon lấy thẳng từ MaterialIcons để TypeScript kiểm tra.
 */
export type MaterialIconName = ComponentProps<typeof MaterialIcons>['name'];

/**
 * Map từ tên Material Symbols (dùng trong Stitch/web) → tên MaterialIcons
 * tương đương trong @expo/vector-icons.
 *
 * Cách thêm icon mới:
 *   1. Tìm tên icon trên https://fonts.google.com/icons
 *   2. Thêm entry vào ICON_MAP bên dưới
 *   3. TypeScript sẽ báo lỗi nếu tên không hợp lệ
 */
const ICON_MAP: Record<string, MaterialIconName> = {
  // ── Navigation ─────────────────────────────────────────────
  mail: 'mail-outline',
  dashboard: 'dashboard',
  home: 'home',
  lock: 'lock-outline',

  // ── Work Items ─────────────────────────────────────────────
  checklist: 'checklist',
  folder: 'folder-open',
  send: 'send',
  groups: 'groups',

  // ── Activity Feed ──────────────────────────────────────────
  assignment: 'assignment',
  comment: 'comment',
  cloud_upload: 'cloud-upload',

  // ── Header / Actions ──────────────────────────────────────
  search: 'search',
  add: 'add',
  link: 'link',
  fork: 'call-split',
  bell: 'notifications-none',
  code: 'code',
  file: 'insert-drive-file',
  article: 'article',
  image: 'image',
  close: 'close',
  check: 'check',

  // ── Tasks Screen ──────────────────────────────────────────
  calendar_today: 'calendar-today',
  filter_list: 'filter-list',

  // ── Task Detail & Review Screen ────────────────────────────
  share: 'share',
  visibility: 'visibility',
  visibility_off: 'visibility-off',
  zoom_in: 'zoom-in',
  check_circle: 'check-circle',
  cancel: 'cancel',
  edit_note: 'edit',
  expand_more: 'expand-more',
  expand_less: 'expand-less',
  frame_person: 'crop-free',

  // ── Common ────────────────────────────────────────────────
  person: 'person-outline',
  settings: 'settings',
  notifications: 'notifications',
  chevron_right: 'chevron-right',
  apps: 'apps',
  group_add: 'group-add',

  // ── Profile Screen ──────────────────────────────────────
  apartment: 'apartment',
  forum: 'forum',
  description: 'description',
  security: 'security',
  palette: 'palette',
  help: 'help-outline',
  logout: 'logout',

  // ── Notifications Screen ────────────────────────────────
  done_all: 'done-all',
  arrow_forward: 'arrow-forward-ios',
  arrow_back: 'arrow-back-ios',
  more_vert: 'more-vert',
  edit: 'edit',
  delete: 'delete-outline',
  filter: 'filter-list',
  sort: 'sort',
  attach: 'attach-file',
  star: 'star-outline',
  info: 'info-outline',
  warning: 'warning-amber',
  error: 'error-outline',
  assessment: 'assessment',
  view_list: 'view-list',
  view_module: 'view-module',
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface MaterialIconProps {
  /** Tên icon theo cú pháp Material Symbols (snake_case), VD: 'cloud_upload' */
  name: string;
  /** Màu icon, mặc định inherit từ parent */
  color?: string;
  /** Kích thước icon tính bằng px, mặc định 24 */
  size?: number;
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * MaterialIcon — Wrapper icon dùng chung toàn app.
 *
 * Sử dụng @expo/vector-icons (MaterialIcons) để render icon thật 1:1.
 * Tên icon dùng cú pháp Material Symbols (snake_case) giống Stitch/web.
 *
 * @example
 * <MaterialIcon name="cloud_upload" color="#5DD39E" size={20} />
 */
export default function MaterialIcon({ name, color, size = 24 }: MaterialIconProps) {
  const iconName = ICON_MAP[name];

  if (!iconName) {
    // Fallback khi icon chưa được map — dễ phát hiện khi dev
    console.warn(`[MaterialIcon] Icon "${name}" is not defined in ICON_MAP.`);
    return <MaterialIcons name="help-outline" size={size} color={color ?? '#EDF1FB'} />;
  }

  return <MaterialIcons name={iconName} size={size} color={color ?? '#EDF1FB'} />;
}
