import api from '@/lib/api';

export type AdminRoleScope = 'PRJ' | 'SYS';

export type AdminRoleResponse = {
  code: string;
  createdAt: string;
  id: number;
  isDefault: boolean;
  name: string;
  scope: AdminRoleScope;
  updatedAt: string;
};

export type AdminPermissionResponse = {
  description?: string;
  id: string | number;
  name: string;
  scope: AdminRoleScope;
};

export type AdminUserResponse = {
  avatarUrl?: string | null;
  createdAt: string;
  displayName?: string | null;
  email: string;
  googleLinked?: boolean;
  id: number;
  isActive: boolean;
  roles?: AdminRoleResponse[];
  updatedAt: string;
};

export type AdminProjectResponse = {
  assignedAt?: string;
  id: number;
  name: string;
  role?: AdminRoleResponse;
};

export type AdminEditorBoardResponse = {
  id: number;
  isLead?: boolean;
  name: string;
};

export type AdminPagination = {
  limit: number;
  page: number;
  total: number;
  totalPages: number;
};

type ApiEnvelope<T> = {
  data: T;
  pagination?: AdminPagination;
};

export type AdminUsersResult = {
  pagination?: AdminPagination;
  users: AdminUserResponse[];
};

export type AdminUserStats = {
  active: number;
  growthByMonth?: Record<string, number>;
  growthByYear?: Record<string, number>;
  inactive: number;
  total: number;
};

function getEnvelopeData<T>(response: T | ApiEnvelope<T>) {
  if (response && typeof response === 'object' && 'data' in response) {
    return (response as ApiEnvelope<T>).data;
  }

  return response as T;
}

function getEnvelopePagination<T>(response: T | ApiEnvelope<T>) {
  if (response && typeof response === 'object' && 'pagination' in response) {
    return (response as ApiEnvelope<T>).pagination;
  }

  return undefined;
}

export async function getAdminUsers(params?: {
  isActive?: boolean;
  limit?: number;
  page?: number;
  search?: string;
}) {
  const response = await api.get<
    ApiEnvelope<AdminUserResponse[]>,
    ApiEnvelope<AdminUserResponse[]>
  >('/users', { params });

  return {
    pagination: getEnvelopePagination(response),
    users: getEnvelopeData(response) ?? [],
  } satisfies AdminUsersResult;
}

export async function getAdminUserStats() {
  const response = await api.get<ApiEnvelope<AdminUserStats>, ApiEnvelope<AdminUserStats>>(
    '/users/stats',
  );

  return getEnvelopeData(response);
}

export async function createAdminUser(payload: {
  displayName?: string;
  email: string;
  roleIds: number[];
}) {
  const response = await api.post<ApiEnvelope<AdminUserResponse>, ApiEnvelope<AdminUserResponse>>(
    '/users',
    payload,
  );

  return getEnvelopeData(response);
}

export async function getAdminUser(userId: number) {
  const response = await api.get<ApiEnvelope<AdminUserResponse>, ApiEnvelope<AdminUserResponse>>(
    `/users/${userId}`,
  );

  return getEnvelopeData(response);
}

export async function updateAdminUser(
  userId: number,
  payload: {
    avatarUrl?: string;
    displayName?: string;
    email?: string;
    isActive?: boolean;
    password?: string;
  },
) {
  const response = await api.patch<ApiEnvelope<AdminUserResponse>, ApiEnvelope<AdminUserResponse>>(
    `/users/${userId}`,
    payload,
  );

  return getEnvelopeData(response);
}

export async function forceResetAdminUserPassword(userId: number) {
  const response = await api.post<
    ApiEnvelope<{ success: boolean }>,
    ApiEnvelope<{ success: boolean }>
  >(`/users/${userId}/force-reset-password`);

  return getEnvelopeData(response);
}

export async function getAdminUserRoles(userId: number) {
  const response = await api.get<
    ApiEnvelope<AdminRoleResponse[]>,
    ApiEnvelope<AdminRoleResponse[]>
  >(`/users/${userId}/roles`);

  return getEnvelopeData(response) ?? [];
}

export async function replaceAdminUserRoles(userId: number, roleIds: number[]) {
  await api.put(`/users/${userId}/roles`, { roleIds });
}

export async function getAdminUserProjects(userId: number) {
  const response = await api.get<
    ApiEnvelope<AdminProjectResponse[]>,
    ApiEnvelope<AdminProjectResponse[]>
  >(`/users/${userId}/projects`);

  return getEnvelopeData(response) ?? [];
}

export async function getAdminUserEditorBoards(userId: number) {
  const response = await api.get<
    ApiEnvelope<AdminEditorBoardResponse[]>,
    ApiEnvelope<AdminEditorBoardResponse[]>
  >(`/users/${userId}/editor-boards`);

  return getEnvelopeData(response) ?? [];
}

export async function getAdminRoles(scope?: AdminRoleScope) {
  const response = await api.get<
    ApiEnvelope<AdminRoleResponse[]>,
    ApiEnvelope<AdminRoleResponse[]>
  >('/roles', { params: scope ? { scope } : undefined });

  return getEnvelopeData(response) ?? [];
}

export async function createAdminRole(payload: {
  code: string;
  isDefault?: boolean;
  name: string;
  scope: AdminRoleScope;
}) {
  const response = await api.post<ApiEnvelope<AdminRoleResponse>, ApiEnvelope<AdminRoleResponse>>(
    '/roles',
    payload,
  );

  return getEnvelopeData(response);
}

export async function updateAdminRole(
  roleId: number,
  payload: {
    code?: string;
    isDefault?: boolean;
    name?: string;
    permissionIds?: string[];
    scope?: AdminRoleScope;
  },
) {
  const response = await api.patch<ApiEnvelope<AdminRoleResponse>, ApiEnvelope<AdminRoleResponse>>(
    `/roles/${roleId}`,
    payload,
  );

  return getEnvelopeData(response);
}

export async function deleteAdminRole(roleId: number) {
  await api.delete(`/roles/${roleId}`);
}

export async function getAdminPermissions(scope?: AdminRoleScope) {
  const response = await api.get<AdminPermissionResponse[], AdminPermissionResponse[]>(
    '/permissions',
    { params: scope ? { scope } : undefined },
  );

  return Array.isArray(response) ? response : [];
}

export async function getAdminRolePermissions(roleId: number) {
  const response = await api.get<
    ApiEnvelope<AdminPermissionResponse[]>,
    ApiEnvelope<AdminPermissionResponse[]>
  >(`/roles/${roleId}/permissions`);

  return getEnvelopeData(response) ?? [];
}

export async function replaceAdminRolePermissions(roleId: number, permissionIds: number[]) {
  await api.put(`/roles/${roleId}/permissions`, {
    permissionIds: permissionIds.map(String),
  });
}
