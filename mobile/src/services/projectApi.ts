import {
  ApiApplication,
  ApiDataResponse,
  ApiEditorBoard,
  ApiFolder,
  ApiListResponse,
  ApiProject,
  ApiProjectMember,
  ApiProjectStat,
  ApiRoleSummary,
  ApiTask,
} from './apiTypes';
import { apiRequest } from './apiClient';
import { mapProject, mapProjectMember, uniqueById } from './mappers';
import { fetchProjectResourceStats } from './resourceApi';
import { fetchProjectFileTasks } from './taskApi';

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

export async function fetchProjectById(projectId: string) {
  const response = await apiRequest<ApiDataResponse<ApiProject>>(`/projects/${projectId}`);

  if (!response.data) {
    throw new Error('Project not found');
  }

  return mapProject(response.data);
}

export async function updateProject(projectId: string, data: { imageUrl?: string; name?: string }) {
  const response = await apiRequest<ApiDataResponse<ApiProject>>(`/projects/${projectId}`, {
    body: data,
    method: 'PATCH',
  });

  if (!response.data) {
    throw new Error('Project update response is missing.');
  }

  return response.data;
}

export async function deleteProject(projectId: string) {
  return apiRequest<void>(`/projects/${projectId}`, {
    method: 'DELETE',
  });
}

export async function leaveProject(projectId: string) {
  return apiRequest<void>(`/projects/${projectId}/members/me`, {
    method: 'DELETE',
  });
}

export async function fetchProjectStats(
  projectId: string,
  query: { arcId?: number; chapterId?: number; year?: number } = {},
) {
  const response = await apiRequest<ApiDataResponse<ApiProjectStat | null>>(
    `/projects/${projectId}/stats`,
    {
      params: query,
    },
  );

  return response.data ?? null;
}

export async function fetchFolderChildren(folderId: string) {
  const response = await apiRequest<ApiListResponse<ApiFolder>>(`/folders/${folderId}/children`, {
    params: {
      field: 'createdAt',
      limit: 100,
      order: 'desc',
      page: 1,
    },
  });

  return {
    folders: response.data ?? [],
    pagination: response.pagination,
  };
}

export async function fetchProjectFolders(
  projectId: string,
  options: { limit?: number; page?: number; parentId?: string; type?: 'ARC' | 'CHAPTER' } = {},
) {
  const response = await apiRequest<ApiListResponse<ApiFolder>>(`/projects/${projectId}/folders`, {
    params: {
      field: 'createdAt',
      limit: options.limit ?? 100,
      order: 'desc',
      page: options.page ?? 1,
      parentId: options.parentId,
      type: options.type,
    },
  });

  return {
    folders: response.data ?? [],
    pagination: response.pagination,
  };
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
    fetchProjectFileTasks(projectId).catch(() => ({
      pagination: undefined,
      rawTasks: [] as ApiTask[],
      tasks: [],
    })),
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
  const tasks = tasksResponse.rawTasks ?? [];

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

export async function addProjectMembers(projectId: string, userIds: number[], roleId: number) {
  return apiRequest<void>(`/projects/${projectId}/members`, {
    body: { userIds, roleId },
    method: 'POST',
  });
}

export async function fetchProjectRoles(): Promise<ApiRoleSummary[]> {
  const response = await apiRequest<ApiListResponse<ApiRoleSummary>>('/roles', {
    params: {
      scope: 'PRJ',
    },
  });

  return (response.data ?? []).filter((role) => typeof role.id === 'number');
}

export async function removeProjectMember(projectId: string, userId: string) {
  return apiRequest<void>(`/projects/${projectId}/members/${userId}`, {
    method: 'DELETE',
  });
}

export async function updateProjectMemberRole(projectId: string, userId: string, roleId: number) {
  const response = await apiRequest<ApiDataResponse<ApiProjectMember>>(
    `/projects/${projectId}/members/${userId}`,
    {
      body: { roleId },
      method: 'PATCH',
    },
  );

  return response.data ? mapProjectMember(response.data) : null;
}

export async function fetchDefaultProjectRoleId(): Promise<number> {
  const projectRoles = await fetchProjectRoles();
  const defaultRole = projectRoles.find((role) => role.isDefault === true) ?? projectRoles[0];
  if (!defaultRole || defaultRole.id === undefined) {
    throw new Error('Default project role not found');
  }
  return defaultRole.id;
}
