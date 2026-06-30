import { Colors } from '@/src/constants/colors';

import { Priority, TaskStatus } from './types';

export const PRIORITY_STYLES: Record<Priority, { bg: string; text: string }> = {
  HIGH: { bg: '#ba1a1a', text: '#ffffff' },
  MEDIUM: { bg: Colors.iconFolder, text: '#ffffff' },
  LOW: { bg: 'transparent', text: 'rgba(237,241,251,0.6)' },
};

export const STATUS_STYLES: Record<TaskStatus, { bg: string; text: string }> = {
  'In Progress': { bg: '#222831', text: Colors.text },
  Review: { bg: '#222831', text: Colors.text },
  Pending: { bg: Colors.bg, text: 'rgba(237,241,251,0.6)' },
  Done: { bg: 'rgba(93,211,158,0.15)', text: Colors.statusDone },
};

