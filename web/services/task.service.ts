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
  parent?: {
    id: number;
    title: string;
    description: string | null;
    status: TaskStatus;
  } | null;
  status: TaskStatus;
  title: string;
  updatedAt: string;
  updatedBy: number | null;
  assignedByUser?: {
    id: number;
    email: string;
    displayName: string | null;
    avatarUrl: string | null;
  } | null;
  deadline?: string | null;
  file?: {
    id: number;
    title: string;
  } | null;
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
  // Backend TaskCommentFrame API is not implemented yet, mock return to prevent 404 AxiosErrors
  console.info(`[Mock] createTaskFrame for taskId: ${taskId}`, payload);
  return {
    id: Date.now(),
    taskId: Number(taskId),
    startX: payload.startX,
    startY: payload.startY,
    endX: payload.endX,
    endY: payload.endY,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: null,
    updatedBy: null,
  } as any;
}

export async function getTaskFrames(taskId: number | string): Promise<TaskFrameResponse[]> {
  // Backend TaskCommentFrame API is not implemented yet, return empty array to prevent 404 AxiosErrors
  return [];
}

export async function getMyTasks(query: { me: boolean; limit?: number; page?: number }) {
  const response = await api.get<{ data: TaskResponse[] }, { data: TaskResponse[] }>('/tasks', {
    params: query,
  });
  return response.data ?? [];
}
