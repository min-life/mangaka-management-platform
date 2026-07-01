import api from '@/lib/api';

export type TaskStatus = 'DONE' | 'INPROGRESS' | 'PENDING' | 'REVIEW';

export type TaskResponse = {
  assignedBy: number | null;
  createdAt: string;
  createdBy: number | null;
  description: string | null;
  fileId: number;
  id: number;
  parentId: number | null;
  status: TaskStatus;
  title: string;
  updatedAt: string;
  updatedBy: number | null;
};

export type UpdateTaskPayload = {
  assignedBy?: number;
  description?: string;
  parentId?: number;
  status?: TaskStatus;
  title?: string;
};

type TaskItemResponse = {
  data?: TaskResponse;
};

export async function getTaskById(taskId: number | string) {
  const response = await api.get<TaskItemResponse, TaskItemResponse>(`/tasks/${taskId}`);

  return response.data ?? (response as TaskResponse);
}

export async function updateTask(taskId: number | string, payload: UpdateTaskPayload) {
  const response = await api.patch<TaskItemResponse, TaskItemResponse>(`/tasks/${taskId}`, payload);

  return response.data ?? (response as TaskResponse);
}

export async function deleteTask(taskId: number | string) {
  await api.delete(`/tasks/${taskId}`);
}

export type TaskFramePayload = {
  endX: number;
  endY: number;
  startX: number;
  startY: number;
};

export type TaskFrameResponse = TaskFramePayload & {
  id: number;
  taskId: number;
};

export async function createTaskFrame(taskId: number | string, payload: TaskFramePayload) {
  const response = await api.post<{ data: TaskFrameResponse }, { data: TaskFrameResponse }>(
    `/tasks/${taskId}/frames`,
    payload,
  );
  return response.data;
}

export async function getTaskFrames(taskId: number | string) {
  const response = await api.get<{ data: TaskFrameResponse[] }, { data: TaskFrameResponse[] }>(
    `/tasks/${taskId}/frames`,
  );
  return response.data ?? [];
}
