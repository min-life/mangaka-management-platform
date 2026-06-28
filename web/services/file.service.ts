import api from '@/lib/api';

export type FileResponse = {
  createdAt: string;
  createdBy: number | null;
  description: string | null;
  folderId: number;
  id: number;
  title: string;
  updatedAt: string;
  updatedBy: number | null;
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
