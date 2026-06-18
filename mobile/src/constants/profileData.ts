import { ProfileStat, WorkSummaryItem, AccountMenuItem } from '@/src/types/profile';

export const PROFILE_USER = {
  name: 'Dương Minh Kiệt',
  email: 'kietdm@example.com',
  role: 'Mangaka',
  studio: 'Min-Life Studio',
  avatarUri:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuDopfD7ujZ_8bn2FgwGmknc6Pu_F4EW5rmTifgQeDrIIxVf7viymgp6XHEaGBDfsYamaGhWpPe0fce8Sv8a0l3-Dx4Fm7gw2P6KBf6vgwHiVaZ6a2vQA_b2WzKrkZFdlAvvgdehsBC8uPjtRu5EswU-cbwq25Qc2ZT7FnoZ27o6MtZORoHaCqx0DflfiVhQY4ypZn20E2CTLFUbX0DRn17A0acHxcTCIn2SL_Us1KgRHclf-0nvWmmUhvAkx2-Pu-jLXe9PfWGkyK-k',
};

export const PROFILE_STATS: ProfileStat[] = [
  { id: 'tasks',    value: '8',  label: 'Tasks'    },
  { id: 'reviews',  value: '3',  label: 'Reviews'  },
  { id: 'projects', value: '5',  label: 'Projects' },
];

export const WORK_SUMMARY_ITEMS: WorkSummaryItem[] = [
  { id: 'tasks',       icon: 'checklist',   label: 'Assigned Tasks',       badge: '8'  },
  { id: 'reviews',     icon: 'forum',       label: 'Review Queue',         badge: '3'  },
  { id: 'projects',    icon: 'folder',      label: 'Active Projects',      badge: '5'  },
  { id: 'manuscripts', icon: 'description', label: 'Submitted Manuscripts', badge: '12' },
];

export const ACCOUNT_MENU_ITEMS: AccountMenuItem[] = [
  { id: 'info',         icon: 'person',        label: 'Personal Information' },
  { id: 'notifs',       icon: 'notifications', label: 'Notifications'        },
  { id: 'security',     icon: 'security',      label: 'Security'             },
  { id: 'appearance',   icon: 'palette',       label: 'Appearance'           },
  { id: 'help',         icon: 'help',          label: 'Help & Support'       },
  { id: 'logout',       icon: 'logout',        label: 'Sign Out', isDestructive: true },
];
