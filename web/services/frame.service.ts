import api from '@/lib/api';

export type FrameResponse = {
  createdAt: string;
  createdBy: number | null;
  endX: number | string;
  endY: number | string;
  id: number;
  startX: number | string;
  startY: number | string;
  taskId: number;
  updatedAt: string;
  updatedBy: number | null;
};

export type UpdateFramePayload = {
  endX?: number;
  endY?: number;
  startX?: number;
  startY?: number;
};

type FrameItemResponse = {
  data?: FrameResponse;
};

export async function getFrameById(frameId: number | string) {
  const response = await api.get<FrameItemResponse, FrameItemResponse>(`/frames/${frameId}`);

  return response.data ?? (response as FrameResponse);
}

export async function updateFrame(frameId: number | string, payload: UpdateFramePayload) {
  const response = await api.patch<FrameItemResponse, FrameItemResponse>(
    `/frames/${frameId}`,
    payload,
  );

  return response.data ?? (response as FrameResponse);
}

export async function deleteFrame(frameId: number | string) {
  await api.delete(`/frames/${frameId}`);
}
