import api from '@/lib/api';
import type { RoleResponse } from './role.service';

export type UserResponse = {
  avatarUrl: string | null;
  createdAt?: string;
  displayName: string | null;
  email: string;
  id: number;
  isActive?: boolean;
  updatedAt?: string;
};

type UsersResponse = {
  data?: UserResponse[];
  pagination?: {
    limit: number;
    page: number;
    total: number;
    totalPages: number;
  };
};

type ApiResponse<T> = {
  data?: T;
};

export type UserStatsResponse = {
  total: number;
  active: number;
  inactive: number;
  growthByMonth: any[];
  growthByYear: any[];
};

export async function getUsers(params?: {
  field?: 'createdAt' | 'displayName' | 'email';
  isActive?: boolean;
  limit?: number;
  order?: 'asc' | 'desc';
  page?: number;
  search?: string;
}) {
  const response = await api.get<UsersResponse, UsersResponse>('/users', { params });

  return response.data ?? [];
}

export async function getCurrentUserProfile() {
  const response = await api.get<ApiResponse<UserResponse>, ApiResponse<UserResponse>>('/users/me');
  return response.data ?? (response as UserResponse);
}

export async function updateCurrentUserProfile(payload: {
  displayName?: string;
  avatarUrl?: string;
}) {
  const response = await api.patch<ApiResponse<UserResponse>, ApiResponse<UserResponse>>('/users/me', payload);
  return response.data ?? (response as UserResponse);
}

export async function updateCurrentUserPassword(payload: {
  currentPassword?: string;
  newPassword?: string;
}) {
  await api.patch('/users/me/password', payload);
}

export async function getUserStats() {
  const response = await api.get<ApiResponse<UserStatsResponse>, ApiResponse<UserStatsResponse>>('/users/stats');
  return response.data ?? (response as UserStatsResponse);
}

export async function createStaffUser(payload: {
  email: string;
  displayName?: string;
  avatarUrl?: string;
  password?: string;
  roleIds: number[];
}) {
  const response = await api.post<ApiResponse<UserResponse>, ApiResponse<UserResponse>>('/users', payload);
  return response.data ?? (response as UserResponse);
}

export async function getUserById(userId: number | string) {
  const response = await api.get<ApiResponse<UserResponse>, ApiResponse<UserResponse>>(`/users/${userId}`);
  return response.data ?? (response as UserResponse);
}

export async function updateUser(
  userId: number | string,
  payload: {
    email?: string;
    displayName?: string;
    avatarUrl?: string;
    password?: string;
    isActive?: boolean;
  },
) {
  const response = await api.patch<ApiResponse<UserResponse>, ApiResponse<UserResponse>>(`/users/${userId}`, payload);
  return response.data ?? (response as UserResponse);
}

export async function forceResetUserPassword(userId: number | string) {
  await api.post(`/users/${userId}/force-reset-password`);
}

export async function getUserRoles(userId: number | string): Promise<RoleResponse[]> {
  const response = await api.get<any, any>(`/users/${userId}/roles`);
  return Array.isArray(response) ? response : (response?.data ?? []);
}

export async function appendUserRoles(userId: number | string, roleIds: number[]) {
  await api.post(`/users/${userId}/roles`, { roleIds });
}

export async function replaceUserRoles(userId: number | string, roleIds: number[]) {
  await api.put(`/users/${userId}/roles`, { roleIds });
}

export async function getUserProjects(userId: number | string) {
  const response = await api.get<any, any>(`/users/${userId}/projects`);
  return response.data ?? response;
}

export async function getUserEditorBoards(userId: number | string) {
  const response = await api.get<any, any>(`/users/${userId}/editor-boards`);
  return response.data ?? response;
}

export async function hasPassword() {
  const response = await api.get<{ data: { hasPassword: boolean } }, { data: { hasPassword: boolean } }>('/users/me/has-password');
  return response.data?.hasPassword ?? false;
}

export async function createPassword(password: string) {
  const response = await api.post<any, any>('/users/me/password', { newPassword: password });
  return response.data;
}
