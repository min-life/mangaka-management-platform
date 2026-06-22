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
  name: string;
  type: ProjectType;
  editorBoard: string;
  currentUserRole: string;
  activeMembers: number;
  stars: number;
  forks: number;
  url: string;
  branch: string;
  rootFolders: number;
  files: number;
  materials: number;
  applications: ProjectApplicationSummary;
  tasks: ProjectTaskSummary;
  contributors: number;
  stats: ProjectStatsSummary;
  language: string;
  languageColor: string;
  avatarInitials: string;
  avatarBg: string;
}
