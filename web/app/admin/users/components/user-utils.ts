import type {
  AdminEditorBoardResponse,
  AdminProjectResponse,
  AdminRoleResponse,
  AdminUserResponse,
} from '../../admin-api';

export type UserDetailState = {
  boards: AdminEditorBoardResponse[];
  projects: AdminProjectResponse[];
  roles: AdminRoleResponse[];
  user: AdminUserResponse;
};

export function getInitials(user: Pick<AdminUserResponse, 'displayName' | 'email'>) {
  const name = user.displayName?.trim() || user.email;

  return name
    .split(/[.@\s_-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

export function getUserRoleNames(user: AdminUserResponse) {
  return user.roles?.map((role) => role.name).join(', ') || 'No SYS role';
}
