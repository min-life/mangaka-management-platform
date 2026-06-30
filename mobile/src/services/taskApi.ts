import { ApiDataResponse, ApiListResponse, ApiTask } from './apiTypes';
import { apiRequest } from './apiClient';
import { mapTaskCard } from './mappers';

export async function fetchTasks(params: { projectId?: string; search?: string; status?: string } = {}) {
  const path = params.projectId ? `/projects/${params.projectId}/tasks` : '/tasks';
  const response = await apiRequest<ApiListResponse<ApiTask>>(path, {
    params: {
      limit: 100,
      me: true,
      page: 1,
      search: params.search,
      status: params.status,
    },
  });

  return {
    rawTasks: response.data ?? [],
    tasks: (response.data ?? []).map(mapTaskCard),
  };
}

export async function fetchTask(taskId: string) {
  const response = await apiRequest<ApiDataResponse<ApiTask>>(`/tasks/${taskId}`);
  if (!response.data) throw new Error('Task not found');
  return response.data;
}

