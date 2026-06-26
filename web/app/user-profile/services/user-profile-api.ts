import api from '@/lib/api';

export type UserProfile = {
  id: number;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
  roles?: UserRole[];
};

type ApiResponse<T> = {
  data: T;
};

export type UserRole = {
  id: number;
  code: string;
  scope: string;
  name: string;
  isDefault?: boolean;
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
  role: UserRole;
  assignedAt: string;
  projectStats?: Array<{
    id: number;
    projectId: number;
    metrics: unknown;
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
  status: string;
  projectName: string;
  createdAt: string;
  updatedAt: string;
  timeLabel: string;
};

export type UpdateCurrentUserProfilePayload = {
  displayName?: string;
  avatarUrl?: string;
};

export type UpdateCurrentUserPasswordPayload = {
  currentPassword: string;
  newPassword: string;
};

export async function getCurrentUserProfile() {
  const response = await api.get<ApiResponse<UserProfile>>('/users/me');

  return (response as unknown as ApiResponse<UserProfile>).data;
}

export async function getCurrentUserProjects(userId: number) {
  const response = await api.get<ApiResponse<UserProject[]>>(`/users/${userId}/projects`);

  return (response as unknown as ApiResponse<UserProject[]>).data;
}

export async function getCurrentUserEditorBoards(userId: number) {
  const response = await api.get<ApiResponse<UserEditorBoard[]>>(
    `/users/${userId}/editor-boards`,
  );

  return (response as unknown as ApiResponse<UserEditorBoard[]>).data;
}

export async function getCurrentUserActivities() {
  const response = await api.get<ApiResponse<UserActivity[]>>('/users/me/activities');

  return (response as unknown as ApiResponse<UserActivity[]>).data;
}

export async function uploadCurrentUserAvatar(file: File) {
  const formData = new FormData();
  formData.append('avatar', file);

  const response = await api.post<ApiResponse<{ avatarUrl: string }>>('/users/me/avatar', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return (response as unknown as ApiResponse<{ avatarUrl: string }>).data;
}

export async function updateCurrentUserProfile(payload: UpdateCurrentUserProfilePayload) {
  const response = await api.patch<ApiResponse<UserProfile>>('/users/me', payload);

  return (response as unknown as ApiResponse<UserProfile>).data;
}

export async function updateCurrentUserPassword(payload: UpdateCurrentUserPasswordPayload) {
  const response = await api.patch<ApiResponse<{ success: boolean }>>('/users/me/password', payload);

  return (response as unknown as ApiResponse<{ success: boolean }>).data;
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

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}
