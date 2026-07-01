import api from '@/lib/api';
import type { UserSummaryResponse } from './editor-board.service';

export type FileResponse = {
  createdAt: string;
  createdBy: number | null;
  createdByUser?: UserSummaryResponse | null;
  description: string | null;
  folderId: number;
  id: number;
  title: string;
  updatedAt: string;
  updatedBy: number | null;
  updatedByUser?: UserSummaryResponse | null;
};

export type UpdateFilePayload = {
  description?: string;
  title?: string;
};

type FileItemResponse = {
  data?: FileResponse;
};

export async function getFileById(fileId: number | string) {
  const response = await api.get<FileItemResponse, FileItemResponse>(`/files/${fileId}`);

  return response.data ?? (response as FileResponse);
}

export async function updateFile(fileId: number | string, payload: UpdateFilePayload) {
  const response = await api.patch<FileItemResponse, FileItemResponse>(`/files/${fileId}`, payload);

  return response.data ?? (response as FileResponse);
}

export async function deleteFile(fileId: number | string) {
  await api.delete(`/files/${fileId}`);
}

export type MaterialItem = {
  downloadUrl?: string;
  height?: number;
  isThumbnail?: boolean;
  mimeType: string;
  originalName: string;
  ratio?: number;
  size: number;
  url: string;
  width?: number;
};

export type FileVersionResponse = {
  createdAt: string;
  createdByUser?: UserSummaryResponse | null;
  fileId: number;
  id: number;
  materials: MaterialItem[];
  updatedAt: string;
  updatedByUser?: UserSummaryResponse | null;
};

export type FileVersionsResponse = {
  pagination?: {
    limit: number;
    page: number;
    total: number;
    totalPages: number;
  };
  versions: FileVersionResponse[];
};

export async function getFileMaterialVersions(fileId: number | string) {
  const response = await api.get<FileVersionsResponse, FileVersionsResponse>(
    `/files/${fileId}/versions`,
    { params: { page: 1, limit: 100 } },
  );
  return response;
}

export async function getFileMaterials(fileId: number | string) {
  const response = await api.get<{ data: FileVersionResponse[] }, { data: FileVersionResponse[] }>(
    `/files/${fileId}/materials`,
    { params: { page: 1, limit: 100 } },
  );
  return response.data ?? [];
}

export async function createMaterial(fileId: number | string, formData: FormData) {
  const response = await api.post<{ data: FileVersionResponse }, { data: FileVersionResponse }>(
    `/files/${fileId}/materials`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 300000,
    },
  );
  return response.data;
}

export async function getFileTasks(fileId: number | string) {
  const response = await api.get<{ data: unknown[] }, { data: unknown[] }>(`/files/${fileId}/tasks`);
  return response.data ?? [];
}

export async function createFileTask(
  fileId: number | string,
  payload: {
    assignedBy?: number;
    deadline?: string;
    description?: string;
    parentId?: number;
    status?: string;
    title: string;
  },
) {
  const response = await api.post<{ data: { id: number } }, { data: { id: number } }>(
    `/files/${fileId}/tasks`,
    payload,
  );
  return response.data;
}

export async function getFileComments(fileId: number | string) {
  const response = await api.get<{ data: unknown[] }, { data: unknown[] }>(`/files/${fileId}/comments`);
  return response.data ?? [];
}

export async function createFileComment(fileId: number | string, content: string | object) {
  const response = await api.post<{ data: unknown }, { data: unknown }>(`/files/${fileId}/comments`, {
    content,
  });
  return response.data;
}

export type ActivityLogActor = {
  id: number;
  displayName: string | null;
  avatarUrl: string | null;
  email: string;
};

export type ActivityLogResponse = {
  id: number;
  action: string;
  entityType: string;
  entityId: number;
  projectId?: number | null;
  editorBoardId?: number | null;
  fileId?: number | null;
  actorId: number;
  metadata?: any;
  createdAt: string;
  actor?: ActivityLogActor | null;
};

export type FileActivityLogsResponse = {
  data: ActivityLogResponse[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

export async function getFileActivityLogs(fileId: number | string, page = 1, limit = 20) {
  const response = await api.get<FileActivityLogsResponse, FileActivityLogsResponse>(
    `/files/${fileId}/activity-logs`,
    { params: { page, limit } }
  );
  return response;
}

