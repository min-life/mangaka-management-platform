import api from '@/lib/api';
import { getProjectApplications, type ApplicationResponse } from './application.service';
import type { ProjectResponse } from './project.service';

export type CreateEditorBoardPayload = {
  description?: string;
  imageUrl?: string;
  name: string;
};

export type UpdateEditorBoardPayload = {
  description?: string;
  imageUrl?: string;
  name?: string;
};

export type UserSummaryResponse = {
  avatarUrl?: string | null;
  createdAt?: string;
  displayName?: string | null;
  email?: string;
  id: number;
  updatedAt?: string;
};

export type BoardMemberResponse = UserSummaryResponse & {
  isLead: boolean;
};

type BoardMemberApiResponse =
  | BoardMemberResponse
  | {
      isLead: boolean;
      user: UserSummaryResponse;
    };

export type EditorBoardResponse = {
  createdAt: string;
  createdBy?: number | null;
  createdByUser?: UserSummaryResponse | null;
  description?: string | null;
  id: number;
  imageUrl?: string | null;
  name: string;
  updatedAt: string;
  updatedBy?: number | null;
  updatedByUser?: UserSummaryResponse | null;
  numberOfProjects?: number;
  _count?: {
    projects: number;
  };
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

type EditorBoardsResponse = {
  data?: EditorBoardResponse[];
  pagination?: PaginationResponse;
};

type BoardProjectsResponse = {
  data?: Array<ProjectResponse | { project: ProjectResponse }>;
  pagination?: PaginationResponse;
};

type BoardMembersResponse = {
  data?: BoardMemberApiResponse[];
  pagination?: PaginationResponse;
};

export type EditorBoardDashboardStats = {
  activeMembers: number;
  approvedThisMonth: number;
  pendingApprovals: number;
  totalProjects: number;
};

type DashboardMemberResponse =
  | BoardMemberResponse
  | {
      createdAt?: string;
      isLead: boolean;
      updatedAt?: string;
      user: UserSummaryResponse;
    };

type DashboardProjectResponse = ProjectResponse | { project: ProjectResponse };

type DashboardApplicationResponse<TApplication> = TApplication | { application: TApplication };

export type EditorBoardDashboardResponse<TApplication extends object = ApplicationResponse> = {
  applications: TApplication[];
  board: EditorBoardResponse;
  members: BoardMemberResponse[];
  projects: ProjectResponse[];
  stats: EditorBoardDashboardStats;
};

type EditorBoardDashboardApiResponse<TApplication> = {
  data?: {
    applications?: DashboardApplicationResponse<TApplication>[];
    board: EditorBoardResponse;
    members?: DashboardMemberResponse[];
    projects?: DashboardProjectResponse[];
    stats: EditorBoardDashboardStats;
  };
};

type EditorBoardDashboardApiData<TApplication> = NonNullable<
  EditorBoardDashboardApiResponse<TApplication>['data']
>;

export type AddBoardMembersPayload = {
  userIds: number[];
};

export type AddBoardProjectsPayload = {
  projectIds: number[];
};

function normalizeBoardMember(member: BoardMemberApiResponse): BoardMemberResponse {
  if ('user' in member) {
    return {
      ...member.user,
      isLead: member.isLead,
    };
  }

  return member;
}

function normalizeDashboardMember(member: DashboardMemberResponse): BoardMemberResponse {
  if ('user' in member) {
    return {
      ...member.user,
      isLead: member.isLead,
    };
  }

  return member;
}

export async function createEditorBoard(payload: CreateEditorBoardPayload) {
  const response = await api.post<
    ApiResponse<EditorBoardResponse>,
    ApiResponse<EditorBoardResponse>
  >('/editor-boards', payload);

  return response.data ?? (response as EditorBoardResponse);
}

export async function getEditorBoards(params?: {
  field?: 'name' | 'updatedAt' | 'createdAt';
  limit?: number;
  me?: boolean;
  name?: string;
  order?: 'asc' | 'desc';
  page?: number;
}) {
  const response = await api.get<EditorBoardsResponse, EditorBoardsResponse>('/editor-boards', {
    params,
  });

  return {
    boards: response.data ?? [],
    pagination: response.pagination,
  };
}

export async function getEditorBoardById(boardId: number) {
  const response = await api.get<
    ApiResponse<EditorBoardResponse>,
    ApiResponse<EditorBoardResponse>
  >(`/editor-boards/${boardId}`);

  return response.data ?? (response as EditorBoardResponse);
}

export async function getEditorBoardDashboard<TApplication extends object = ApplicationResponse>(
  boardId: number | string,
): Promise<EditorBoardDashboardResponse<TApplication>> {
  const response = await api.get<
    EditorBoardDashboardApiResponse<TApplication> | EditorBoardDashboardApiData<TApplication>,
    EditorBoardDashboardApiResponse<TApplication> | EditorBoardDashboardApiData<TApplication>
  >(`/editor-boards/${boardId}/dashboard`);
  const data = 'board' in response ? response : response.data;

  if (!data?.board) {
    throw new Error('Editor board dashboard response did not include board data.');
  }

  return {
    applications:
      data?.applications?.map((item) => ('application' in item ? item.application : item)) ?? [],
    board: data.board,
    members: data?.members?.map(normalizeDashboardMember) ?? [],
    projects: data?.projects?.map((item) => ('project' in item ? item.project : item)) ?? [],
    stats: data?.stats ?? {
      activeMembers: 0,
      approvedThisMonth: 0,
      pendingApprovals: 0,
      totalProjects: 0,
    },
  };
}

export async function updateEditorBoard(boardId: number, payload: UpdateEditorBoardPayload) {
  const response = await api.patch<
    ApiResponse<EditorBoardResponse>,
    ApiResponse<EditorBoardResponse>
  >(`/editor-boards/${boardId}`, payload);

  return response.data ?? (response as EditorBoardResponse);
}

export async function deleteEditorBoard(boardId: number) {
  await api.delete(`/editor-boards/${boardId}`);
}

export async function getEditorBoardProjects(
  boardId: number | string,
  params?: {
    field?: 'name' | 'createdAt';
    limit?: number;
    order?: 'asc' | 'desc';
    page?: number;
    search?: string;
  },
) {
  const response = await api.get<BoardProjectsResponse, BoardProjectsResponse>(
    `/editor-boards/${boardId}/projects`,
    { params },
  );

  return {
    pagination: response.pagination,
    projects: response.data?.map((item) => ('project' in item ? item.project : item)) ?? [],
  };
}

export async function getEditorBoardMembers(
  boardId: number | string,
  params?: {
    field?: 'displayName' | 'email';
    limit?: number;
    order?: 'asc' | 'desc';
    page?: number;
    search?: string;
  },
) {
  const response = await api.get<BoardMembersResponse, BoardMembersResponse>(
    `/editor-boards/${boardId}/members`,
    { params },
  );

  return {
    members: response.data?.map(normalizeBoardMember) ?? [],
    pagination: response.pagination,
  };
}

export async function addEditorBoardMembers(
  boardId: number | string,
  payload: AddBoardMembersPayload,
) {
  await api.post(`/editor-boards/${boardId}/members`, payload);
}

export async function removeEditorBoardMember(boardId: number | string, userId: number) {
  await api.delete(`/editor-boards/${boardId}/members/${userId}`);
}

export async function setEditorBoardMemberLead(boardId: number | string, userId: number) {
  const response = await api.patch<
    ApiResponse<BoardMemberApiResponse>,
    ApiResponse<BoardMemberApiResponse>
  >(`/editor-boards/${boardId}/members/${userId}/lead`);

  return normalizeBoardMember(response.data ?? (response as BoardMemberApiResponse));
}

export async function getEditorBoardMember(boardId: number | string, userId: number) {
  const response = await api.get<
    ApiResponse<BoardMemberApiResponse>,
    ApiResponse<BoardMemberApiResponse>
  >(`/editor-boards/${boardId}/members/${userId}`);

  return normalizeBoardMember(response.data ?? (response as BoardMemberApiResponse));
}

export async function leaveEditorBoard(boardId: number | string) {
  await api.delete(`/editor-boards/${boardId}/members/me`);
}

export async function addEditorBoardProjects(
  boardId: number | string,
  payload: AddBoardProjectsPayload,
) {
  const response = await api.post<ApiResponse<{ count: number }>, ApiResponse<{ count: number }>>(
    `/editor-boards/${boardId}/projects`,
    payload,
  );

  return response.data ?? (response as { count: number });
}

export async function getEditorBoardApplications<
  TApplication extends ApplicationResponse = ApplicationResponse,
>(
  boardId: number | string,
  params?: {
    field?: 'createdAt' | 'updatedAt' | 'title';
    limit?: number;
    order?: 'asc' | 'desc';
    page?: number;
    search?: string;
  },
) {
  const projectsResponse = await getEditorBoardProjects(boardId, { limit: 100 });
  const projects = projectsResponse.projects;

  const allApplications: TApplication[] = [];
  const visibleApplicationStatuses = new Set<string>([
    'APPROVE',
    'INTERNAL_APPROVED',
    'REJECT',
    'SUBMITTED',
  ]);

  await Promise.all(
    projects.map(async (project) => {
      const response = await getProjectApplications(project.id);
      const projectApps = (response.applications || []) as TApplication[];
      allApplications.push(...projectApps);
    }),
  );

  let filteredApplications = allApplications.filter((app) => {
    return (
      (app.type === 'CREATE_ARC' || app.type === 'CREATE_CHAPTER') &&
      visibleApplicationStatuses.has(app.status)
    );
  });

  if (params?.search) {
    const searchLower = params.search.toLowerCase();
    filteredApplications = filteredApplications.filter((app) =>
      app.title?.toLowerCase().includes(searchLower),
    );
  }

  const field = params?.field || 'createdAt';
  const order = params?.order || 'desc';

  const getSortableValue = (application: TApplication) => {
    if (field === 'createdAt' || field === 'updatedAt') {
      return new Date(application[field] || 0).getTime();
    }

    return application[field] ?? '';
  };

  filteredApplications.sort((a, b) => {
    const valA = getSortableValue(a);
    const valB = getSortableValue(b);

    if (valA < valB) return order === 'asc' ? -1 : 1;
    if (valA > valB) return order === 'asc' ? 1 : -1;
    return 0;
  });

  const page = params?.page || 1;
  const limit = params?.limit || 10;
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;

  const paginatedApplications = filteredApplications.slice(startIndex, endIndex);

  return {
    applications: paginatedApplications as TApplication[],
    pagination: {
      total: filteredApplications.length,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(filteredApplications.length / limit)),
    },
  };
}
