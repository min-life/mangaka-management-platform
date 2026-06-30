import { NotificationItem, NotificationSection, NotifFilter } from '@/src/types/notifications';

export const NOTIF_FILTERS: NotifFilter[] = [
  'All', 'Unread', 'Tasks', 'Reviews', 'Projects', 'Applications',
];

export const NOTIFICATION_SECTIONS: NotificationSection[] = [
  {
    sectionKey: 'today',
    label: 'Today',
    items: [
      {
        id: 'n1',
        icon: 'assignment',
        project: 'Dragon Blade',
        title: 'New task assigned',
        subtitle: 'Color Page 14 · Frame 2',
        time: '10m ago',
        isUnread: true,
        filter: 'Tasks',
      },
      {
        id: 'n2',
        icon: 'forum',
        project: 'Dragon Blade',
        title: 'Editor commented on Chapter 12',
        subtitle: 'Please fix the background shading.',
        time: '35m ago',
        isUnread: true,
        filter: 'Reviews',
      },
      {
        id: 'n3',
        icon: 'check_circle',
        project: 'Moonlight Ronin',
        title: 'Publishing request approved',
        subtitle: 'Chapter 08 is ready for publication.',
        time: '2h ago',
        isUnread: false,
        filter: 'Projects',
      },
    ],
  },
  {
    sectionKey: 'yesterday',
    label: 'Yesterday',
    items: [
      {
        id: 'n4',
        icon: 'description',
        project: 'Silent Sakura',
        title: 'Manuscript submitted for review',
        subtitle: 'Chapter 20 has been submitted.',
        time: 'Yesterday',
        isUnread: false,
        filter: 'Tasks',
      },
      {
        id: 'n5',
        icon: 'assignment',
        project: 'Silent Sakura',
        title: 'Task deadline updated',
        subtitle: 'Inking Page 7 · deadline moved to Friday.',
        time: 'Yesterday',
        isUnread: false,
        filter: 'Tasks',
      },
      {
        id: 'n6',
        icon: 'forum',
        project: 'Dragon Blade',
        title: 'New review request',
        subtitle: 'Chapter 11 pages ready for your review.',
        time: 'Yesterday',
        isUnread: false,
        filter: 'Reviews',
      },
    ],
  },
];
