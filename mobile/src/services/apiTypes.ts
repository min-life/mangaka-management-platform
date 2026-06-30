export interface PaginationResponse {
  limit: number;
  page: number;
  total: number;
  totalPages: number;
}

export interface ApiDataResponse<T> {
  data?: T;
}

export interface ApiListResponse<T> {
  data?: T[];
  pagination?: PaginationResponse;
}

export interface ApiUserSummary {
  avatarUrl?: string | null;
  displayName?: string | null;
  email?: string;
  id: number;
}

export interface ApiProject {
  createdAt: string;
  createdBy?: number | null;
  createdByUser?: ApiUserSummary | null;
  description?: string | null;
  editorBoard?: ApiEditorBoard | null;
  editorBoardId?: number | null;
  id: number;
  imageUrl?: string | null;
  name: string;
  updatedAt: string;
  updatedBy?: number | null;
  updatedByUser?: ApiUserSummary | null;
  userProjects?: Array<{
    role?: { code?: string; name?: string };
    user?: ApiUserSummary;
  }>;
  _count?: {
    applications?: number;
    files?: number;
    folders?: number;
    materials?: number;
    tasks?: number;
    userProjects?: number;
  };
}

export interface ApiEditorBoard {
  createdAt: string;
  createdBy?: number | null;
  createdByUser?: ApiUserSummary | null;
  description?: string | null;
  id: number;
  imageUrl?: string | null;
  name: string;
  updatedAt: string;
  updatedBy?: number | null;
  updatedByUser?: ApiUserSummary | null;
  _count?: {
    projects?: number;
    members?: number;
  };
}

export interface ApiFolder {
  createdAt: string;
  createdBy?: number | null;
  createdByUser?: ApiUserSummary | null;
  description?: string | null;
  id: number;
  parent?: { id: number; title: string } | null;
  parentId?: number | null;
  project?: { id: number; name: string } | null;
  projectId?: number;
  title: string;
  updatedAt: string;
  updatedBy?: number | null;
  updatedByUser?: ApiUserSummary | null;
}

export interface ApiFile {
  createdAt: string;
  createdBy?: number | null;
  createdByUser?: ApiUserSummary | null;
  description?: string | null;
  folder?: { id: number; title: string } | null;
  folderId?: number;
  id: number;
  title: string;
  updatedAt: string;
  updatedBy?: number | null;
  updatedByUser?: ApiUserSummary | null;
}

export type ApiTaskStatus = 'DONE' | 'INPROGRESS' | 'PENDING' | 'REVIEW';

export interface ApiTask {
  assignedBy?: number | null;
  assignedByUser?: ApiUserSummary | null;
  createdAt: string;
  createdBy?: number | null;
  createdByUser?: ApiUserSummary | null;
  deadline?: string | null;
  description?: string | null;
  file?: ApiFile;
  fileId?: number;
  id: number;
  parentId?: number | null;
  status: ApiTaskStatus;
  title: string;
  updatedAt: string;
  updatedBy?: number | null;
  updatedByUser?: ApiUserSummary | null;
}

export interface ApiFrame {
  createdAt: string;
  createdBy?: number | null;
  createdByUser?: ApiUserSummary | null;
  endX: number | string;
  endY: number | string;
  id: number;
  startX: number | string;
  startY: number | string;
  task?: { id: number; title: string };
  taskId?: number;
  updatedAt: string;
}

export interface ApiComment {
  content?: { text?: string; mentions?: string[]; attachments?: unknown[] } | string;
  createdAt: string;
  createdByUser?: ApiUserSummary | null;
  frameId?: number | null;
  id: number;
  updatedAt: string;
}

export interface ApiMaterial {
  createdAt: string;
  createdBy?: number | null;
  createdByUser?: ApiUserSummary | null;
  file?: ApiFile | null;
  fileId?: number;
  id: number;
  materials?: Record<string, unknown>;
  updatedAt: string;
  updatedBy?: number | null;
  updatedByUser?: ApiUserSummary | null;
}

export type ApiApplicationType = 'MANUSCRIPT_REVIEW' | 'PUBLISH_REQUEST';
export type ApiApplicationStatus =
  | 'APPROVE'
  | 'CANCELLED'
  | 'INTERNAL_APPROVED'
  | 'PENDING'
  | 'REJECT'
  | 'SUBMITTED';

export interface ApiApplication {
  createdAt: string;
  createdByUser?: ApiUserSummary | null;
  description?: string | null;
  id: number;
  materials?: unknown;
  project?: ApiProject | { id: number; name: string } | null;
  projectId?: number;
  status: ApiApplicationStatus;
  title: string;
  type: ApiApplicationType;
  updatedAt: string;
  updatedByUser?: ApiUserSummary | null;
  verifiedByUser?: ApiUserSummary | null;
}

export interface ApiNotification {
  createdAt?: string;
  id: number;
  isRead?: boolean;
  message?: string;
  project?: { name?: string } | null;
  title?: string;
  type?: string;
  updatedAt?: string;
}

