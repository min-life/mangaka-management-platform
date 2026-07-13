import api from '@/lib/api';
import type { FileVersionResponse } from './file.service';

export type MaterialResponse = {
  createdAt: string;
  createdBy: number | null;
  fileId: number;
  id: number;
  materials: unknown;
  updatedAt: string;
  updatedBy: number | null;
};

export type UpdateMaterialOptions = {
  deleteImage?: boolean;
  deleteSource?: boolean;
  deleteText?: boolean;
  taskId?: number;
  name?: string;
};

type MaterialItemResponse = {
  data?: MaterialResponse;
};

export async function getMaterialById(materialId: number | string) {
  const response = await api.get<MaterialItemResponse, MaterialItemResponse>(
    `/materials/${materialId}`,
  );

  return response.data ?? (response as MaterialResponse);
}

export async function updateMaterial(
  materialId: number | string,
  formData: FormData,
  options: UpdateMaterialOptions = {},
) {
  const response = await api.patch<{ data: FileVersionResponse }, { data: FileVersionResponse }>(
    `/materials/${materialId}`,
    formData,
    {
      params: options,
      timeout: 300000,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    },
  );

  return response.data;
}

export async function deleteMaterial(materialId: number | string) {
  await api.delete(`/materials/${materialId}`);
}

export async function restoreMaterial(materialId: number | string) {
  const response = await api.post<MaterialItemResponse, MaterialItemResponse>(
    `/materials/${materialId}/restore`,
  );
  return response.data;
}

export type MaterialFramePayload = {
  endX: number;
  endY: number;
  name?: string;
  startX: number;
  startY: number;
};

export type MaterialFrameResponse = MaterialFramePayload & {
  createdAt?: string;
  createdBy?: number | null;
  id: number;
  materialId?: number;
  updatedAt?: string;
  updatedBy?: number | null;
};

export async function getMaterialFrames(materialId: number | string) {
  const response = await api.get<
    { data: MaterialFrameResponse[] },
    { data: MaterialFrameResponse[] }
  >(`/materials/${materialId}/frames`, { params: { page: 1, limit: 100 } });

  return response.data ?? [];
}

export async function createMaterialFrame(
  materialId: number | string,
  payload: MaterialFramePayload,
) {
  const response = await api.post<
    { data: MaterialFrameResponse },
    { data: MaterialFrameResponse }
  >(`/materials/${materialId}/frames`, payload);

  return response.data;
}
