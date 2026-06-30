import type { EditorBoardProject } from '../services/editor-board-projects-service';

const avatars = [
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=96&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=96&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=96&auto=format&fit=crop',
];

export const projects: EditorBoardProject[] = [
  {
    applicationsCount: 3,
    contactName: 'T. Nakajima',
    createdAt: '2026-01-08T08:00:00.000Z',
    description: 'Weekly action serialization managed by the editorial board.',
    editorBoardId: 1,
    id: 101,
    imageUrl:
      'https://images.unsplash.com/photo-1518709268805-4e9042af2176?q=80&w=240&auto=format&fit=crop',
    imprintName: 'Weekly Shonen Monolith',
    members: [
      { avatarUrl: avatars[0], displayName: 'Aoi Kimura', id: 1, roleName: 'Lead Artist' },
      { avatarUrl: avatars[1], displayName: 'T. Nakajima', id: 2, roleName: 'Editor' },
    ],
    name: 'Crimson Horizon',
    nextDeadline: '2026-07-15',
    projectStats: [
      {
        id: 201,
        metrics: {
          cycleTimeDays: 5.8,
          progress: 75,
          status: 'IN_PRODUCTION',
          targetChapter: 'Chapter 42',
        },
        projectId: 101,
        updatedAt: '2026-06-26T10:30:00.000Z',
      },
    ],
    publishingStatus: 'LIVE',
    updatedAt: '2026-06-26T10:30:00.000Z',
  },
  {
    applicationsCount: 0,
    contactName: 'M. Sato',
    createdAt: '2026-02-12T08:00:00.000Z',
    description: 'Cyberpunk monthly series currently in board review.',
    editorBoardId: 1,
    id: 102,
    imageUrl:
      'https://images.unsplash.com/photo-1519608487953-e999c86e7455?q=80&w=240&auto=format&fit=crop',
    imprintName: 'Slate Digital Monthly',
    members: [
      { avatarUrl: avatars[1], displayName: 'M. Sato', id: 3, roleName: 'Storyboard Editor' },
      { avatarUrl: avatars[2], displayName: 'Ren Ito', id: 4, roleName: 'Assistant Editor' },
    ],
    name: 'Shadow Protocol',
    nextDeadline: '2026-07-18',
    projectStats: [
      {
        id: 202,
        metrics: {
          cycleTimeDays: 7.2,
          progress: 30,
          status: 'STORYBOARDING',
          targetChapter: 'Chapter 12 (Boarding)',
        },
        projectId: 102,
        updatedAt: '2026-06-25T15:12:00.000Z',
      },
    ],
    publishingStatus: 'PENDING_APPROVAL',
    updatedAt: '2026-06-25T15:12:00.000Z',
  },
  {
    applicationsCount: 12,
    contactName: 'K. Tanaka',
    createdAt: '2026-04-03T08:00:00.000Z',
    description: 'Pilot title under review for relaunch planning.',
    editorBoardId: 1,
    id: 103,
    imageUrl:
      'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?q=80&w=240&auto=format&fit=crop',
    imprintName: 'New Talent Showcase',
    members: [
      { avatarUrl: avatars[0], displayName: 'K. Tanaka', id: 5, roleName: 'Lead Editor' },
      { avatarUrl: avatars[2], displayName: 'Y. Mori', id: 6, roleName: 'Production Manager' },
    ],
    name: 'Void Walker',
    nextDeadline: '2026-08-01',
    projectStats: [
      {
        id: 203,
        metrics: {
          cycleTimeDays: 6.1,
          progress: 5,
          status: 'HIATUS',
          targetChapter: 'Chapter 0 (Pilot)',
        },
        projectId: 103,
        updatedAt: '2026-06-22T09:45:00.000Z',
      },
    ],
    publishingStatus: 'SCHEDULED',
    updatedAt: '2026-06-22T09:45:00.000Z',
  },
];
