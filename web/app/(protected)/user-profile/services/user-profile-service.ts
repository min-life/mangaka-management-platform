import api from '@/lib/api';
import {
  formatActionTitle,
  formatActivityLogText,
  formatNotificationText,
  getEntityTypeLabel,
} from '@/lib/activity-message';
import { getActivityLogs, type ActivityLogResponse } from '@/services/activity-log.service';
import { getNotifications } from '@/services/notification.service';

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
  href: string | null;
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

export type CreatePasswordPayload = {
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
  const apiMetrics = project.projectStats?.[0]?.metrics as { progress?: unknown } | undefined;
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

export async function getGoogleLinkAccountUrl() {
  const response = await api.get<{ data: { url: string } }, { data: { url: string } }>(
    '/users/me/link-account',
  );

  return response.data.url;
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

// Activity/notification copy intentionally never references specific entity
// names (project/board/task names, invited or removed member names): those are
// looked up from data that can be renamed or deleted later, which would leave
// the historical feed pointing at nothing. Generic, name-free phrasing (via
// formatActivityLogText/formatNotificationText) stays valid forever.
export function mapActivityLogToUserActivity(
  activity: ActivityLogResponse,
  options?: {
    // True when this activity was surfaced via GET /notifications, i.e. it's
    // directed at the current viewer (not just something they themselves did).
    isDirectedAtViewer?: boolean;
  },
): UserActivity {
  const title = formatActionTitle(activity.action);
  const boardId =
    activity.editorBoardId ?? (activity.entityType === 'EDITOR_BOARD' ? activity.entityId : null);
  const linkedProjectId =
    activity.projectId ?? (activity.entityType === 'PROJECT' ? activity.entityId : null);
  const href = linkedProjectId
    ? `/studio/projects/${linkedProjectId}`
    : boardId
      ? `/studio/editor-boards/${boardId}`
      : null;
  const entityLabel = getEntityTypeLabel(activity.entityType);
  const description = options?.isDirectedAtViewer
    ? formatNotificationText({ activityLog: activity, id: activity.id }).description
    : formatActivityLogText(activity);

  return {
    id: activity.id,
    title,
    description,
    status: 'DONE',
    projectName: entityLabel.charAt(0).toUpperCase() + entityLabel.slice(1),
    href,
    createdAt: activity.createdAt,
    updatedAt: activity.createdAt,
    timeLabel: formatTimeLabel(activity.createdAt),
  };
}

// GET /activity-logs only returns logs where the current user is the actor, and
// GET /notifications (no pagination on that endpoint) is the only source for logs
// where the user is a participant (assigned, mentioned, project owner, etc). There
// is no backend endpoint that unions the two, so we merge them here: fetch a
// generous page of the user's own activity plus their full notification list, dedupe
// by activity log id (a user can be both actor and recipient), and sort by recency.
// Callers page through the result on the client (see ActivityTimeline in
// user-profile-page.tsx) instead of requesting further pages from the server.
const CONTEXT_ACTOR_ACTIVITY_LIMIT = 200;

export async function getCurrentUserContextActivities(): Promise<UserActivity[]> {
  const [actorResult, notifications] = await Promise.all([
    getActivityLogs({ limit: CONTEXT_ACTOR_ACTIVITY_LIMIT, page: 1 }),
    getNotifications(),
  ]);

  const activityById = new Map<number, ActivityLogResponse>();
  const notifiedActivityIds = new Set<number>();
  for (const activity of actorResult.activities) {
    activityById.set(activity.id, activity);
  }
  for (const notification of notifications) {
    if (notification.activityLog) {
      activityById.set(notification.activityLog.id, notification.activityLog);
      notifiedActivityIds.add(notification.activityLog.id);
    }
  }

  return [...activityById.values()]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .map((activity) =>
      mapActivityLogToUserActivity(activity, {
        isDirectedAtViewer: notifiedActivityIds.has(activity.id),
      }),
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
  const response = await api.patch<
    ApiResponse<{ success: boolean }>,
    ApiResponse<{ success: boolean }>
  >('/users/me/password', payload);

  return unwrapData<{ success: boolean }>(response);
}

export async function hasCurrentUserPassword() {
  const response = await api.get<
    ApiResponse<{ hasPassword: boolean }>,
    ApiResponse<{ hasPassword: boolean }>
  >('/users/me/has-password');

  return unwrapData<{ hasPassword: boolean }>(response).hasPassword ?? false;
}

export async function createCurrentUserPassword(payload: CreatePasswordPayload) {
  const response = await api.post<
    ApiResponse<{ success: boolean }>,
    ApiResponse<{ success: boolean }>
  >('/users/me/password', payload);

  return unwrapData<{ success: boolean }>(response);
}

export async function uploadAvatarImage(file: File) {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    throw new Error('Cloudinary is not configured.');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);
  formData.append('folder', 'avatars');

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    { body: formData, method: 'POST' },
  );

  if (!response.ok) {
    throw new Error('Unable to upload avatar image.');
  }

  const data = (await response.json()) as { secure_url?: string };

  if (!data.secure_url) {
    throw new Error('Unable to upload avatar image.');
  }

  return { avatarUrl: data.secure_url };
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
