import api from '@/lib/api';

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
