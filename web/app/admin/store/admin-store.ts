import { create } from 'zustand';

import {
  getAdminPermissions,
  getAdminRoles,
  getAdminUserRoles,
  getAdminUsers,
  getAdminUserStats,
  type AdminPermissionResponse,
  type AdminRoleResponse,
  type AdminUserResponse,
  type AdminUserStats,
} from '../admin-api';
import { getApiErrorMessage } from '../utils/api-error';

type AdminStore = {
  allRoles: AdminRoleResponse[];
  allRolesLoaded: boolean;
  dashboardError: string | null;
  isDashboardLoading: boolean;
  isRolesLoading: boolean;
  isUsersLoading: boolean;
  loadedRolePermissionIds: number[];
  loadingRolePermissionIds: number[];
  permissions: AdminPermissionResponse[];
  permissionsLoaded: boolean;
  rolePermissions: Record<number, AdminPermissionResponse[]>;
  rolesError: string | null;
  stats: AdminUserStats | null;
  statsLoaded: boolean;
  sysRoles: AdminRoleResponse[];
  sysRolesLoaded: boolean;
  userRolesById: Record<number, AdminRoleResponse[]>;
  users: AdminUserResponse[];
  usersError: string | null;
  usersLoaded: boolean;
  loadDashboardData: (force?: boolean) => Promise<void>;
  loadRolesPageData: (force?: boolean) => Promise<void>;
  loadSysRoles: (force?: boolean) => Promise<AdminRoleResponse[]>;
  loadUserRoles: (userId: number, force?: boolean) => Promise<AdminRoleResponse[]>;
  loadUsersPageData: (force?: boolean) => Promise<void>;
  refreshRolesPageData: () => Promise<void>;
  refreshUsersPageData: () => Promise<void>;
  removeRoles: (roleIds: number[]) => void;
  setRolePermissionsForRole: (roleId: number, permissions: AdminPermissionResponse[]) => void;
  setUserRolesForUser: (userId: number, roles: AdminRoleResponse[]) => void;
  updateRoleDefault: (role: AdminRoleResponse) => void;
  updateUser: (userId: number, patch: Partial<AdminUserResponse>) => void;
  upsertRole: (role: AdminRoleResponse) => void;
  upsertUser: (user: AdminUserResponse) => void;
};

function uniqueNumbers(values: number[]) {
  return Array.from(new Set(values));
}

function upsertRoleInList(roles: AdminRoleResponse[], role: AdminRoleResponse) {
  const roleIndex = roles.findIndex((item) => item.id === role.id);

  if (roleIndex === -1) {
    return [...roles, role];
  }

  return roles.map((item) => (item.id === role.id ? role : item));
}

function getSystemRoles(roles: AdminRoleResponse[]) {
  return roles.filter((role) => role.scope === 'SYS');
}

function getRolePermissionsById(roles: AdminRoleResponse[]) {
  return roles.reduce<Record<number, AdminPermissionResponse[]>>((permissionsByRoleId, role) => {
    if (role.permissions) {
      permissionsByRoleId[role.id] = role.permissions;
    }

    return permissionsByRoleId;
  }, {});
}

function getLoadedRolePermissionIds(roles: AdminRoleResponse[]) {
  return roles.filter((role) => role.permissions).map((role) => role.id);
}

function incrementStatsForUser(stats: AdminUserStats | null, user: AdminUserResponse) {
  if (!stats) {
    return stats;
  }

  const createdAt = new Date(user.createdAt);
  const yearKey = String(createdAt.getFullYear());
  const monthKey = `${yearKey}-${String(createdAt.getMonth() + 1).padStart(2, '0')}`;

  return {
    ...stats,
    active: stats.active + (user.isActive ? 1 : 0),
    growthByMonth: {
      ...(stats.growthByMonth ?? {}),
      [monthKey]: (stats.growthByMonth?.[monthKey] ?? 0) + 1,
    },
    growthByYear: {
      ...(stats.growthByYear ?? {}),
      [yearKey]: (stats.growthByYear?.[yearKey] ?? 0) + 1,
    },
    inactive: stats.inactive + (user.isActive ? 0 : 1),
    total: stats.total + 1,
  };
}

export const useAdminStore = create<AdminStore>((set, get) => ({
  allRoles: [],
  allRolesLoaded: false,
  dashboardError: null,
  isDashboardLoading: false,
  isRolesLoading: false,
  isUsersLoading: false,
  loadedRolePermissionIds: [],
  loadingRolePermissionIds: [],
  permissions: [],
  permissionsLoaded: false,
  rolePermissions: {},
  rolesError: null,
  stats: null,
  statsLoaded: false,
  sysRoles: [],
  sysRolesLoaded: false,
  userRolesById: {},
  users: [],
  usersError: null,
  usersLoaded: false,

  loadDashboardData: async (force = false) => {
    const state = get();

    if (!force && state.statsLoaded && state.allRolesLoaded) {
      return;
    }

    set({ dashboardError: null, isDashboardLoading: true });

    try {
      const [stats, allRoles] = await Promise.all([
        !force && state.statsLoaded && state.stats
          ? Promise.resolve(state.stats)
          : getAdminUserStats(),
        !force && state.allRolesLoaded ? Promise.resolve(state.allRoles) : getAdminRoles(),
      ]);

      set({
        allRoles,
        allRolesLoaded: true,
        loadedRolePermissionIds: uniqueNumbers([
          ...get().loadedRolePermissionIds,
          ...getLoadedRolePermissionIds(allRoles),
        ]),
        rolePermissions: {
          ...get().rolePermissions,
          ...getRolePermissionsById(allRoles),
        },
        stats,
        statsLoaded: true,
        sysRoles: get().sysRolesLoaded ? get().sysRoles : getSystemRoles(allRoles),
        sysRolesLoaded: true,
      });
    } catch (error) {
      set({ dashboardError: getApiErrorMessage(error, 'Unable to load admin dashboard metrics.') });
    } finally {
      set({ isDashboardLoading: false });
    }
  },

  loadRolesPageData: async (force = false) => {
    const state = get();

    if (!force && state.allRolesLoaded && state.permissionsLoaded) {
      return;
    }

    set({ isRolesLoading: true, rolesError: null });

    try {
      const [allRoles, permissions] = await Promise.all([
        !force && state.allRolesLoaded ? Promise.resolve(state.allRoles) : getAdminRoles(),
        !force && state.permissionsLoaded
          ? Promise.resolve(state.permissions)
          : getAdminPermissions(),
      ]);

      set({
        allRoles,
        allRolesLoaded: true,
        loadedRolePermissionIds: uniqueNumbers([
          ...get().loadedRolePermissionIds,
          ...getLoadedRolePermissionIds(allRoles),
        ]),
        permissions,
        permissionsLoaded: true,
        rolePermissions: {
          ...get().rolePermissions,
          ...getRolePermissionsById(allRoles),
        },
        sysRoles: get().sysRolesLoaded ? get().sysRoles : getSystemRoles(allRoles),
        sysRolesLoaded: true,
      });
    } catch (error) {
      set({ rolesError: getApiErrorMessage(error, 'Unable to load roles.') });
    } finally {
      set({ isRolesLoading: false });
    }
  },

  loadSysRoles: async (force = false) => {
    const state = get();

    if (!force && state.sysRolesLoaded) {
      return state.sysRoles;
    }

    if (!force && state.allRolesLoaded) {
      const sysRoles = getSystemRoles(state.allRoles);
      set({ sysRoles, sysRolesLoaded: true });

      return sysRoles;
    }

    const sysRoles = await getAdminRoles('SYS');
    set((currentState) => ({
      loadedRolePermissionIds: uniqueNumbers([
        ...currentState.loadedRolePermissionIds,
        ...getLoadedRolePermissionIds(sysRoles),
      ]),
      rolePermissions: {
        ...currentState.rolePermissions,
        ...getRolePermissionsById(sysRoles),
      },
      sysRoles,
      sysRolesLoaded: true,
    }));

    return sysRoles;
  },

  loadUserRoles: async (userId, force = false) => {
    const cachedRoles = get().userRolesById[userId];

    if (!force && cachedRoles) {
      return cachedRoles;
    }

    const roles = await getAdminUserRoles(userId);

    set((state) => ({
      userRolesById: {
        ...state.userRolesById,
        [userId]: roles,
      },
    }));

    return roles;
  },

  loadUsersPageData: async (force = false) => {
    const state = get();

    if (!force && state.usersLoaded) {
      return;
    }

    set({ isUsersLoading: true, usersError: null });

    try {
      const usersResult =
        !force && state.usersLoaded ? { users: state.users } : await getAdminUsers({ limit: 100 });

      set({
        users: usersResult.users,
        usersLoaded: true,
      });
    } catch (error) {
      set({ usersError: getApiErrorMessage(error, 'Unable to load admin users.') });
    } finally {
      set({ isUsersLoading: false });
    }
  },

  refreshRolesPageData: async () => {
    await get().loadRolesPageData(true);
  },

  refreshUsersPageData: async () => {
    await get().loadUsersPageData(true);
  },

  removeRoles: (roleIds) => {
    set((state) => {
      const nextRolePermissions = { ...state.rolePermissions };
      roleIds.forEach((roleId) => {
        delete nextRolePermissions[roleId];
      });

      return {
        allRoles: state.allRoles.filter((role) => !roleIds.includes(role.id)),
        loadedRolePermissionIds: state.loadedRolePermissionIds.filter(
          (roleId) => !roleIds.includes(roleId),
        ),
        loadingRolePermissionIds: state.loadingRolePermissionIds.filter(
          (roleId) => !roleIds.includes(roleId),
        ),
        rolePermissions: nextRolePermissions,
        sysRoles: state.sysRoles.filter((role) => !roleIds.includes(role.id)),
      };
    });
  },

  setRolePermissionsForRole: (roleId, permissions) => {
    set((state) => ({
      loadedRolePermissionIds: uniqueNumbers([...state.loadedRolePermissionIds, roleId]),
      rolePermissions: {
        ...state.rolePermissions,
        [roleId]: permissions,
      },
    }));
  },

  setUserRolesForUser: (userId, roles) => {
    set((state) => ({
      userRolesById: {
        ...state.userRolesById,
        [userId]: roles,
      },
      users: state.users.map((user) => (user.id === userId ? { ...user, roles } : user)),
    }));
  },

  updateRoleDefault: (role) => {
    set((state) => ({
      allRoles: state.allRoles.map((item) => {
        if (item.id === role.id) {
          return role;
        }

        if (role.isDefault && item.scope === role.scope) {
          return { ...item, isDefault: false };
        }

        return item;
      }),
      loadedRolePermissionIds: role.permissions
        ? uniqueNumbers([...state.loadedRolePermissionIds, role.id])
        : state.loadedRolePermissionIds,
      rolePermissions: role.permissions
        ? { ...state.rolePermissions, [role.id]: role.permissions }
        : state.rolePermissions,
      sysRoles: state.sysRoles.map((item) => {
        if (item.id === role.id) {
          return role;
        }

        if (role.isDefault && item.scope === role.scope) {
          return { ...item, isDefault: false };
        }

        return item;
      }),
    }));
  },

  updateUser: (userId, patch) => {
    set((state) => ({
      users: state.users.map((user) => (user.id === userId ? { ...user, ...patch } : user)),
    }));
  },

  upsertRole: (role) => {
    set((state) => ({
      allRoles: upsertRoleInList(state.allRoles, role),
      loadedRolePermissionIds: role.permissions
        ? uniqueNumbers([...state.loadedRolePermissionIds, role.id])
        : state.loadedRolePermissionIds,
      rolePermissions: role.permissions
        ? { ...state.rolePermissions, [role.id]: role.permissions }
        : state.rolePermissions,
      sysRoles:
        role.scope === 'SYS'
          ? upsertRoleInList(state.sysRoles, role)
          : state.sysRoles.filter((item) => item.id !== role.id),
    }));
  },

  upsertUser: (user) => {
    set((state) => {
      const hasUser = state.users.some((item) => item.id === user.id);

      return {
        stats: hasUser ? state.stats : incrementStatsForUser(state.stats, user),
        users: hasUser
          ? state.users.map((item) => (item.id === user.id ? user : item))
          : [user, ...state.users],
      };
    });
  },
}));
