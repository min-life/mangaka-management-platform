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
  deadline?: string;
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
  const frame = {
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
  };

  if (typeof window !== 'undefined') {
    const key = `inkly-task-frames:${taskId}`;
    const existing = getStoredTaskFrames(taskId);
    window.localStorage.setItem(key, JSON.stringify([...existing, frame]));
  }

  return frame as any;
}

export async function getTaskFrames(taskId: number | string): Promise<TaskFrameResponse[]> {
  return getStoredTaskFrames(taskId);
}

function getStoredTaskFrames(taskId: number | string): TaskFrameResponse[] {
  if (typeof window === 'undefined') {
    return [];
  }
  const key = `inkly-task-frames:${taskId}`;
  const stored = window.localStorage.getItem(key);
  if (!stored) {
    return [];
  }
  try {
    return JSON.parse(stored) as TaskFrameResponse[];
  } catch {
    return [];
  }
}

export async function getMyTasks(query: { me: boolean; limit?: number; page?: number }) {
  const response = await api.get<{ data: TaskResponse[]; pagination?: any }, { data: TaskResponse[]; pagination?: any }>('/tasks', {
    params: query,
  });
  return {
    tasks: response.data ?? [],
    pagination: response.pagination,
  };
}

export async function getProjectTasks(
  projectId: number | string,
  query?: {
    me?: boolean;
    search?: string;
    status?: string;
    field?: string;
    order?: string;
    page?: number;
    limit?: number;
  },
) {
  const response = await api.get<{ data: TaskResponse[] }, { data: TaskResponse[] }>(
    `/projects/${projectId}/tasks`,
    { params: query },
  );
  return response.data ?? [];
}

export async function getTaskChildren(
  taskId: number | string,
  query?: {
    search?: string;
    status?: string;
    field?: string;
    order?: string;
    page?: number;
    limit?: number;
  },
) {
  const response = await api.get<{ data: TaskResponse[] }, { data: TaskResponse[] }>(
    `/tasks/${taskId}/children`,
    { params: query },
  );
  return response.data ?? [];
}

export async function getTaskMaterials(taskId: number | string) {
  const response = await api.get<any, any>(`/tasks/${taskId}/materials`);
  return response.data ?? response;
}

export async function getTaskComments(taskId: number | string) {
  const response = await api.get<{ data: any[] }, { data: any[] }>(`/tasks/${taskId}/comments`);
  return response.data ?? [];
}

export async function createTaskComment(taskId: number | string, content: string) {
  const response = await api.post<{ data: any }, { data: any }>(`/tasks/${taskId}/comments`, { content });
  return response.data ?? response;
}

