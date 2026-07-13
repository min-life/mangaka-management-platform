import { ApiDataResponse, ApiFile, ApiListResponse, ApiTask } from './apiTypes';
import { apiRequest } from './apiClient';
import { mapTaskCard, uniqueById } from './mappers';

export async function fetchTasks(
  params: { projectId?: string; search?: string; status?: string } = {},
) {
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
    pagination: response.pagination,
    rawTasks: response.data ?? [],
    tasks: uniqueById((response.data ?? []).map(mapTaskCard)),
  };
}

export async function fetchTask(taskId: string) {
  const response = await apiRequest<ApiDataResponse<ApiTask>>(`/tasks/${taskId}`);
  if (!response.data) throw new Error('Task not found');
  return response.data;
}

function stringId(value: unknown) {
  if (value === undefined || value === null || value === '') return '';
  return String(value);
}

function taskProjectId(task: ApiTask) {
  return stringId(task.file?.folder?.projectId ?? task.file?.folder?.project?.id);
}

export async function fetchTaskResourceTarget(taskId: string) {
  const task = await fetchTask(taskId);
  const fileId = stringId(task.fileId ?? task.file?.id);

  if (!fileId) {
    throw new Error('This task is not linked to a file.');
  }

  let projectId = taskProjectId(task);

  if (!projectId) {
    const fileResponse = await apiRequest<ApiDataResponse<ApiFile>>(`/files/${fileId}`);
    const file = fileResponse.data;
    projectId = stringId(file?.folder?.projectId ?? file?.folder?.project?.id);
  }

  if (!projectId) {
    throw new Error('Could not find the project for this task file.');
  }

  return { fileId, projectId };
}
