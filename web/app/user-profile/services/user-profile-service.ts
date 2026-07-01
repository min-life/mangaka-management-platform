import api from '@/lib/api';
import { compressImageFile } from '@/lib/image-upload';
import { getActivityLogs, type ActivityLogResponse } from '@/services/activity-log.service';

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
    | { progress?: unknown }
    | undefined;
  const progress = typeof apiMetrics?.progress === 'number' ? apiMetrics.progress : 0;

  return {
    ...project,
    projectStats: [
      {
        id: project.projectStats?.[0]?.id ?? project.id,
        metrics: {
          progress,
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

function formatActionTitle(action: string) {
  return action
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function formatTimeLabel(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('en', {
    hour: '2-digit',
    minute: '2-digit',
    month: 'short',
    day: '2-digit',
  }).format(date);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function getMetadataLabel(metadata: unknown, keys: string[]) {
  if (!isRecord(metadata)) {
    return null;
  }

  for (const key of keys) {
    const value = metadata[key];
    if (typeof value === 'string' && value.trim()) {
      return value;
    }
  }

  return null;
}

export function mapActivityLogToUserActivity(
  activity: ActivityLogResponse,
  options?: {
    editorBoards?: UserEditorBoard[];
  },
): UserActivity {
  const title = formatActionTitle(activity.action);
  const boardId =
    activity.editorBoardId ??
    (activity.entityType === 'EDITOR_BOARD' ? activity.entityId : null);
  const editorBoardName =
    getMetadataLabel(activity.metadata, ['editorBoardName']) ??
    options?.editorBoards?.find((board) => board.id === boardId)?.name ??
    null;
  const projectName =
    getMetadataLabel(activity.metadata, ['projectName', 'fileName', 'folderName']) ??
    editorBoardName ??
    (activity.projectId
      ? `Project #${activity.projectId}`
      : boardId
        ? `Editor Board #${boardId}`
        : activity.entityType);
  const actorName =
    activity.actor?.displayName ?? activity.actor?.email ?? `User #${activity.actorId}`;
  const entityName =
    activity.entityType === 'EDITOR_BOARD' && editorBoardName
      ? `editor board "${editorBoardName}"`
      : `${activity.entityType.toLowerCase().replaceAll('_', ' ')} #${activity.entityId}`;

  return {
    id: activity.id,
    title,
    description: `${actorName} performed ${title.toLowerCase()} on ${entityName}.`,
    status: 'DONE',
    projectName,
    createdAt: activity.createdAt,
    updatedAt: activity.createdAt,
    timeLabel: formatTimeLabel(activity.createdAt),
  };
}

export async function getCurrentUserActivities(editorBoards?: UserEditorBoard[]): Promise<UserActivity[]> {
  const result = await getActivityLogs({ limit: 3, page: 1 });
  return result.activities.map((activity) =>
    mapActivityLogToUserActivity(activity, { editorBoards }),
  );
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
