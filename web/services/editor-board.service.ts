import api from '@/lib/api';
import type { ApplicationResponse } from './application.service';
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

type BoardApplicationsResponse<TApplication> = {
  data?: Array<TApplication | { application: TApplication }>;
  pagination?: PaginationResponse;
};

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

export async function createEditorBoard(payload: CreateEditorBoardPayload) {
  const response = await api.post<
    ApiResponse<EditorBoardResponse>,
    ApiResponse<EditorBoardResponse>
  >('/editor-boards', payload);

  return response.data ?? (response as EditorBoardResponse);
}

export async function getEditorBoards() {
  const response = await api.get<EditorBoardsResponse, EditorBoardsResponse>('/editor-boards');

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
    projects:
      response.data?.map((item) => ('project' in item ? item.project : item)) ?? [],
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
  const response = await api.patch<ApiResponse<BoardMemberApiResponse>, ApiResponse<BoardMemberApiResponse>>(
    `/editor-boards/${boardId}/members/${userId}/lead`,
  );

  return normalizeBoardMember(response.data ?? (response as BoardMemberApiResponse));
}

export async function getEditorBoardMember(boardId: number | string, userId: number) {
  const response = await api.get<ApiResponse<BoardMemberApiResponse>, ApiResponse<BoardMemberApiResponse>>(
    `/editor-boards/${boardId}/members/${userId}`,
  );

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

export async function getEditorBoardApplications<TApplication extends object = ApplicationResponse>(
  boardId: number | string,
  params?: {
    field?: 'createdAt' | 'updatedAt' | 'title';
    limit?: number;
    order?: 'asc' | 'desc';
    page?: number;
    search?: string;
  },
) {
  const response = await api.get<
    BoardApplicationsResponse<TApplication>,
    BoardApplicationsResponse<TApplication>
  >(`/editor-boards/${boardId}/applications`, { params });

  return {
    applications:
      response.data?.map((item) => ('application' in item ? item.application : item)) ?? [],
    pagination: response.pagination,
  };
}

