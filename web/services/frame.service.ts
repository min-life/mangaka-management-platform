import api from '@/lib/api';

export type FrameResponse = {
  createdAt: string;
  createdBy: number | null;
  endX: number | string;
  endY: number | string;
  id: number;
  startX: number | string;
  startY: number | string;
  taskId?: number | null;
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

export type FrameCommentResponse = {
  content: unknown;
  createdAt: string;
  createdByUser?: {
    avatarUrl?: string | null;
    displayName?: string | null;
    email: string;
    id: number;
  } | null;
  frame?: {
    id: number;
    name?: string | null;
  } | null;
  frameId?: number | null;
  id: number;
  material?: {
    id: number;
    name?: string | null;
  } | null;
  taskId?: number | null;
  updatedAt: string;
};

export async function getFrameComments(frameId: number | string) {
  const response = await api.get<
    { data: FrameCommentResponse[] },
    { data: FrameCommentResponse[] }
  >(`/frames/${frameId}/comments`, { params: { page: 1, limit: 100 } });

  return response.data ?? [];
}

export async function createFrameComment(frameId: number | string, content: unknown) {
  const response = await api.post<
    { data: FrameCommentResponse },
    { data: FrameCommentResponse }
  >(`/frames/${frameId}/comments`, { content });

  return response.data;
}
