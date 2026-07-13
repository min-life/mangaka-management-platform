import api from '@/lib/api';
import type { PermissionResponseItem, PermissionScope } from '@/services/permission.service';

export type RoleResponse = {
  code: string;
  createdAt?: string;
  id: number;
  isDefault: boolean;
  name: string;
  scope: PermissionScope;
  updatedAt?: string;
};

type RolesResponse = {
  data?: RoleResponse[];
};

type RolePermissionsResponse = {
  data?: PermissionResponseItem[];
};

type ApiResponse<T> = {
  data?: T;
};

export async function getRoles(scope?: PermissionScope) {
  const response = await api.get<RolesResponse, RolesResponse>('/roles', {
    params: scope ? { scope } : undefined,
  });

  return response.data ?? [];
}

export async function getRoleById(roleId: number | string) {
  const response = await api.get<ApiResponse<RoleResponse>, ApiResponse<RoleResponse>>(`/roles/${roleId}`);
  return response.data ?? (response as RoleResponse);
}

export async function createRole(payload: {
  code: string;
  name: string;
  scope: PermissionScope;
}) {
  const response = await api.post<ApiResponse<RoleResponse>, ApiResponse<RoleResponse>>('/roles', payload);
  return response.data ?? (response as RoleResponse);
}

export async function updateRole(
  roleId: number | string,
  payload: {
    code?: string;
    name?: string;
    scope?: PermissionScope;
  },
) {
  const response = await api.patch<ApiResponse<RoleResponse>, ApiResponse<RoleResponse>>(`/roles/${roleId}`, payload);
  return response.data ?? (response as RoleResponse);
}

export async function deleteRole(roleId: number | string) {
  await api.delete(`/roles/${roleId}`);
}

export async function getRolePermissions(roleId: number) {
  const response = await api.get<RolePermissionsResponse, RolePermissionsResponse>(
    `/roles/${roleId}/permissions`,
  );

  return response.data ?? [];
}

export async function replaceRolePermissions(roleId: number, permissionIds: number[]) {
  await api.put(`/roles/${roleId}/permissions`, { permissionIds });
}

