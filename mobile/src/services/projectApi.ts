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

export async function fetchProjects(params: { name?: string } = {}) {
  const response = await apiRequest<ApiListResponse<ApiProject>>('/projects', {
    params: {
      // field: '',
      limit: 10,
      me: false,
      // name: params.name,
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

export async function fetchProjectBundle(projectId: string) {
  const [
    projectResponse,
    boardResponse,
    applicationsResponse,
    statsResponse,
    tasksResponse,
    foldersResponse,
  ] = await Promise.all([
    apiRequest<ApiDataResponse<ApiProject>>(`/projects/${projectId}`),
    apiRequest<ApiDataResponse<ApiEditorBoard | null>>(
      `/projects/${projectId}/editor-boards`,
    ).catch(() => ({ data: null })),
    apiRequest<ApiListResponse<ApiApplication>>(`/projects/${projectId}/applications`, {
      params: { field: 'createdAt', limit: 50, order: 'desc', page: 1 },
    }).catch(() => ({ data: [] })),
    apiRequest<ApiDataResponse<{ metrics?: Record<string, unknown> }>>(
      `/projects/${projectId}/stats`,
    ).catch(() => ({ data: undefined })),
    apiRequest<ApiListResponse<ApiTask>>(`/projects/${projectId}/tasks`, {
      params: { limit: 100, me: true, page: 1 },
    }).catch(() => ({ data: [] })),
    apiRequest<ApiListResponse<ApiFolder>>(`/projects/${projectId}/folders`, {
      params: { limit: 100, page: 1 },
    }).catch(() => ({ data: [] })),
  ]);

  const project = projectResponse.data;
  if (!project) throw new Error('Project not found');

  return {
    applications: applicationsResponse.data ?? [],
    board: boardResponse.data ?? null,
    folders: foldersResponse.data ?? [],
    project: mapProject(project, {
      applications: applicationsResponse.data ?? [],
      board: boardResponse.data ?? null,
      folders: foldersResponse.data ?? [],
      stats: statsResponse.data?.metrics ?? null,
      tasks: tasksResponse.data ?? [],
    }),
    stats: statsResponse.data?.metrics ?? null,
    tasks: tasksResponse.data ?? [],
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
