import api from '@/lib/api';
import { compressImageFile } from '@/lib/image-upload';
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

// Resolves a participant's display label from either a full user object
// (present when the backend already enriched the metadata, e.g. editor-board
// member events) or a raw numeric id (all we get for other actions/scopes).
function getActivityParticipantName(value: unknown, fallbackId?: unknown): string | null {
  if (isRecord(value)) {
    const displayName = value.displayName;
    const email = value.email;
    const id = value.id;

    if (typeof displayName === 'string' && displayName.trim()) {
      return displayName;
    }

    if (typeof email === 'string' && email.trim()) {
      return email;
    }

    if (typeof id === 'number') {
      return `User #${id}`;
    }
  }

  return typeof fallbackId === 'number' ? `User #${fallbackId}` : null;
}

function formatUserNameList(names: string[]): string | null {
  if (names.length === 0) {
    return null;
  }

  if (names.length === 1) {
    return names[0];
  }

  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

export function mapActivityLogToUserActivity(
  activity: ActivityLogResponse,
  options?: {
    editorBoards?: UserEditorBoard[];
  },
): UserActivity {
  const title = formatActionTitle(activity.action);
  const metadata = isRecord(activity.metadata) ? activity.metadata : {};
  const boardId =
    activity.editorBoardId ?? (activity.entityType === 'EDITOR_BOARD' ? activity.entityId : null);
  const editorBoardName =
    options?.editorBoards?.find((board) => board.id === boardId)?.name ?? null;
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
  const resolvedEntityName = getMetadataLabel(activity.metadata, ['entityName']);
  const entityLabel = activity.entityType.toLowerCase().replaceAll('_', ' ');
  const entityName =
    activity.entityType === 'EDITOR_BOARD' && editorBoardName
      ? `editor board "${editorBoardName}"`
      : resolvedEntityName
        ? `${entityLabel} "${resolvedEntityName}"`
        : `${entityLabel} #${activity.entityId}`;
  const scopeLabel = editorBoardName ? `editor board "${editorBoardName}"` : entityName;

  let description = `${actorName} performed ${title.toLowerCase()} on ${entityName}.`;

  if (activity.action === 'MEMBER_INVITED') {
    const invitedIds = Array.isArray(metadata.invitedUserIds)
      ? metadata.invitedUserIds.filter(
          (id): id is number => typeof id === 'number' && Number.isFinite(id),
        )
      : [];
    const invitedNames = invitedIds.map((id) => getActivityParticipantName(null, id));
    const invitedList = formatUserNameList(
      invitedNames.filter((name): name is string => Boolean(name)),
    );

    if (invitedList) {
      description = `${actorName} added ${invitedList} to ${scopeLabel}.`;
    }
  } else if (activity.action === 'MEMBER_REMOVED') {
    const removedName = getActivityParticipantName(null, metadata.removedUserId);

    if (removedName) {
      description = `${actorName} removed ${removedName} from ${scopeLabel}.`;
    }
  }

  return {
    id: activity.id,
    title,
    description,
    status: 'DONE',
    projectName,
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

export async function getCurrentUserContextActivities(
  editorBoards?: UserEditorBoard[],
): Promise<UserActivity[]> {
  const [actorResult, notifications] = await Promise.all([
    getActivityLogs({ limit: CONTEXT_ACTOR_ACTIVITY_LIMIT, page: 1 }),
    getNotifications(),
  ]);

  const activityById = new Map<number, ActivityLogResponse>();
  for (const activity of actorResult.activities) {
    activityById.set(activity.id, activity);
  }
  for (const notification of notifications) {
    if (notification.activityLog) {
      activityById.set(notification.activityLog.id, notification.activityLog);
    }
  }

  return [...activityById.values()]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .map((activity) => mapActivityLogToUserActivity(activity, { editorBoards }));
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
