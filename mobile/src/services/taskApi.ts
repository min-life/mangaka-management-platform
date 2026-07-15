import { ApiDataResponse, ApiFile, ApiFolder, ApiListResponse, ApiTask } from './apiTypes';
import { apiRequest } from './apiClient';
import { mapTaskCard, uniqueById } from './mappers';

type ListParams = Record<string, boolean | number | string | undefined | null>;

async function fetchAllList<T>(path: string, params: ListParams = {}) {
  const firstResponse = await apiRequest<ApiListResponse<T>>(path, {
    params: { ...params, limit: params.limit ?? 100, page: 1 },
  });
  const totalPages = firstResponse.pagination?.totalPages ?? 1;
  const data = [...(firstResponse.data ?? [])];

  if (totalPages > 1) {
    const remainingResponses = await Promise.all(
      Array.from({ length: totalPages - 1 }, (_, index) =>
        apiRequest<ApiListResponse<T>>(path, {
          params: { ...params, limit: params.limit ?? 100, page: index + 2 },
        }),
      ),
    );
    remainingResponses.forEach((response) => data.push(...(response.data ?? [])));
  }

  return {
    data,
    pagination: firstResponse.pagination,
  };
}

function matchesTaskFilters(
  task: ApiTask,
  params: { search?: string; status?: string },
) {
  const search = params.search?.trim().toLowerCase();
  const matchesSearch =
    !search ||
    task.title.toLowerCase().includes(search) ||
    (task.description ?? '').toLowerCase().includes(search);
  const matchesStatus = !params.status || task.status === params.status;

  return matchesSearch && matchesStatus;
}

export async function fetchProjectFileTasks(
  projectId: string,
  params: { search?: string; status?: string } = {},
) {
  const foldersResponse = await fetchAllList<ApiFolder>(`/projects/${projectId}/folders`, {
    field: 'createdAt',
    limit: 100,
    order: 'desc',
  });

  const filesResponses = await Promise.all(
    foldersResponse.data.map((folder) =>
      fetchAllList<ApiFile>(`/folders/${folder.id}/files`, {
        field: 'createdAt',
        limit: 100,
        order: 'desc',
      }).catch(() => ({ data: [] as ApiFile[], pagination: undefined })),
    ),
  );
  const files = filesResponses.flatMap((response) => response.data);

  const taskResponses = await Promise.all(
    files.map((file) =>
      fetchAllList<ApiTask>(`/files/${file.id}/tasks`, {
        field: 'createdAt',
        limit: 100,
        order: 'desc',
      })
        .then((response) =>
          response.data.map((task) => ({
            ...task,
            file: {
              ...(task.file ?? file),
              folder: task.file?.folder ?? file.folder,
              id: task.file?.id ?? file.id,
              title: task.file?.title ?? file.title,
            },
            fileId: task.fileId ?? file.id,
          })),
        )
        .catch(() => [] as ApiTask[]),
    ),
  );
  const tasks = uniqueById(
    taskResponses
      .flat()
      .filter((task) => matchesTaskFilters(task, params))
      .sort((a, b) => (new Date(b.createdAt).getTime() || 0) - (new Date(a.createdAt).getTime() || 0))
      .map(mapTaskCard),
  );

  return {
    pagination: {
      limit: tasks.length,
      page: 1,
      total: tasks.length,
      totalPages: 1,
    },
    rawTasks: taskResponses.flat().filter((task) => matchesTaskFilters(task, params)),
    tasks,
  };
}

export async function fetchTasks(
  params: { projectId?: string; search?: string; status?: string } = {},
) {
  if (params.projectId) {
    return fetchProjectFileTasks(params.projectId, {
      search: params.search,
      status: params.status,
    });
  }

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
