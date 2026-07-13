import { create } from 'zustand';

import {
  getEditorBoardApplications,
  getEditorBoardDashboard,
  type EditorBoardDashboardResponse,
} from '@/services/editor-board.service';
import {
  getEditorBoardActivityLogs,
  type ActivityLogResponse,
} from '@/services/activity-log.service';
import type { ApplicationResponse } from '@/services/application.service';
import { getMyBoardPermissions } from '@/services/permission.service';

import { getEditorBoardApiErrorMessage } from '../utils/api-error';

export type EditorBoardPaginationState = {
  page: number;
  total: number;
  totalPages: number;
};

type DashboardCacheItem = {
  activities: ActivityLogResponse[];
  activityError: string | null;
  data: EditorBoardDashboardResponse<ApplicationResponse> | null;
  error: string | null;
  isLoading: boolean;
  loaded: boolean;
};

type ApplicationsCacheItem = {
  applications: ApplicationResponse[];
  error: string | null;
  isLoading: boolean;
  isLoadingMore: boolean;
  loaded: boolean;
  pagination: EditorBoardPaginationState | null;
};

type EditorBoardStore = {
  applicationPages: Record<string, ApplicationsCacheItem>;
  boardPermissions: Record<string, string[]>;
  boardPermissionsLoaded: Record<string, boolean>;
  dashboards: Record<string, DashboardCacheItem>;
  loadApplicationsPage: (
    boardId: number | string,
    params: {
      force?: boolean;
      limit: number;
      mode: 'append' | 'replace';
      page: number;
      search?: string;
    },
  ) => Promise<void>;
  loadBoardPermissions: (boardId: number | string, force?: boolean) => Promise<void>;
  loadDashboard: (boardId: number | string, force?: boolean) => Promise<void>;
};

export function getEditorBoardApplicationsCacheKey(boardId: number | string, search?: string) {
  return `${boardId}:${search?.trim().toLowerCase() ?? ''}`;
}

const EMPTY_DASHBOARD_ITEM: DashboardCacheItem = {
  activities: [],
  activityError: null,
  data: null,
  error: null,
  isLoading: false,
  loaded: false,
};

const EMPTY_APPLICATIONS_ITEM: ApplicationsCacheItem = {
  applications: [],
  error: null,
  isLoading: false,
  isLoadingMore: false,
  loaded: false,
  pagination: null,
};

function dedupeApplications(applications: ApplicationResponse[]) {
  const applicationsById = new Map<number, ApplicationResponse>();

  applications.forEach((application) => {
    applicationsById.set(application.id, application);
  });

  return Array.from(applicationsById.values());
}

export const useEditorBoardStore = create<EditorBoardStore>((set, get) => ({
  applicationPages: {},
  boardPermissions: {},
  boardPermissionsLoaded: {},
  dashboards: {},

  loadApplicationsPage: async (boardId, params) => {
    const search = params.search?.trim() || undefined;
    const cacheKey = getEditorBoardApplicationsCacheKey(boardId, search);
    const cachedPage = get().applicationPages[cacheKey];

    if (!params.force && params.mode === 'replace' && params.page === 1 && cachedPage?.loaded) {
      return;
    }

    const isAppend = params.mode === 'append';

    set((state) => ({
      applicationPages: {
        ...state.applicationPages,
        [cacheKey]: {
          ...(state.applicationPages[cacheKey] ?? EMPTY_APPLICATIONS_ITEM),
          error: null,
          isLoading: !isAppend,
          isLoadingMore: isAppend,
        },
      },
    }));

    try {
      const response = await getEditorBoardApplications(boardId, {
        limit: params.limit,
        page: params.page,
        search,
      });

      set((state) => {
        const currentPage = state.applicationPages[cacheKey] ?? EMPTY_APPLICATIONS_ITEM;
        const applications = isAppend
          ? dedupeApplications([...currentPage.applications, ...response.applications])
          : response.applications;

        return {
          applicationPages: {
            ...state.applicationPages,
            [cacheKey]: {
              applications,
              error: null,
              isLoading: false,
              isLoadingMore: false,
              loaded: true,
              pagination: response.pagination
                ? {
                    page: response.pagination.page,
                    total: response.pagination.total,
                    totalPages: response.pagination.totalPages,
                  }
                : {
                    page: params.page,
                    total: applications.length,
                    totalPages: params.page,
                  },
            },
          },
        };
      });
    } catch (error) {
      set((state) => ({
        applicationPages: {
          ...state.applicationPages,
          [cacheKey]: {
            ...(state.applicationPages[cacheKey] ?? EMPTY_APPLICATIONS_ITEM),
            error: getEditorBoardApiErrorMessage(error, 'Unable to load applications.'),
            isLoading: false,
            isLoadingMore: false,
          },
        },
      }));
    }
  },

  loadBoardPermissions: async (boardId, force = false) => {
    const key = String(boardId);

    if (!force && get().boardPermissionsLoaded[key]) {
      return;
    }

    try {
      const permissions = await getMyBoardPermissions(boardId);

      set((state) => ({
        boardPermissions: {
          ...state.boardPermissions,
          [key]: permissions,
        },
        boardPermissionsLoaded: {
          ...state.boardPermissionsLoaded,
          [key]: true,
        },
      }));
    } catch {
      set((state) => ({
        boardPermissions: {
          ...state.boardPermissions,
          [key]: [],
        },
        boardPermissionsLoaded: {
          ...state.boardPermissionsLoaded,
          [key]: true,
        },
      }));
    }
  },

  loadDashboard: async (boardId, force = false) => {
    const key = String(boardId);
    const cachedDashboard = get().dashboards[key];

    if (!force && cachedDashboard?.loaded) {
      return;
    }

    set((state) => ({
      dashboards: {
        ...state.dashboards,
        [key]: {
          ...(state.dashboards[key] ?? EMPTY_DASHBOARD_ITEM),
          activityError: null,
          error: null,
          isLoading: true,
        },
      },
    }));

    try {
      const [dashboardData, activityResult] = await Promise.all([
        getEditorBoardDashboard<ApplicationResponse>(boardId),
        getEditorBoardActivityLogs(boardId, { limit: 3, page: 1 }).catch((error) => error),
      ]);
      const activityError =
        activityResult instanceof Error
          ? getEditorBoardApiErrorMessage(activityResult, 'Unable to load recent activity.')
          : null;

      set((state) => ({
        dashboards: {
          ...state.dashboards,
          [key]: {
            activities: activityError ? [] : (activityResult?.activities ?? []),
            activityError,
            data: dashboardData,
            error: null,
            isLoading: false,
            loaded: true,
          },
        },
      }));
    } catch (error) {
      set((state) => ({
        dashboards: {
          ...state.dashboards,
          [key]: {
            ...(state.dashboards[key] ?? EMPTY_DASHBOARD_ITEM),
            error: getEditorBoardApiErrorMessage(error, 'Failed to load board details.'),
            isLoading: false,
            loaded: true,
          },
        },
      }));
    }
  },
}));
