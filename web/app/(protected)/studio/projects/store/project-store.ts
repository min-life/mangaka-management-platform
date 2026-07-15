import { create } from 'zustand';

import {
  getProjectById,
  getProjectDashboard,
  getProjectMembers,
  getProjectFolders,
  type ProjectResponse,
  type ProjectDashboardResponse,
  type ProjectMemberResponse,
  type ProjectFolderResponse,
} from '@/services/project.service';
import { getRoles, type RoleResponse } from '@/services/role.service';
import { getProjectApplications, type ApplicationResponse } from '@/services/application.service';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type LoadableItem<T> = {
  data: T | null;
  error: string | null;
  isLoading: boolean;
  isFetching: boolean;
  loaded: boolean;
};

type MembersState = {
  list: ProjectMemberResponse[];
  error: string | null;
  isLoading: boolean;
  isFetching: boolean;
  loaded: boolean;
};

type FoldersState = {
  folders: ProjectFolderResponse[];
  error: string | null;
  isLoading: boolean;
  isFetching: boolean;
  loaded: boolean;
};

type ApplicationsState = {
  list: ApplicationResponse[];
  error: string | null;
  isLoading: boolean;
  isFetching: boolean;
  loaded: boolean;
};

type ProjectStore = {
  // Keyed by string(projectId)
  projects: Record<string, LoadableItem<ProjectResponse>>;
  dashboards: Record<string, LoadableItem<ProjectDashboardResponse>>;
  members: Record<string, MembersState>;
  folders: Record<string, FoldersState>;
  applications: Record<string, ApplicationsState>;

  // Project roles (shared, not per-project)
  projectRoles: RoleResponse[];
  projectRolesLoaded: boolean;

  // Actions
  loadProject: (projectId: number | string, force?: boolean) => Promise<void>;
  loadDashboard: (projectId: number | string, force?: boolean) => Promise<void>;
  loadMembers: (projectId: number | string, force?: boolean) => Promise<void>;
  loadFolders: (projectId: number | string, options?: { type?: 'ARC' | 'CHAPTER'; force?: boolean }) => Promise<void>;
  loadApplications: (projectId: number | string, force?: boolean) => Promise<void>;
  loadProjectRoles: (force?: boolean) => Promise<void>;

  // Optimistic updates / cache invalidation
  upsertMember: (projectId: number | string, member: ProjectMemberResponse) => void;
  removeMember: (projectId: number | string, memberId: number) => void;
  invalidateMembers: (projectId: number | string) => void;
  invalidateDashboard: (projectId: number | string) => void;
  invalidateApplications: (projectId: number | string) => void;
};

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function key(projectId: number | string) {
  return String(projectId);
}

const EMPTY_LOADABLE: LoadableItem<any> = {
  data: null,
  error: null,
  isLoading: false,
  isFetching: false,
  loaded: false,
};

const EMPTY_MEMBERS: MembersState = {
  list: [],
  error: null,
  isLoading: false,
  isFetching: false,
  loaded: false,
};

const EMPTY_FOLDERS: FoldersState = {
  folders: [],
  error: null,
  isLoading: false,
  isFetching: false,
  loaded: false,
};

const EMPTY_APPLICATIONS: ApplicationsState = {
  list: [],
  error: null,
  isLoading: false,
  isFetching: false,
  loaded: false,
};

// ─────────────────────────────────────────────────────────────────────────────
// Store
// ─────────────────────────────────────────────────────────────────────────────

export const useProjectStore = create<ProjectStore>((set, get) => ({
  projects: {},
  dashboards: {},
  members: {},
  folders: {},
  applications: {},
  projectRoles: [],
  projectRolesLoaded: false,

  // ── loadProject ────────────────────────────────────────────────────────────
  loadProject: async (projectId, force = false) => {
    const k = key(projectId);
    const state = get().projects[k];

    // Prevent concurrent fetches
    if (state?.isFetching) return;

    set((s) => ({
      projects: {
        ...s.projects,
        [k]: { 
          ...(s.projects[k] ?? EMPTY_LOADABLE), 
          isFetching: true, 
          isLoading: force || !s.projects[k]?.loaded, 
          error: null 
        },
      },
    }));

    try {
      const data = await getProjectById(Number(projectId));
      set((s) => ({
        projects: {
          ...s.projects,
          [k]: { data, error: null, isLoading: false, isFetching: false, loaded: true },
        },
      }));
    } catch (err: any) {
      set((s) => ({
        projects: {
          ...s.projects,
          [k]: {
            ...(s.projects[k] ?? EMPTY_LOADABLE),
            data: s.projects[k]?.data ?? null, // Keep stale data
            error: err?.message ?? 'Failed to load project.',
            isLoading: false,
            isFetching: false,
            loaded: s.projects[k]?.loaded ?? false, // Keep loaded status if it was
          },
        },
      }));
    }
  },

  // ── loadDashboard ──────────────────────────────────────────────────────────
  loadDashboard: async (projectId, force = false) => {
    const k = key(projectId);
    const state = get().dashboards[k];

    if (state?.isFetching) return;

    set((s) => ({
      dashboards: {
        ...s.dashboards,
        [k]: { 
          ...(s.dashboards[k] ?? EMPTY_LOADABLE), 
          isFetching: true, 
          isLoading: force || !s.dashboards[k]?.loaded, 
          error: null 
        },
      },
    }));

    try {
      const [project, dashboard] = await Promise.all([
        get().projects[k]?.data
          ? Promise.resolve(get().projects[k]!.data!)
          : getProjectById(Number(projectId)).catch(() => null),
        getProjectDashboard(Number(projectId)),
      ]);

      if (project && !get().projects[k]?.loaded) {
        set((s) => ({
          projects: {
            ...s.projects,
            [k]: { data: project, error: null, isLoading: false, isFetching: false, loaded: true },
          },
        }));
      }

      set((s) => ({
        dashboards: {
          ...s.dashboards,
          [k]: { data: dashboard ?? null, error: null, isLoading: false, isFetching: false, loaded: true },
        },
      }));
    } catch (err: any) {
      set((s) => ({
        dashboards: {
          ...s.dashboards,
          [k]: {
            ...(s.dashboards[k] ?? EMPTY_LOADABLE),
            data: s.dashboards[k]?.data ?? null,
            error: err?.message ?? 'Failed to load dashboard.',
            isLoading: false,
            isFetching: false,
            loaded: s.dashboards[k]?.loaded ?? false,
          },
        },
      }));
    }
  },

  // ── loadMembers ────────────────────────────────────────────────────────────
  loadMembers: async (projectId, force = false) => {
    const k = key(projectId);
    const state = get().members[k];

    if (state?.isFetching) return;

    set((s) => ({
      members: {
        ...s.members,
        [k]: { 
          ...(s.members[k] ?? EMPTY_MEMBERS), 
          isFetching: true, 
          isLoading: force || !s.members[k]?.loaded, 
          error: null 
        },
      },
    }));

    try {
      const result = await getProjectMembers(Number(projectId));
      set((s) => ({
        members: {
          ...s.members,
          [k]: {
            list: result.members,
            error: null,
            isLoading: false,
            isFetching: false,
            loaded: true,
          },
        },
      }));
    } catch (err: any) {
      set((s) => ({
        members: {
          ...s.members,
          [k]: {
            ...(s.members[k] ?? EMPTY_MEMBERS),
            list: s.members[k]?.list ?? [],
            error: err?.message ?? 'Failed to load members.',
            isLoading: false,
            isFetching: false,
            loaded: s.members[k]?.loaded ?? false,
          },
        },
      }));
    }
  },

  // ── loadFolders ────────────────────────────────────────────────────────────
  loadFolders: async (projectId, { type, force = false } = {}) => {
    const k = key(projectId);
    const state = get().folders[k];

    if (state?.isFetching) return;

    set((s) => ({
      folders: {
        ...s.folders,
        [k]: { 
          ...(s.folders[k] ?? EMPTY_FOLDERS), 
          isFetching: true, 
          isLoading: force || !s.folders[k]?.loaded, 
          error: null 
        },
      },
    }));

    try {
      const result = await getProjectFolders(Number(projectId), type ? { type } : undefined);
      set((s) => ({
        folders: {
          ...s.folders,
          [k]: {
            folders: result.folders,
            error: null,
            isLoading: false,
            isFetching: false,
            loaded: true,
          },
        },
      }));
    } catch (err: any) {
      set((s) => ({
        folders: {
          ...s.folders,
          [k]: {
            ...(s.folders[k] ?? EMPTY_FOLDERS),
            folders: s.folders[k]?.folders ?? [],
            error: err?.message ?? 'Failed to load folders.',
            isLoading: false,
            isFetching: false,
            loaded: s.folders[k]?.loaded ?? false,
          },
        },
      }));
    }
  },

  // ── loadApplications ───────────────────────────────────────────────────────
  loadApplications: async (projectId, force = false) => {
    const k = key(projectId);
    const state = get().applications[k];

    if (state?.isFetching) return;

    set((s) => ({
      applications: {
        ...s.applications,
        [k]: { 
          ...(s.applications[k] ?? EMPTY_APPLICATIONS), 
          isFetching: true, 
          isLoading: force || !s.applications[k]?.loaded, 
          error: null 
        },
      },
    }));

    try {
      const result = await getProjectApplications(Number(projectId));
      set((s) => ({
        applications: {
          ...s.applications,
          [k]: {
            list: result.applications,
            error: null,
            isLoading: false,
            isFetching: false,
            loaded: true,
          },
        },
      }));
    } catch (err: any) {
      set((s) => ({
        applications: {
          ...s.applications,
          [k]: {
            ...(s.applications[k] ?? EMPTY_APPLICATIONS),
            list: s.applications[k]?.list ?? [],
            error: err?.message ?? 'Failed to load applications.',
            isLoading: false,
            isFetching: false,
            loaded: s.applications[k]?.loaded ?? false,
          },
        },
      }));
    }
  },

  // ── loadProjectRoles ───────────────────────────────────────────────────────
  loadProjectRoles: async (force = false) => {
    const { projectRolesLoaded } = get();
    if (!force && projectRolesLoaded) return;

    try {
      const roles = await getRoles('PRJ');
      set({ projectRoles: roles, projectRolesLoaded: true });
    } catch {
      // silently fail — not critical
    }
  },

  // ── upsertMember ──────────────────────────────────────────────────────────
  upsertMember: (projectId, member) => {
    const k = key(projectId);
    set((s) => {
      const existing = s.members[k] ?? EMPTY_MEMBERS;
      const idx = existing.list.findIndex((m) => m.id === member.id);
      const nextList =
        idx === -1
          ? [...existing.list, member]
          : existing.list.map((m) => (m.id === member.id ? member : m));
      return {
        members: { ...s.members, [k]: { ...existing, list: nextList } },
      };
    });
  },

  // ── removeMember ──────────────────────────────────────────────────────────
  removeMember: (projectId, memberId) => {
    const k = key(projectId);
    set((s) => {
      const existing = s.members[k] ?? EMPTY_MEMBERS;
      return {
        members: {
          ...s.members,
          [k]: { ...existing, list: existing.list.filter((m) => m.id !== memberId) },
        },
      };
    });
  },

  // ── invalidateMembers ─────────────────────────────────────────────────────
  invalidateMembers: (projectId) => {
    const k = key(projectId);
    set((s) => ({
      members: {
        ...s.members,
        [k]: { ...(s.members[k] ?? EMPTY_MEMBERS), loaded: false },
      },
    }));
  },

  // ── invalidateDashboard ───────────────────────────────────────────────────
  invalidateDashboard: (projectId) => {
    const k = key(projectId);
    set((s) => ({
      dashboards: {
        ...s.dashboards,
        [k]: { ...(s.dashboards[k] ?? EMPTY_LOADABLE), loaded: false },
      },
    }));
  },

  // ── invalidateApplications ──────────────────────────────────────────────────
  invalidateApplications: (projectId) => {
    const k = key(projectId);
    set((s) => ({
      applications: {
        ...s.applications,
        [k]: { ...(s.applications[k] ?? EMPTY_APPLICATIONS), loaded: false },
      },
    }));
  },
}));

// ─────────────────────────────────────────────────────────────────────────────
// Selector helpers (để component chỉ subscribe vào đúng slice cần thiết)
// ─────────────────────────────────────────────────────────────────────────────

export function selectProject(projectId: number | string) {
  const k = String(projectId);
  return (s: ProjectStore) => (s.projects[k] ?? EMPTY_LOADABLE) as LoadableItem<ProjectResponse>;
}

export function selectDashboard(projectId: number | string) {
  const k = String(projectId);
  return (s: ProjectStore) => (s.dashboards[k] ?? EMPTY_LOADABLE) as LoadableItem<ProjectDashboardResponse>;
}

export function selectMembers(projectId: number | string) {
  const k = String(projectId);
  return (s: ProjectStore) => s.members[k] ?? EMPTY_MEMBERS;
}

export function selectFolders(projectId: number | string) {
  const k = String(projectId);
  return (s: ProjectStore) => s.folders[k] ?? EMPTY_FOLDERS;
}

export function selectApplications(projectId: number | string) {
  const k = String(projectId);
  return (s: ProjectStore) => s.applications[k] ?? EMPTY_APPLICATIONS;
}
