import api from '@/lib/api';
import type { PermissionName, PermissionResource } from '@/types/permission';

export type PermissionScope = 'PRJ' | 'SYS';

export type PermissionResponseItem = {
  description?: string;
  id: string;
  name: PermissionName;
  scope: PermissionScope;
};

type PermissionResponse = {
  data?: PermissionName[];
};

type PermissionsListResponse = PermissionResponseItem[] | {
  data?: PermissionResponseItem[];
};

function normalizePermissions(response: PermissionResponse | PermissionName[]) {
  return Array.isArray(response) ? response : (response.data ?? []);
}

export async function getMySysPermissions() {
  const response = await api.get<PermissionResponse, PermissionResponse>('/permissions/me/sys');
  return normalizePermissions(response);
}

export async function getMyProjectPermissions(projectId: number | string) {
  const response = await api.get<PermissionResponse, PermissionResponse>(
    `/permissions/me/projects/${projectId}`,
  );
  return normalizePermissions(response);
}

export async function getMyBoardPermissions(boardId: number | string) {
  const response = await api.get<PermissionResponse, PermissionResponse>(
    `/permissions/me/boards/${boardId}`,
  );
  return normalizePermissions(response);
}

export async function getMyPermissions(resource: PermissionResource, resourceId?: number | string) {
  if (resource === 'SYS') {
    return getMySysPermissions();
  }

  if (!resourceId) {
    return [];
  }

  if (resource === 'PROJECT') {
    return getMyProjectPermissions(resourceId);
  }

  return getMyBoardPermissions(resourceId);
}

export async function getPermissions(scope?: PermissionScope) {
  const response = await api.get<PermissionsListResponse, PermissionsListResponse>('/permissions', {
    params: scope ? { scope } : undefined,
  });

  return Array.isArray(response) ? response : (response.data ?? []);
}
