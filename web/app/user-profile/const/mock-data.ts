import type {
  UserActivity,
  UserEditorBoard,
  UserProfile,
  UserProject,
} from '../services/user-profile-service';

export const mockCurrentUser: UserProfile = {
  id: 7,
  email: 'kenji.sato@monolith-studio.com',
  displayName: 'Kenji Sato',
  avatarUrl:
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=320&h=320&fit=crop&crop=face',
  isActive: true,
  googleLinked: true,
  createdAt: '2026-01-12T08:30:00.000Z',
  updatedAt: '2026-06-20T10:45:00.000Z',
  roles: [
    {
      id: 3,
      code: 'senior_editor',
      scope: 'SYS',
      name: 'Senior Editor',
      isDefault: false,
    },
  ],
};

export const mockProjects: UserProject[] = [
  {
    id: 45,
    name: 'Shadow Protocol: Redux',
    description: 'Lead Editor - Chapter 45 In-Review',
    imageUrl: 'https://images.unsplash.com/photo-1612036782180-6f0b6cd846fe?w=512&h=720&fit=crop',
    editorBoardId: 11,
    createdBy: 7,
    updatedBy: 7,
    createdAt: '2026-03-02T09:00:00.000Z',
    updatedAt: '2026-06-24T14:20:00.000Z',
    assignedAt: '2026-03-02T09:00:00.000Z',
    role: {
      id: 8,
      code: 'lead_editor',
      scope: 'PRJ',
      name: 'Lead Editor',
      isDefault: false,
    },
    projectStats: [
      {
        id: 88,
        projectId: 45,
        metrics: { progress: 72 },
        updatedAt: '2026-06-24T14:20:00.000Z',
      },
    ],
  },
  {
    id: 46,
    name: 'Cyber-District 9',
    description: 'Project Manager - Final Proofing',
    imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=512&h=720&fit=crop',
    editorBoardId: 12,
    createdBy: 7,
    updatedBy: 7,
    createdAt: '2026-02-18T11:15:00.000Z',
    updatedAt: '2026-06-25T09:35:00.000Z',
    assignedAt: '2026-02-18T11:15:00.000Z',
    role: {
      id: 9,
      code: 'project_manager',
      scope: 'PRJ',
      name: 'Project Manager',
      isDefault: false,
    },
    projectStats: [
      {
        id: 89,
        projectId: 46,
        metrics: { progress: 94 },
        updatedAt: '2026-06-25T09:35:00.000Z',
      },
    ],
  },
];

export const mockEditorBoards: UserEditorBoard[] = [
  {
    id: 11,
    name: 'Shonen Weekly Board',
    description: 'Primary HQ - 12 Active Titles',
    imageUrl: null,
    createdBy: 7,
    updatedBy: 7,
    createdAt: '2026-01-20T07:45:00.000Z',
    updatedAt: '2026-06-19T13:15:00.000Z',
    isLead: true,
  },
  {
    id: 12,
    name: 'Concept Review Panel',
    description: 'Design Group - Weekly Cycle',
    imageUrl: null,
    createdBy: 7,
    updatedBy: 7,
    createdAt: '2026-02-04T10:00:00.000Z',
    updatedAt: '2026-06-18T16:10:00.000Z',
    isLead: false,
  },
  {
    id: 13,
    name: 'Tankobon Assembly',
    description: 'Release Cycle - Q4 Planning',
    imageUrl: null,
    createdBy: 7,
    updatedBy: 7,
    createdAt: '2026-04-11T08:00:00.000Z',
    updatedAt: '2026-06-17T12:20:00.000Z',
    isLead: false,
  },
];

export const mockActivities: UserActivity[] = [
  {
    id: 144,
    title: 'Approved Chapter 44 Script',
    description:
      'Pacing is perfect. The cliffhanger at the end of page 22 will resonate well with the audience.',
    status: 'DONE',
    projectName: 'Shadow Protocol: Redux',
    createdAt: '2026-06-26T07:00:00.000Z',
    updatedAt: '2026-06-26T09:00:00.000Z',
    timeLabel: '2h ago',
  },
  {
    id: 145,
    title: 'Submitted Revision Request',
    description: 'Cyber-District 9 - Artist: T. Kurosawa',
    status: 'REVIEW',
    projectName: 'Cyber-District 9',
    createdAt: '2026-06-25T10:00:00.000Z',
    updatedAt: '2026-06-25T11:10:00.000Z',
    timeLabel: 'Yesterday',
  },
  {
    id: 146,
    title: 'Joined Tankobon Assembly Board',
    description: 'System Invitation',
    status: 'DONE',
    projectName: 'Tankobon Assembly',
    createdAt: '2026-06-23T08:30:00.000Z',
    updatedAt: '2026-06-23T08:30:00.000Z',
    timeLabel: '3 days ago',
  },
];
