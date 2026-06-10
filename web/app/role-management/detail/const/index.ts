import type { ComponentType } from 'react';
import { Archive, History, LayoutDashboard, LifeBuoy, UserCircle, UserCog } from 'lucide-react';

export type RoleDetailIcon = ComponentType<{ className?: string }>;

export const studioAvatar =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBMUFszGnkBoAx-ZVgBzxjoRU9A9_MYbbG2vh4ahvouxLBOANCbmjoeJwRkOECdVwNNb50NUzhEX3A6LZtqgFkBkud6YmUAMMIX06fM9yA2WlvtD_XwAS4WZQ14DASJctmbpvUAbUUb1YOoiV_JKKAd5Kma2zNcm3CCbyko5EBlJcVstP6wr1sMgMKvk93s3D7uZ40Bfpzyqx8Q95aDT7YzBz3e7wcgSGNthHVdT7f9OU3AH94-I6euAihA13704t20yp387dhpXPs';

export const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, active: false },
  { label: 'Role Management', icon: UserCog, active: true },
];

export const sidebarUtilityItems = [
  { label: 'Support', icon: LifeBuoy },
  { label: 'Archive', icon: Archive },
];

export const topNavItems = ['Timeline', 'Assets', 'Analytics'];

export const topActionItems = [
  { label: 'Notifications', icon: UserCircle },
  { label: 'History', icon: History },
  { label: 'Account', icon: UserCircle },
];

export const roleDetail = {
  roleName: '',
  roleCode: '',
  scope: '',
  company: '',
  project: '',
  status: 'Active Role',
  productionImage:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuCxRwxP7JhyfZ79-jWSnWqNszix7qvXlc0bQN9y0pN-C8NZvo3ex6yiUDK0YymeT4CBvrGDt8Ib3-Ps9w7OuDSrmoeqwBLRC-1pSW_l2bEQQUNco-tWceEo4hgaTA4vxUhLWdg6boGmPXwDqCqqpFnTwHPq6sLjHqVlvl8l3RWCiegyBfPbm_D5D4ii1joTJ8pGvovZ6ZTK7-u9ZDYkMNMCv-cjRcdfWKO0YJqg2chf1u6HON_z3OaenZrfL1oSYRDXrJVwYR2BTrw',
};

export const scopeOptions = [
  { label: 'System (SYS)', value: 'SYS' },
  { label: 'Company (CO)', value: 'CO' },
  { label: 'Project (PRJ)', value: 'PRJ' },
];

export const companyOptions = ['Shueisha Global', 'Kodansha Ltd.', 'Viz Media'];

export const projectOptions = [
  'One Piece: Red Horizon',
  'Jujutsu Kaisen: Cursed Spirits',
  'Spy x Family: Operation Strix',
];

export const permissionGroups = [
  {
    title: 'Project Permissions',
    permissions: [
      { label: 'View Project Details', checked: true },
      { label: 'Edit Project Metadata', checked: true },
    ],
  },
  {
    title: 'Task Permissions',
    permissions: [
      { label: 'Create New Task', checked: true },
      { label: 'Assign Task to Staff', checked: true },
      { label: 'Delete Task', checked: false },
    ],
  },
  {
    title: 'Comment Permissions',
    permissions: [
      { label: 'Create Review Comment', checked: true },
      { label: 'Delete Any Comment', checked: false },
    ],
  },
  {
    title: 'Member Permissions',
    permissions: [
      { label: 'Manage Project Members', checked: false },
      { label: 'Access Admin Panel (Restricted)', checked: false, disabled: true },
    ],
  },
];
