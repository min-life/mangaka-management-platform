/**
 * Types cho màn hình Home
 */

export interface WorkItem {
  id: string;
  icon: string;
  iconColor: string;
  label: string;
  badge?: string;
}

export interface ActivityItem {
  id: string;
  icon: string;
  iconColor: string;
  bgColor: string;
  title: string;
  subtitle: string;
  time: string;
  hasLine: boolean;
}
