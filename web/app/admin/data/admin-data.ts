export type AdminRole =
  | 'System Admin'
  | 'Publisher'
  | 'Editorial Board'
  | 'Tantou Editor'
  | 'Mangaka'
  | 'Assistant';

export type AdminUserStatus = 'Active' | 'Invited' | 'Disabled';

export type AdminUser = {
  id: number;
  name: string;
  email: string;
  role: AdminRole;
  status: AdminUserStatus;
  createdDate: string;
  initials: string;
  createdByCurrentAdmin: boolean;
};

export const ADMIN_NAV_ITEMS = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/users', label: 'Users' },
  { href: '/admin/roles', label: 'Roles' },
  { href: '/admin/settings', label: 'Settings' },
] as const;

export const ADMIN_USERS: AdminUser[] = [
  {
    id: 1,
    name: 'Elena Rostova',
    email: 'elena.r@mangaka.io',
    role: 'Tantou Editor',
    status: 'Active',
    createdDate: 'Oct 12, 2023',
    initials: 'ER',
    createdByCurrentAdmin: false,
  },
  {
    id: 2,
    name: 'Marcus Sterling',
    email: 'm.sterling@mangaka.io',
    role: 'Mangaka',
    status: 'Active',
    createdDate: 'Nov 05, 2023',
    initials: 'MS',
    createdByCurrentAdmin: false,
  },
  {
    id: 3,
    name: 'Nadia Park',
    email: 'nadia.p@mangaka.io',
    role: 'Editorial Board',
    status: 'Invited',
    createdDate: 'Jan 18, 2024',
    initials: 'NP',
    createdByCurrentAdmin: true,
  },
  {
    id: 4,
    name: 'Ryo Tanaka',
    email: 'ryo.t@mangaka.io',
    role: 'Assistant',
    status: 'Disabled',
    createdDate: 'Feb 21, 2024',
    initials: 'RT',
    createdByCurrentAdmin: true,
  },
];

export const ADMIN_ROLES = [
  {
    name: 'System Admin',
    members: 4,
    description: 'Full platform access for operational administrators.',
  },
  {
    name: 'Publisher',
    members: 9,
    description: 'Publication oversight with user and file review access.',
  },
  {
    name: 'Editorial Board',
    members: 12,
    description: 'Editorial review permissions for production coordination.',
  },
  {
    name: 'Tantou Editor',
    members: 18,
    description: 'Editor workflow access for assigned creator teams.',
  },
  {
    name: 'Mangaka',
    members: 46,
    description: 'Creator workspace access with limited admin visibility.',
  },
  {
    name: 'Assistant',
    members: 31,
    description: 'Support permissions for task and file collaboration.',
  },
] as const;

export const PERMISSION_RESOURCES = ['Users', 'Roles', 'Projects', 'Tasks', 'Files'] as const;

export const PERMISSION_ACTIONS = ['Create', 'Read', 'Update', 'Delete'] as const;

export const RECENT_ACTIVITIES = [
  {
    actor: 'Elena Rostova',
    action: 'updated Tantou Editor permissions',
    time: '12 min ago',
  },
  {
    actor: 'Nadia Park',
    action: 'invited 3 new assistants',
    time: '48 min ago',
  },
  {
    actor: 'System Admin',
    action: 'changed password policy',
    time: '2 hr ago',
  },
  {
    actor: 'Marcus Sterling',
    action: 'completed email verification',
    time: 'Today',
  },
] as const;

export const USER_GROWTH_POINTS = [32, 48, 44, 63, 58, 76, 92, 108, 124, 138, 146, 162] as const;
