import { ApiApplication, ApiDataResponse, ApiEditorBoard, ApiListResponse } from './apiTypes';
import { apiRequest } from './apiClient';
import { mapApplication, mapBoardMember, mapEditorBoard, mapProject } from './mappers';

export async function fetchEditorBoards(params: { name?: string } = {}) {
  const response = await apiRequest<ApiListResponse<ApiEditorBoard>>('/editor-boards', {
    params: {
      limit: 50,
      me: true,
      name: params.name,
      page: 1,
    },
  });

  return {
    boards: (response.data ?? []).map(mapEditorBoard),
    rawBoards: response.data ?? [],
  };
}

export async function fetchEditorBoardBundle(boardId: string) {
  const [boardResponse, membersResponse, projectsResponse, applicationsResponse] = await Promise.all([
    apiRequest<ApiDataResponse<ApiEditorBoard>>(`/editor-boards/${boardId}`),
    apiRequest<ApiListResponse<{ user?: { id: number; displayName?: string | null; email?: string; avatarUrl?: string | null }; isLead?: boolean }>>(
      `/editor-boards/${boardId}/members`,
      { params: { limit: 100, page: 1 } },
    ).catch(() => ({ data: [] })),
    apiRequest<ApiListResponse<{ project: Parameters<typeof mapProject>[0] }>>(
      `/editor-boards/${boardId}/projects`,
      { params: { limit: 100, page: 1 } },
    ).catch(() => ({ data: [] })),
    apiRequest<ApiListResponse<{ application: ApiApplication }>>(
      `/editor-boards/${boardId}/applications`,
      { params: { limit: 100, page: 1 } },
    ).catch(() => ({ data: [] })),
  ]);

  if (!boardResponse.data) throw new Error('Editor board not found');

  return {
    applications: (applicationsResponse.data ?? []).map((item) => mapApplication(item.application)),
    board: mapEditorBoard(boardResponse.data),
    members: (membersResponse.data ?? []).map(mapBoardMember),
    projects: (projectsResponse.data ?? []).map((item) => mapProject(item.project)),
  };
}

