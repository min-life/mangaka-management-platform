import { Colors } from '@/src/constants/colors';
import { WorkItem, ActivityItem } from '@/src/types/home';

/**
 * Data tĩnh cho màn hình Home
 */

export const WORK_ITEMS: WorkItem[] = [
  {
    id: 'tasks',
    icon: 'checklist',
    iconColor: Colors.iconTask,
    label: 'Tasks',
    badge: '8',
  },
  {
    id: 'projects',
    icon: 'folder',
    iconColor: Colors.iconFolder,
    label: 'Projects',
    badge: '5',
  },
  {
    id: 'applications',
    icon: 'send',
    iconColor: Colors.iconApp,
    label: 'Applications',
  },
  {
    id: 'editor-board',
    icon: 'groups',
    iconColor: Colors.text,
    label: 'Editor board',
  },
];

export const ACTIVITIES: ActivityItem[] = [
  {
    id: '1',
    icon: 'assignment',
    iconColor: Colors.statusProgress,
    bgColor: 'rgba(77,166,255,0.2)',
    title: 'New task assigned',
    subtitle: 'Clean page 14 frame 2',
    time: '2h ago',
    hasLine: true,
  },
  {
    id: '2',
    icon: 'comment',
    iconColor: Colors.statusReview,
    bgColor: 'rgba(255,184,77,0.2)',
    title: 'Editor commented',
    subtitle: 'Dragon Blade · Chapter 12',
    time: '5h ago',
    hasLine: true,
  },
  {
    id: '3',
    icon: 'cloud_upload',
    iconColor: Colors.statusDone,
    bgColor: 'rgba(93,211,158,0.2)',
    title: 'Manuscript submitted',
    subtitle: 'Moonlight Ronin · Chapter 08',
    time: '8h ago',
    hasLine: false,
  },
];
