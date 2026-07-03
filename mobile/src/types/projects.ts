export type ProjectType = 'Manga' | 'Tooling' | 'Service';

export interface ProjectApplicationSummary {
  pending: number;
  approved: number;
  rejected: number;
  cancelled: number;
}

export interface ProjectTaskSummary {
  pending: number;
  inProgress: number;
  review: number;
  done: number;
}

export interface ProjectStatsSummary {
  pagesReviewed: number;
  frameComments: number;
  completionRate: number;
  lastUpdated: string;
}

export interface ProjectItem {
  id: string;
  owner: string;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
  name: string;
  description?: string;
  type: ProjectType;
  editorBoard: string;
  editorBoardLeaderName: string;
  editorBoardLeaderAvatarUri?: string;
  editorBoardLeaderInitials: string;
  currentUserRole: string;
  activeMembers: number;
  stars: number;
  forks: number;
  url: string;
  branch: string;
  rootFolders: number;
  files: number;
  folders: number;
  materials: number;
  applications: ProjectApplicationSummary;
  applicationTotal: number;
  tasks: ProjectTaskSummary;
  taskTotal: number;
  contributors: number;
  stats: ProjectStatsSummary;
  language: string;
  languageColor: string;
  avatarInitials: string;
  avatarBg: string;
  coverUri?: string;
}

export interface ProjectMemberItem {
  id: string;
  avatarUri?: string | null;
  email: string;
  initials: string;
  joinedAtLabel: string;
  name: string;
  numberOfTasks: number;
  roleCode: string;
  roleName: string;
  taskOverview?: {
    done?: number;
    inprogress?: number;
    pending?: number;
    review?: number;
    total?: number;
  } | null;
}
