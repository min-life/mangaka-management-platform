import api from '@/lib/api';
import type { UserSummaryResponse } from './editor-board.service';

export type ActivityLogAction =
  | 'APPLICATION_APPROVED'
  | 'APPLICATION_CREATED'
  | 'APPLICATION_INTERNAL_APPROVED'
  | 'APPLICATION_REJECTED'
  | 'APPLICATION_SUBMITTED'
  | 'COMMENT_CREATED'
  | 'COMMENT_DELETED'
  | 'FILE_CREATED'
  | 'FILE_DELETED'
  | 'FOLDER_CREATED'
  | 'FOLDER_DELETED'
  | 'FOLDER_MOVED'
  | 'MATERIAL_RESTORED'
  | 'MATERIAL_UPLOADED'
  | 'MEMBER_INVITED'
  | 'MEMBER_REMOVED'
  | 'ROLE_CHANGED'
  | 'TASK_ASSIGNED'
  | 'TASK_COMPLETED'
  | 'TASK_CREATED'
  | 'TASK_DELETED'
  | 'TASK_UPDATED';

export type ActivityLogResponse = {
  action: ActivityLogAction | string;
  actor?: UserSummaryResponse | null;
  actorId: number;
  createdAt: string;
  editorBoardId?: number | null;
  entityId: number;
  entityType: string;
  id: number;
  metadata?: unknown;
  projectId?: number | null;
};

type ActivityLogsResponse = {
  data?: ActivityLogResponse[];
  meta?: {
    limit: number;
    page: number;
    total: number;
    totalPages: number;
  };
  pagination?: {
    limit: number;
    page: number;
    total: number;
    totalPages: number;
  };
};

export async function getActivityLogs(params?: {
  actorId?: number;
  editorBoardId?: number;
  limit?: number;
  page?: number;
  projectId?: number;
}) {
  const response = await api.get<ActivityLogsResponse, ActivityLogsResponse>('/activity-logs', {
    params,
  });

  return {
    activities: response.data ?? [],
    meta: response.meta ?? response.pagination,
  };
}

export async function getEditorBoardActivityLogs(
  editorBoardId: number | string,
  params?: {
    limit?: number;
    page?: number;
  },
) {
  const response = await api.get<ActivityLogsResponse, ActivityLogsResponse>(
    `/editor-boards/${editorBoardId}/activity-logs`,
    {
      params,
    },
  );

  return {
    activities: response.data ?? [],
    meta: response.meta ?? response.pagination,
  };
}

export async function getProjectActivityLogs(
  projectId: number | string,
  params?: {
    limit?: number;
    page?: number;
  },
) {
  const response = await api.get<ActivityLogsResponse, ActivityLogsResponse>(
    `/projects/${projectId}/activity-logs`,
    {
      params,
    },
  );

  return {
    activities: response.data ?? [],
    meta: response.meta ?? response.pagination,
  };
}


