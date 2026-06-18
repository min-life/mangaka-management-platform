/**
 * Types cho màn hình Notification Inbox
 */

export type NotifFilter = 'All' | 'Unread' | 'Tasks' | 'Reviews' | 'Projects' | 'Applications';

export interface NotificationItem {
  id: string;
  icon: string;
  project: string;
  title: string;
  subtitle: string;
  time: string;
  isUnread: boolean;
  filter: Exclude<NotifFilter, 'All' | 'Unread'>;
}

export interface NotificationSection {
  sectionKey: string;
  label: string;
  items: NotificationItem[];
}
