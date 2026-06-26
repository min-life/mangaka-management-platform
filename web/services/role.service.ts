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

export async function getRoles(scope?: PermissionScope) {
  const response = await api.get<RolesResponse, RolesResponse>('/roles', {
    params: scope ? { scope } : undefined,
  });

  return response.data ?? [];
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
