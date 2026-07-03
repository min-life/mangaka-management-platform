import {
  ApiApplication,
  ApiDataResponse,
  ApiEditorBoard,
  ApiListResponse,
  ApiProject,
  ApiUserSummary,
} from './apiTypes';
import { apiRequest } from './apiClient';
import { mapApplication, mapBoardMember, mapEditorBoard, mapProject, uniqueById } from './mappers';

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
    boards: uniqueById((response.data ?? []).map(mapEditorBoard)),
    pagination: response.pagination,
    rawBoards: response.data ?? [],
  };
}

type BoardMemberResponseItem = ApiUserSummary & {
  isLead?: boolean;
};

type BoardProjectResponseItem = ApiProject | { project?: ApiProject | null };
type BoardApplicationResponseItem = ApiApplication | { application?: ApiApplication | null };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isApiProject(value: unknown): value is ApiProject {
  return isRecord(value) && typeof value.id === 'number' && typeof value.name === 'string';
}

function isApiApplication(value: unknown): value is ApiApplication {
  return isRecord(value) && typeof value.id === 'number' && typeof value.title === 'string';
}

function mapBoardMemberResponse(item: BoardMemberResponseItem | null) {
  if (!item) return undefined;

  return {
    isLead: item.isLead,
    user: item,
  };
}

function unwrapBoardProject(item: BoardProjectResponseItem | null) {
  if (!item) return undefined;
  return 'project' in item ? item.project ?? undefined : item;
}

function unwrapBoardApplication(item: BoardApplicationResponseItem | null) {
  if (!item) return undefined;
  return 'application' in item ? item.application ?? undefined : item;
}

type MappedBoardMember = NonNullable<ReturnType<typeof mapBoardMemberResponse>>;

export async function fetchEditorBoardBundle(boardId: string) {
  const [boardResponse, membersResponse, projectsResponse, applicationsResponse] = await Promise.all([
    apiRequest<ApiDataResponse<ApiEditorBoard>>(`/editor-boards/${boardId}`),
    apiRequest<ApiListResponse<BoardMemberResponseItem | null>>(
      `/editor-boards/${boardId}/members`,
      { params: { limit: 100, page: 1 } },
    ).catch(() => ({ data: [] })),
    apiRequest<ApiListResponse<BoardProjectResponseItem | null>>(
      `/editor-boards/${boardId}/projects`,
      { params: { limit: 100, page: 1 } },
    ).catch(() => ({ data: [] })),
    apiRequest<ApiListResponse<BoardApplicationResponseItem | null>>(
      `/editor-boards/${boardId}/applications`,
      { params: { limit: 100, page: 1 } },
    ).catch(() => ({ data: [] })),
  ]);

  if (!boardResponse.data) throw new Error('Editor board not found');

  return {
    board: mapEditorBoard(boardResponse.data),
    applications: uniqueById((applicationsResponse.data ?? [])
      .map(unwrapBoardApplication)
      .filter((application): application is ApiApplication => Boolean(application))
      .map(mapApplication)),
    members: uniqueById((membersResponse.data ?? [])
      .map(mapBoardMemberResponse)
      .filter((member): member is MappedBoardMember => Boolean(member))
      .map(mapBoardMember)),
    projects: uniqueById((projectsResponse.data ?? [])
      .map(unwrapBoardProject)
      .filter((project): project is ApiProject => Boolean(project))
      .map((project) => mapProject(project))),
  };
}
