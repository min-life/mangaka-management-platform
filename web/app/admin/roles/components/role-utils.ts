import type { AdminPermissionResponse, AdminRoleResponse, AdminRoleScope } from '../../admin-api';

export const SCOPE_OPTIONS: AdminRoleScope[] = ['SYS', 'PRJ'];

export type RoleFormPayload = {
  code: string;
  isDefault: boolean;
  name: string;
  permissionIds?: number[];
  scope: AdminRoleScope;
};

export function getPermissionId(permission: { id: string | number }) {
  return Number(permission.id);
}

function toTitleCase(value: string) {
  return value
    .split(/[-_.]/)
    .filter(Boolean)
    .map((part) => `${part[0]?.toUpperCase()}${part.slice(1)}`)
    .join(' ');
}

export function getPermissionGroup(permissionName: string) {
  if (permissionName === 'admin') {
    return 'Admin';
  }

  if (permissionName.startsWith('project:application.')) {
    return 'Applications';
  }

  const [resource, segment] = permissionName.split(':');
  const normalizedResource = segment?.includes('.') ? segment.split('.')[0] : resource;

  return toTitleCase(normalizedResource);
}

export function getPermissionAction(permissionName: string) {
  if (permissionName === 'admin') {
    return 'All';
  }

  const parts = permissionName.split(/[.:]/);
  const action = parts[parts.length - 1] ?? permissionName;

  return toTitleCase(action);
}

export function groupPermissionsByResource(permissions: AdminPermissionResponse[]) {
  const groupedPermissions = new Map<string, AdminPermissionResponse[]>();

  permissions.forEach((permission) => {
    const group = getPermissionGroup(permission.name);
    const currentPermissions = groupedPermissions.get(group) ?? [];
    groupedPermissions.set(group, [...currentPermissions, permission]);
  });

  return Array.from(groupedPermissions.entries()).map(([group, groupPermissions]) => ({
    group,
    permissions: groupPermissions,
  }));
}

export function sortRolesByApiFields(roles: AdminRoleResponse[]) {
  return [...roles].sort((firstRole, secondRole) => {
    const nameCompare = firstRole.name.localeCompare(secondRole.name);
    if (nameCompare !== 0) {
      return nameCompare;
    }

    const scopeCompare = firstRole.scope.localeCompare(secondRole.scope);
    if (scopeCompare !== 0) {
      return scopeCompare;
    }

    return firstRole.id - secondRole.id;
  });
}
