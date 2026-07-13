/**
 * Types cho màn hình Profile
 */

export interface ProfileStat {
  id: string;
  value: string;
  label: string;
}

export interface WorkSummaryItem {
  id: string;
  icon: string;
  label: string;
  badge: string;
  onPress?: string; // route name
}

export interface AccountMenuItem {
  badge?: string;
  id: string;
  icon: string;
  label: string;
  isDestructive?: boolean;
}
