import api from '@/lib/api';

export type MaterialResponse = {
  createdAt: string;
  createdBy: number | null;
  fileId: number;
  id: number;
  materials: unknown;
  updatedAt: string;
  updatedBy: number | null;
};

export type UpdateMaterialPayload = {
  materials: unknown;
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
  payload: UpdateMaterialPayload,
) {
  const response = await api.patch<MaterialItemResponse, MaterialItemResponse>(
    `/materials/${materialId}`,
    payload,
  );

  return response.data ?? (response as MaterialResponse);
}

export async function deleteMaterial(materialId: number | string) {
  await api.delete(`/materials/${materialId}`);
}

export async function addMaterialItems(materialId: number | string, formData: FormData) {
  const response = await api.post<MaterialItemResponse, MaterialItemResponse>(
    `/materials/${materialId}/add`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    },
  );
  return response.data;
}
