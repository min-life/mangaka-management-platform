import type { ComponentType } from 'react';
import {
  Archive,
  CloudUpload,
  HelpCircle,
  Languages,
  LayoutDashboard,
  PenTool,
  Settings,
  Shield,
  ShieldCheck,
  SlidersHorizontal,
  UserCog,
} from 'lucide-react';

export type RoleManagementIcon = ComponentType<{ className?: string }>;

export const studioAvatar =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBMUFszGnkBoAx-ZVgBzxjoRU9A9_MYbbG2vh4ahvouxLBOANCbmjoeJwRkOECdVwNNb50NUzhEX3A6LZtqgFkBkud6YmUAMMIX06fM9yA2WlvtD_XwAS4WZQ14DASJctmbpvUAbUUb1YOoiV_JKKAd5Kma2zNcm3CCbyko5EBlJcVstP6wr1sMgMKvk93s3D7uZ40Bfpzyqx8Q95aDT7YzBz3e7wcgSGNthHVdT7f9OU3AH94-I6euAihA13704t20yp387dhpXPs';

export const memberAvatars = [
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBUpCdFdMpftczNQbDMvYmFubDpjE0MNIvpC6i9FzgmK7okT-o9tgTCVL0mQkY9ycdJJwqQaPqDJw-vWrD_uhviErpBx4lIuhChVSzXHVw-ft1NTqsSRTSlE6IWDWBoduItmkFXhPA-izm0Gb9TGekwox95fGSQYSsCghvbfxBqzJLcIRzNNiwMyZxtiVa3yaVQp22noaBWqWxYfWTzP-2ZqVq3d2JChsyOW9gKE194MzfY1wxdY0ibEe7PL2JbO8unwhsN49WjGxg',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuAMm8k9JTuQgo8mzyLY_X8ze1Mua2ss6RL0cLBDlnCPW0YApvPeT6zZ9WOxk_rNVly0ENYD1mDjfr-1ZrIfRqAKmAkyqub4pK33WekhhMnh0PWFO6SKAQtgiAbVGu5TuH2OBR8u-JUC9cGYnRUiXKRfnIhOnk7xYEnLdXp22WKNsVa1gf4bWPxczhbGBc-7Etqos-v1gYDATMFf1ORzF2-ids4BhvnZDCZW5rBcZiP95mwUrA0ANc-EM31z3kRAZzyVUh7Gvx7Mv2Q',
];

export const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, active: false },
  { label: 'Role Management', icon: UserCog, active: true },
];

export const sidebarUtilityItems = [
  { label: 'Support', icon: HelpCircle },
  { label: 'Archive', icon: Archive },
];

export const topNavItems = ['Timeline', 'Assets', 'Analytics'];

export const stats = [
  { label: 'Total Roles', value: '12' },
  { label: 'Active Users', value: '48' },
  { label: 'System Scoped', value: '3' },
  { label: 'Unassigned', value: '2' },
];

export const tableHeadings = [
  'Role Name',
  'Role Code',
  'Scope',
  'Members',
  'Created At',
  'Actions',
];

export const roles = [
  {
    name: 'Lead Editor',
    code: 'LEAD_ED',
    scope: 'SYS',
    members: 'avatars',
    createdAt: 'Oct 24, 2023',
    icon: ShieldCheck,
    highlighted: true,
  },
  {
    name: 'Assistant B',
    code: 'ASST_B',
    scope: 'PRJ',
    members: '14',
    createdAt: 'Nov 12, 2023',
    icon: PenTool,
  },
  {
    name: 'Localization Lead',
    code: 'LOC_LD',
    scope: 'CO',
    members: '3',
    createdAt: 'Jan 05, 2024',
    icon: Languages,
  },
  {
    name: 'Quality Control',
    code: 'QC_SPEC',
    scope: 'PRJ',
    members: '8',
    createdAt: 'Feb 28, 2024',
    icon: SlidersHorizontal,
  },
  {
    name: 'Archive Manager',
    code: 'ARCH_MGR',
    scope: 'CO',
    members: '2',
    createdAt: 'Mar 15, 2024',
    icon: Archive,
  },
];

export const toolbarItems = [
  { label: 'Bulk Import', icon: CloudUpload },
  { label: 'Audits', icon: Shield },
  { label: 'Matrix', icon: Settings },
];
