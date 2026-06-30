import api from '@/lib/api';
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
  displayName?: string | null;
  email?: string;
  id: number;
};

export type BoardMemberResponse = UserSummaryResponse & {
  isLead: boolean;
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
  data?: ProjectResponse[];
  pagination?: PaginationResponse;
};

type BoardMembersResponse = {
  data?: BoardMemberResponse[];
  pagination?: PaginationResponse;
};

export type AddBoardMembersPayload = {
  userIds: number[];
};

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

export async function getEditorBoardProjects(boardId: number | string) {
  const response = await api.get<BoardProjectsResponse, BoardProjectsResponse>(
    `/editor-boards/${boardId}/projects`,
  );

  return {
    pagination: response.pagination,
    projects: response.data ?? [],
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
    members: response.data ?? [],
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
  const response = await api.patch<ApiResponse<BoardMemberResponse>, ApiResponse<BoardMemberResponse>>(
    `/editor-boards/${boardId}/members/${userId}/lead`,
  );

  return response.data ?? (response as BoardMemberResponse);
}
