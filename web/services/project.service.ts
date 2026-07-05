import api from '@/lib/api';
import type { EditorBoardResponse, UserSummaryResponse } from './editor-board.service';

export type CreateProjectPayload = {
  description?: string;
  editorBoardId?: number;
  imageUrl?: string;
  name: string;
};

export type UpdateProjectPayload = {
  editorBoardId?: number | null;
  name?: string;
};

export type AddProjectMembersPayload = {
  roleId: number;
  userIds: number[];
};

export type UpdateProjectMemberPayload = {
  roleId: number;
};

export type CreateProjectFolderPayload = {
  description?: string;
  imageUrl?: string;
  parentId?: number;
  title: string;
};

export type CreateChildFolderPayload = {
  description?: string;
  title: string;
};

export type UpdateProjectFolderPayload = {
  description?: string;
  title?: string;
};

export type ProjectResponse = {
  createdAt: string;
  createdBy?: number | null;
  createdByUser?: UserSummaryResponse | null;
  description?: string | null;
  editorBoard?: EditorBoardResponse | null;
  editorBoardId?: number | null;
  id: number;
  imageUrl?: string | null;
  name: string;
  updatedAt: string;
  updatedBy?: number | null;
  updatedByUser?: UserSummaryResponse | null;
  userProjects?: ProjectMemberLinkResponse[];
};

export type ProjectMemberRoleResponse = {
  code: string;
  id: number;
  isDefault: boolean;
  name: string;
  scope: string;
};

export type ProjectMemberLinkResponse = {
  createdAt: string;
  role: ProjectMemberRoleResponse;
  updatedAt: string;
  user: UserSummaryResponse;
};

export type ProjectMemberResponse = {
  avatarUrl: string | null;
  createdAt: string;
  displayName: string | null;
  email: string;
  id: number;
  numberOfTasks?: number;
  role: ProjectMemberRoleResponse;
  taskOverview?: {
    done: number;
    inprogress: number;
    pending: number;
    review: number;
    total: number;
  } | null;
  updatedAt: string;
};

type ProjectMemberApiResponse =
  | ProjectMemberResponse
  | {
      createdAt: string;
      numberOfTasks?: number;
      role: ProjectMemberRoleResponse;
      taskOverview?: ProjectMemberResponse['taskOverview'];
      updatedAt: string;
      user: UserSummaryResponse;
    };

export type ProjectApplicationResponse = {
  createdAt: string;
  description?: string | null;
  id: number;
  materials?: unknown;
  project?: {
    id: number;
    imageUrl?: string | null;
    name: string;
  };
  status: 'APPROVE' | 'CANCELLED' | 'PENDING' | 'REJECT';
  title: string;
  type: 'MANUSCRIPT_REVIEW' | 'PUBLISH_REQUEST';
  updatedAt: string;
};

export type ProjectStatResponse = {
  id: number;
  metrics: unknown;
  project?: ProjectResponse;
  projectId?: number;
  updatedAt: string;
};

export type ProjectFolderResponse = {
  createdAt: string;
  createdBy?: number | null;
  createdByUser?: UserSummaryResponse | null;
  description: string | null;
  id: number;
  imageUrl?: string | null;
  parent?: {
    description?: string | null;
    id: number;
    imageUrl?: string | null;
    title: string;
  } | null;
  parentId?: number | null;
  projectId?: number;
  title: string;
  updatedAt: string;
  updatedBy?: number | null;
  updatedByUser?: UserSummaryResponse | null;
};

export type ProjectFileResponse = {
  createdAt: string;
  createdBy?: number | null;
  createdByUser?: UserSummaryResponse | null;
  description: string | null;
  folder?: {
    id: number;
    title: string;
  } | null;
  folderId?: number;
  id: number;
  title: string;
  updatedAt: string;
  updatedBy?: number | null;
  updatedByUser?: UserSummaryResponse | null;
};

type ApiResponse<T> = {
  data?: T;
};

type PaginationResponse = {
  limit: number;
  page: number;
  total: number;
  totalPages: number;
};

type ProjectsResponse = {
  data?: ProjectResponse[];
  pagination?: PaginationResponse;
};

type ProjectMembersResponse = {
  data?: ProjectMemberApiResponse[];
  pagination?: PaginationResponse;
};

type ProjectApplicationsResponse = {
  data?: ProjectApplicationResponse[];
  pagination?: PaginationResponse;
};

type ProjectStatApiResponse = {
  data?: ProjectStatResponse | null;
};

type ProjectFoldersResponse = {
  data?: ProjectFolderResponse[];
  pagination?: PaginationResponse;
};

type FolderFilesResponse = {
  data?: ProjectFileResponse[];
  pagination?: PaginationResponse;
};

function normalizeProjectMember(member: ProjectMemberApiResponse): ProjectMemberResponse {
  if ('user' in member) {
    return {
      avatarUrl: member.user.avatarUrl ?? null,
      createdAt: member.createdAt,
      displayName: member.user.displayName ?? null,
      email: member.user.email ?? '',
      id: member.user.id,
      numberOfTasks: member.numberOfTasks,
      role: member.role,
      taskOverview: member.taskOverview ?? null,
      updatedAt: member.updatedAt,
    };
  }

  return member;
}

export async function createProject(payload: CreateProjectPayload) {
  const response = await api.post<ApiResponse<ProjectResponse>, ApiResponse<ProjectResponse>>(
    '/projects',
    payload,
  );

  return response.data ?? (response as ProjectResponse);
}

export async function getProjects() {
  const response = await api.get<ProjectsResponse, ProjectsResponse>('/projects');

  return {
    pagination: response.pagination,
    projects: response.data ?? [],
  };
}

export async function getProjectById(projectId: number) {
  const response = await api.get<ApiResponse<ProjectResponse>, ApiResponse<ProjectResponse>>(
    `/projects/${projectId}`,
  );

  return response.data ?? (response as ProjectResponse);
}

export async function updateProject(projectId: number, payload: UpdateProjectPayload) {
  const response = await api.patch<ApiResponse<ProjectResponse>, ApiResponse<ProjectResponse>>(
    `/projects/${projectId}`,
    payload,
  );

  return response.data ?? (response as ProjectResponse);
}

export async function deleteProject(projectId: number) {
  await api.delete(`/projects/${projectId}`);
}

export async function addProjectMembers(projectId: number, payload: AddProjectMembersPayload) {
  await api.post(`/projects/${projectId}/members`, payload);
}

export async function getProjectMembers(
  projectId: number,
  params?: {
    field?: 'createdAt' | 'displayName' | 'email';
    limit?: number;
    order?: 'asc' | 'desc';
    page?: number;
    search?: string;
  },
) {
  const response = await api.get<ProjectMembersResponse, ProjectMembersResponse>(
    `/projects/${projectId}/members`,
    { params },
  );

  return {
    members: response.data?.map(normalizeProjectMember) ?? [],
    pagination: response.pagination,
  };
}

export async function getProjectMember(projectId: number, userId: number) {
  const response = await api.get<ApiResponse<ProjectMemberApiResponse>, ApiResponse<ProjectMemberApiResponse>>(
    `/projects/${projectId}/members/${userId}`,
  );

  return normalizeProjectMember(response.data ?? (response as ProjectMemberApiResponse));
}

export async function leaveProject(projectId: number) {
  await api.delete(`/projects/${projectId}/members/me`);
}

export async function getProjectApplications(
  projectId: number,
  params?: {
    field?: 'createdAt' | 'updatedAt' | 'title';
    limit?: number;
    order?: 'asc' | 'desc';
    page?: number;
    search?: string;
    status?: ProjectApplicationResponse['status'];
    type?: ProjectApplicationResponse['type'];
  },
) {
  const response = await api.get<ProjectApplicationsResponse, ProjectApplicationsResponse>(
    `/projects/${projectId}/applications`,
    { params },
  );

  return {
    applications: response.data ?? [],
    pagination: response.pagination,
  };
}

export async function getProjectStats(projectId: number) {
  const response = await api.get<ProjectStatApiResponse, ProjectStatApiResponse>(
    `/projects/${projectId}/stats`,
  );

  return response.data ?? null;
}

export async function updateProjectMember(
  projectId: number,
  userId: number,
  payload: UpdateProjectMemberPayload,
) {
  const response = await api.patch<
    ApiResponse<ProjectMemberApiResponse>,
    ApiResponse<ProjectMemberApiResponse>
  >(`/projects/${projectId}/members/${userId}`, payload);

  return normalizeProjectMember(response.data ?? (response as ProjectMemberApiResponse));
}

export async function removeProjectMember(projectId: number, userId: number) {
  await api.delete(`/projects/${projectId}/members/${userId}`);
}

export async function getProjectFolders(
  projectId: number | string,
  options?: {
    limit?: number;
    page?: number;
    parentId?: number;
    search?: string;
    type?: 'ARC' | 'CHAPTER';
  },
) {
  const response = await api.get<ProjectFoldersResponse, ProjectFoldersResponse>(
    `/projects/${projectId}/folders`,
    {
      params: {
        field: 'createdAt',
        limit: options?.limit ?? 100,
        order: 'desc',
        ...(options?.page ? { page: options.page } : {}),
        ...(options?.parentId ? { parentId: options.parentId } : {}),
        ...(options?.search ? { search: options.search } : {}),
        ...(options?.type ? { type: options.type } : {}),
      },
    },
  );

  return {
    folders: response.data ?? [],
    pagination: response.pagination,
  };
}

export async function getFolderFiles(folderId: number | string) {
  const response = await api.get<FolderFilesResponse, FolderFilesResponse>(
    `/folders/${folderId}/files`,
    {
      params: {
        field: 'createdAt',
        limit: 100,
        order: 'desc',
      },
    },
  );

  return {
    files: response.data ?? [],
    pagination: response.pagination,
  };
}

export async function createFolderFile(
  folderId: number | string,
  payload: {
    description?: string;
    title: string;
  },
) {
  const response = await api.post<ApiResponse<ProjectFileResponse>, ApiResponse<ProjectFileResponse>>(
    `/folders/${folderId}/files`,
    payload,
  );

  return response.data ?? (response as ProjectFileResponse);
}

export async function createProjectFolder(
  projectId: number | string,
  payload: CreateProjectFolderPayload,
) {
  const response = await api.post<
    ApiResponse<ProjectFolderResponse>,
    ApiResponse<ProjectFolderResponse>
  >(`/projects/${projectId}/folders`, payload);

  return response.data ?? (response as ProjectFolderResponse);
}

export async function getFolderById(folderId: number | string) {
  const response = await api.get<ApiResponse<ProjectFolderResponse>, ApiResponse<ProjectFolderResponse>>(
    `/folders/${folderId}`,
  );

  return response.data ?? (response as ProjectFolderResponse);
}

export async function getFolderChildren(folderId: number | string) {
  const response = await api.get<ProjectFoldersResponse, ProjectFoldersResponse>(
    `/folders/${folderId}/children`,
    {
      params: {
        field: 'createdAt',
        order: 'desc',
      },
    },
  );

  return {
    folders: response.data ?? [],
    pagination: response.pagination,
  };
}

export async function createChildFolder(
  folderId: number | string,
  payload: CreateChildFolderPayload,
) {
  const response = await api.post<
    ApiResponse<ProjectFolderResponse>,
    ApiResponse<ProjectFolderResponse>
  >(`/folders/${folderId}/children`, payload);

  return response.data ?? (response as ProjectFolderResponse);
}

export async function updateProjectFolder(
  folderId: number | string,
  payload: UpdateProjectFolderPayload,
) {
  const response = await api.patch<
    ApiResponse<ProjectFolderResponse>,
    ApiResponse<ProjectFolderResponse>
  >(`/folders/${folderId}`, payload);

  return response.data ?? (response as ProjectFolderResponse);
}

export async function deleteProjectFolder(folderId: number | string) {
  await api.delete(`/folders/${folderId}`);
}
