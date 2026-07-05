import {
  ApiApplication,
  ApiDataResponse,
  ApiEditorBoard,
  ApiFolder,
  ApiListResponse,
  ApiProject,
  ApiProjectMember,
  ApiTask,
} from './apiTypes';
import { apiRequest } from './apiClient';
import { mapProject, mapProjectMember, uniqueById } from './mappers';
import { fetchProjectResourceStats } from './resourceApi';

function emptyListResponse<T>(): ApiListResponse<T> {
  return { data: [], pagination: undefined };
}

export async function fetchProjects(params: { me?: boolean; name?: string } = {}) {
  const response = await apiRequest<ApiListResponse<ApiProject>>('/projects', {
    params: {
      // field: '',
      limit: 10,
      me: params.me ?? false,
      name: params.name,
      order: 'desc',
      page: 1,
    },
  });

  return {
    pagination: response.pagination,
    projects: uniqueById((response.data ?? []).map((project) => mapProject(project))),
    rawProjects: response.data ?? [],
  };
}

export async function updateProject(
  projectId: string,
  data: { name?: string },
) {
  const response = await apiRequest<ApiDataResponse<ApiProject>>(`/projects/${projectId}`, {
    body: data,
    method: 'PATCH',
  });

  if (!response.data) {
    throw new Error('Project update response is missing.');
  }

  return response.data;
}

export async function fetchProjectBundle(
  projectId: string,
  options: { includeResourceStats?: boolean } = {},
) {
  const [
    projectResponse,
    boardResponse,
    applicationsResponse,
    statsResponse,
    tasksResponse,
    foldersResponse,
    membersResponse,
    resourceStats,
  ] = await Promise.all([
    apiRequest<ApiDataResponse<ApiProject>>(`/projects/${projectId}`),
    apiRequest<ApiDataResponse<ApiEditorBoard | null>>(
      `/projects/${projectId}/editor-boards`,
    ).catch(() => ({ data: null })),
    apiRequest<ApiListResponse<ApiApplication>>(`/projects/${projectId}/applications`, {
      params: { field: 'createdAt', limit: 50, order: 'desc', page: 1 },
    }).catch(() => emptyListResponse<ApiApplication>()),
    apiRequest<ApiDataResponse<{ metrics?: Record<string, unknown> }>>(
      `/projects/${projectId}/stats`,
    ).catch(() => ({ data: undefined })),
    apiRequest<ApiListResponse<ApiTask>>(`/projects/${projectId}/tasks`, {
      params: { limit: 100, me: true, page: 1 },
    }).catch(() => emptyListResponse<ApiTask>()),
    apiRequest<ApiListResponse<ApiFolder>>(`/projects/${projectId}/folders`, {
      params: { limit: 100, page: 1 },
    }).catch(() => emptyListResponse<ApiFolder>()),
    apiRequest<ApiListResponse<ApiProjectMember>>(`/projects/${projectId}/members`, {
      params: { limit: 1, page: 1 },
    }).catch(() => emptyListResponse<ApiProjectMember>()),
    options.includeResourceStats
      ? fetchProjectResourceStats(projectId).catch(() => null)
      : Promise.resolve(null),
  ]);

  const project = projectResponse.data;
  if (!project) throw new Error('Project not found');
  const applications = applicationsResponse.data ?? [];
  const folders = foldersResponse.data ?? [];
  const tasks = tasksResponse.data ?? [];

  return {
    applications,
    board: boardResponse.data ?? null,
    folders,
    project: mapProject(project, {
      applicationTotal: applicationsResponse.pagination?.total ?? applications.length,
      applications,
      board: boardResponse.data ?? null,
      folderTotal: foldersResponse.pagination?.total ?? folders.length,
      folders,
      memberTotal:
        membersResponse.pagination?.total ??
        project.userProjects?.length ??
        project._count?.userProjects ??
        0,
      resourceStats,
      stats: statsResponse.data?.metrics ?? null,
      taskTotal: tasksResponse.pagination?.total ?? tasks.length,
      tasks,
    }),
    resourceStats,
    stats: statsResponse.data?.metrics ?? null,
    tasks,
  };
}

export async function fetchProjectMembers(projectId: string, params: { search?: string } = {}) {
  const response = await apiRequest<ApiListResponse<ApiProjectMember>>(
    `/projects/${projectId}/members`,
    {
      params: {
        limit: 100,
        page: 1,
        search: params.search,
      },
    },
  );

  return {
    members: uniqueById((response.data ?? []).map(mapProjectMember)),
    pagination: response.pagination,
    rawMembers: response.data ?? [],
  };
}
