import api from '@/lib/api';
import { compressImageFile } from '@/lib/image-upload';

export type Scope = 'SYS' | 'PRJ' | string;
export type ProgressStatus = 'PENDING' | 'INPROGRESS' | 'REVIEW' | 'DONE';

export type UserRole = {
  id: number;
  code: string;
  scope: Scope;
  name: string;
  isDefault: boolean;
};

export type UserProfile = {
  id: number;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  isActive: boolean;
  googleLinked: boolean;
  createdAt: string;
  updatedAt: string;
  roles: UserRole[];
};

export type UserProject = {
  id: number;
  name: string;
  description: string | null;
  imageUrl: string | null;
  editorBoardId: number | null;
  createdBy: number | null;
  updatedBy: number | null;
  createdAt: string;
  updatedAt: string;
  assignedAt: string;
  role: UserRole;
  projectStats: Array<{
    id: number;
    projectId: number;
    metrics: {
      progress: number;
      statusLabel: 'On Track' | 'Revision' | 'Blocked';
    };
    updatedAt: string;
  }>;
};

export type UserEditorBoard = {
  id: number;
  name: string;
  description: string | null;
  imageUrl: string | null;
  createdBy: number | null;
  updatedBy: number | null;
  createdAt: string;
  updatedAt: string;
  isLead: boolean;
};

export type UserActivity = {
  id: number;
  title: string;
  description: string | null;
  status: ProgressStatus;
  projectName: string;
  createdAt: string;
  updatedAt: string;
  timeLabel: string;
};

export type UpdateProfilePayload = {
  displayName: string;
  avatarUrl?: string;
};

export type UpdatePasswordPayload = {
  currentPassword: string;
  newPassword: string;
};

type ApiResponse<T> = {
  data: T;
};

type ApiUserProfile = Omit<UserProfile, 'googleLinked' | 'isActive' | 'roles'> & {
  googleLinked?: boolean;
  isActive?: boolean;
  roles?: UserRole[];
};

type ApiUserProject = Omit<UserProject, 'projectStats'> & {
  projectStats?: Array<{
    id: number;
    projectId: number;
    metrics: unknown;
    updatedAt: string;
  }>;
};

function unwrapData<T>(response: unknown): T {
  return (response as ApiResponse<T>).data ?? (response as T);
}

function normalizeProfile(user: ApiUserProfile): UserProfile {
  return {
    ...user,
    googleLinked: user.googleLinked ?? false,
    isActive: user.isActive ?? true,
    roles: user.roles ?? [],
  };
}

function normalizeProject(project: ApiUserProject): UserProject {
  const apiMetrics = project.projectStats?.[0]?.metrics as
    | { progress?: unknown; statusLabel?: unknown }
    | undefined;
  const progress = typeof apiMetrics?.progress === 'number' ? apiMetrics.progress : 0;
  const statusLabel =
    apiMetrics?.statusLabel === 'Revision' || apiMetrics?.statusLabel === 'Blocked'
      ? apiMetrics.statusLabel
      : 'On Track';

  return {
    ...project,
    projectStats: [
      {
        id: project.projectStats?.[0]?.id ?? project.id,
        metrics: {
          progress,
          statusLabel,
        },
        projectId: project.id,
        updatedAt: project.projectStats?.[0]?.updatedAt ?? project.updatedAt,
      },
    ],
  };
}

export async function getCurrentUserProfile() {
  const response = await api.get<ApiResponse<ApiUserProfile>, ApiResponse<ApiUserProfile>>(
    '/users/me',
  );

  return normalizeProfile(unwrapData<ApiUserProfile>(response));
}

export async function getCurrentUserProjects(userId?: number) {
  const targetUserId = userId ?? (await getCurrentUserProfile()).id;
  const response = await api.get<ApiResponse<ApiUserProject[]>, ApiResponse<ApiUserProject[]>>(
    `/users/${targetUserId}/projects`,
  );

  return unwrapData<ApiUserProject[]>(response).map(normalizeProject);
}

export async function getCurrentUserEditorBoards(userId?: number) {
  const targetUserId = userId ?? (await getCurrentUserProfile()).id;
  const response = await api.get<ApiResponse<UserEditorBoard[]>, ApiResponse<UserEditorBoard[]>>(
    `/users/${targetUserId}/editor-boards`,
  );

  return unwrapData<UserEditorBoard[]>(response);
}

export async function getCurrentUserActivities(): Promise<UserActivity[]> {
  return [];
}

export async function updateCurrentUserProfile(payload: UpdateProfilePayload) {
  const response = await api.patch<ApiResponse<ApiUserProfile>, ApiResponse<ApiUserProfile>>(
    '/users/me',
    payload,
  );

  return normalizeProfile(unwrapData<ApiUserProfile>(response));
}

export async function updateCurrentUserPassword(payload: UpdatePasswordPayload) {
  const response = await api.patch<ApiResponse<{ success: boolean }>, ApiResponse<{ success: boolean }>>(
    '/users/me/password',
    payload,
  );

  return unwrapData<{ success: boolean }>(response);
}

export async function uploadAvatarToDataUrl(file: File) {
  return {
    avatarUrl: await compressImageFile(file, {
      maxHeight: 320,
      maxInlineImageLength: 120_000,
      maxWidth: 320,
    }),
  };
}

export function getApiErrorMessage(error: unknown, fallback: string) {
  if (typeof error === 'object' && error && 'response' in error) {
    const response = (error as { response?: { data?: { message?: string | string[] } } }).response;
    const message = response?.data?.message;

    if (Array.isArray(message)) {
      return message.join(' ');
    }

    if (message) {
      return message;
    }
  }

  return error instanceof Error && error.message ? error.message : fallback;
}
