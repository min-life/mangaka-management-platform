import { Colors } from '@/src/constants/colors';
import { ActivityItem } from '@/src/types/home';

import { apiRequest } from './apiClient';
import {
  ApiActivityLog,
  ApiEditorBoard,
  ApiFile,
  ApiFolder,
  ApiListResponse,
  ApiProject,
  PaginationResponse,
} from './apiTypes';
import { displayName, relativeDate } from './formatters';
import { mapActivityLogTarget } from './mappers';

interface ActivityLogsResponse extends ApiListResponse<ApiActivityLog> {
  meta?: PaginationResponse;
}

export type ActivityLogFilterType = 'editorBoard' | 'file' | 'project';

export interface ActivityLogFilterOption {
  id: string;
  label: string;
  subtitle?: string;
}

export interface FetchActivityLogsParams {
  editorBoardId?: string | null;
  fileId?: string | null;
  limit?: number;
  page?: number;
  projectId?: string | null;
}

function humanizeAction(action?: string) {
  return (action ?? 'Activity')
    .toLowerCase()
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function activityIcon(entityType?: string) {
  const normalized = (entityType ?? '').toLowerCase();
  if (normalized.includes('application')) return 'apps';
  if (normalized.includes('editor_board')) return 'groups';
  if (normalized.includes('project') || normalized.includes('folder')) return 'folder';
  if (normalized.includes('comment')) return 'comment';
  if (normalized.includes('material') || normalized.includes('file')) return 'article';
  return 'checklist';
}

function activityColor(entityType?: string) {
  const normalized = (entityType ?? '').toLowerCase();
  if (normalized.includes('application')) return Colors.iconApp;
  if (normalized.includes('project') || normalized.includes('folder')) return Colors.iconFolder;
  if (normalized.includes('comment')) return Colors.statusReview;
  if (normalized.includes('material') || normalized.includes('file')) return Colors.statusDone;
  return Colors.statusProgress;
}

function activitySubtitle(log: ApiActivityLog) {
  const actor = log.actor ? displayName(log.actor) : 'You';
  return `${actor} triggered ${humanizeAction(log.action).toLowerCase()}.`;
}

export function mapActivityLog(log: ApiActivityLog, index: number, list: ApiActivityLog[]): ActivityItem {
  const iconColor = activityColor(log.entityType);

  return {
    bgColor: `${iconColor}33`,
    hasLine: index < list.length - 1,
    icon: activityIcon(log.entityType),
    iconColor,
    id: String(log.id),
    subtitle: activitySubtitle(log),
    target: mapActivityLogTarget(log),
    time: relativeDate(log.createdAt),
    title: humanizeAction(log.action),
  };
}

function uniqueOptions(options: ActivityLogFilterOption[]) {
  const seen = new Set<string>();
  return options.filter((option) => {
    if (seen.has(option.id)) return false;
    seen.add(option.id);
    return true;
  });
}

function listData<T>(response: ApiListResponse<T>) {
  return response.data ?? [];
}

async function fetchProjectOptions(): Promise<ActivityLogFilterOption[]> {
  const response = await apiRequest<ApiListResponse<ApiProject>>('/projects', {
    params: {
      limit: 100,
      me: false,
      order: 'desc',
      page: 1,
    },
  });

  return listData(response).map((project) => ({
    id: String(project.id),
    label: project.name,
  }));
}

async function fetchEditorBoardOptions(): Promise<ActivityLogFilterOption[]> {
  const response = await apiRequest<ApiListResponse<ApiEditorBoard>>('/editor-boards', {
    params: {
      limit: 100,
      me: false,
      page: 1,
    },
  });

  return listData(response).map((board) => ({
    id: String(board.id),
    label: board.name,
  }));
}

async function fetchFileOptions(): Promise<ActivityLogFilterOption[]> {
  const projects = await fetchProjectOptions();
  const folderResponses = await Promise.all(
    projects.map((project) =>
      apiRequest<ApiListResponse<ApiFolder>>(`/projects/${project.id}/folders`, {
        params: {
          limit: 100,
          page: 1,
        },
      }).catch(() => ({ data: [] })),
    ),
  );
  const folders = folderResponses.flatMap((response) => response.data ?? []);

  const fileResponses = await Promise.all(
    folders.map((folder) =>
      apiRequest<ApiListResponse<ApiFile>>(`/folders/${folder.id}/files`, {
        params: {
          field: 'createdAt',
          limit: 100,
          order: 'desc',
          page: 1,
        },
      })
        .then((response) => ({
          files: response.data ?? [],
          folderTitle: folder.title,
        }))
        .catch(() => ({ files: [], folderTitle: folder.title })),
    ),
  );

  return uniqueOptions(
    fileResponses.flatMap(({ files, folderTitle }) =>
      files.map((file) => ({
        id: String(file.id),
        label: file.title,
        subtitle: file.folder?.title ?? folderTitle,
      })),
    ),
  );
}

export async function fetchActivityLogFilterOptions(type: ActivityLogFilterType) {
  if (type === 'project') return fetchProjectOptions();
  if (type === 'editorBoard') return fetchEditorBoardOptions();
  return fetchFileOptions();
}

export async function fetchActivityLogs(params: FetchActivityLogsParams = {}) {
  const response = await apiRequest<ActivityLogsResponse>('/activity-logs', {
    params: {
      editorBoardId: params.editorBoardId,
      fileId: params.fileId,
      limit: params.limit ?? 5,
      page: params.page ?? 1,
      projectId: params.projectId,
    },
  });
  const data = response.data ?? [];

  return {
    activities: data.map(mapActivityLog),
    pagination: response.pagination ?? response.meta,
    rawActivityLogs: data,
  };
}

export async function fetchProjectActivityLogs(
  projectId: string,
  params: Omit<FetchActivityLogsParams, 'projectId'> = {},
) {
  const response = await apiRequest<ActivityLogsResponse>(
    `/projects/${projectId}/activity-logs`,
    {
      params: {
        editorBoardId: params.editorBoardId,
        fileId: params.fileId,
        limit: params.limit ?? 12,
        page: params.page ?? 1,
      },
    },
  );
  const data = response.data ?? [];

  return {
    activities: data.map(mapActivityLog),
    pagination: response.pagination ?? response.meta,
    rawActivityLogs: data,
  };
}
