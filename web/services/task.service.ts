import api from '@/lib/api';
import { parseDecimal } from '@/lib/utils';
import { deleteMaterial } from './material.service';

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
  materialId?: number;
};

/**
 * Tạo Task Frame (Khung chỉ định phạm vi công việc).
 * 
 * LƯU Ý KỸ THUẬT:
 * 1. Schema của cơ sở dữ liệu (Prisma) bắt buộc Frame phải gắn với một `materialId`.
 * 2. Do Task mới chưa có bản nộp nào, ta tạo một "Material ảo" làm điểm neo.
 * 3. Backend kích hoạt ValidationPipe với forbidNonWhitelisted: true. Request multipart/form-data
 *    phải gửi kèm ít nhất một file để vượt qua validator. Do đó, ta đính kèm một file giả `dummy` (Blob rỗng).
 *    Vì 'dummy' không nằm trong whitelist upload của Backend, nó sẽ bị bỏ qua (không upload lên S3)
 *    nhưng vẫn được ValidationPipe chấp thuận (tránh lỗi 400 Bad Request).
 * 4. Cơ chế Rollback: Nếu tạo Frame (bước 2) thất bại, Frontend tự động gọi DELETE /materials/:id để dọn dẹp material ảo.
 */
export async function createTaskFrame(
  materialId: number | string,
  payload: TaskFramePayload
) {
  const frameRes = await api.post<any, any>(`/materials/${materialId}/frames`, {
    name: 'Task Frame',
    startX: payload.startX,
    startY: payload.startY,
    endX: payload.endX,
    endY: payload.endY,
  });

  const frame = frameRes.data ?? frameRes;

  return {
    id: frame.id,
    materialId: Number(materialId),
    startX: parseDecimal(frame.startX),
    startY: parseDecimal(frame.startY),
    endX: parseDecimal(frame.endX),
    endY: parseDecimal(frame.endY),
  };
}

export async function getTaskFrames(taskId: number | string): Promise<TaskFrameResponse[]> {
  try {
    const response = await api.get<{ data: any[] }, { data: any[] }>(`/tasks/${taskId}/frames`);
    const frames = response.data ?? [];
    
    return frames.map((f: any) => ({
      id: f.id,
      taskId: Number(taskId),
      materialId: f.materialId ? Number(f.materialId) : undefined,
      startX: parseDecimal(f.startX),
      startY: parseDecimal(f.startY),
      endX: parseDecimal(f.endX),
      endY: parseDecimal(f.endY),
    }));
  } catch (err) {
    console.error('Failed to get task frames:', err);
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

export async function getTaskComments(taskId: number | string, page = 1, limit = 20) {
  const response = await api.get<{ data: any[]; pagination?: { total: number; page: number; limit: number; totalPages: number } }, any>(`/tasks/${taskId}/comments?page=${page}&limit=${limit}`);
  return response;
}

export async function createTaskComment(taskId: number | string, content: string) {
  const response = await api.post<{ data: any }, { data: any }>(`/tasks/${taskId}/comments`, { content });
  return response.data ?? response;
}

