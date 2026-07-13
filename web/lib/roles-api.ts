import api from '@/lib/api';

export type RoleScope = 'SYS' | 'CO' | 'PRJ';

export type ApiRole = {
  id: string;
  name: string;
  scope: RoleScope;
  companyId: string | null;
  projectId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ApiPermission = {
  id: string;
  name: string;
  scope: RoleScope;
};

type ApiResponse<T> = {
  message: string;
  data: T;
};

export async function getRoles(scope?: RoleScope) {
  const response = await api.get<ApiResponse<ApiRole[]>>('/roles', {
    params: scope ? { scope } : undefined,
  });

  return (response as unknown as ApiResponse<ApiRole[]>).data;
}

export async function getRole(roleId: string) {
  const response = await api.get<ApiResponse<ApiRole>>(`/roles/${roleId}`);

  return (response as unknown as ApiResponse<ApiRole>).data;
}

export async function createRole(payload: { name: string; scope?: RoleScope }) {
  const response = await api.post<ApiResponse<ApiRole>>('/roles/system', payload);

  return (response as unknown as ApiResponse<ApiRole>).data;
}

export async function updateRole(roleId: string, payload: { name?: string; scope?: RoleScope }) {
  const response = await api.patch<ApiResponse<ApiRole>>(`/roles/${roleId}`, payload);

  return (response as unknown as ApiResponse<ApiRole>).data;
}

export async function deleteRole(roleId: string) {
  const response = await api.delete<ApiResponse<{ success: boolean }>>(`/roles/${roleId}`);

  return (response as unknown as ApiResponse<{ success: boolean }>).data;
}

export async function getPermissions(scope?: RoleScope) {
  const response = await api.get<ApiPermission[]>('/permissions', {
    params: scope ? { scope } : undefined,
  });

  return response as unknown as ApiPermission[];
}
