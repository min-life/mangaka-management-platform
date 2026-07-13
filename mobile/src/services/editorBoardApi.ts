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
import { fetchMe } from './userApi';
import type { EditorBoardRole } from '@/src/types/editorBoards';

type PermissionsResponse = ApiDataResponse<string[]> | string[];

function permissionList(response: PermissionsResponse | null) {
  if (!response) return [];
  return Array.isArray(response) ? response : response.data ?? [];
}

function roleFromPermissions(permissions: string[]): EditorBoardRole {
  if (permissions.includes('board:owner')) return 'Owner';
  if (permissions.includes('board:leader')) return 'Lead';
  return 'Member';
}

function boardCreatorId(board: ApiEditorBoard) {
  return board.createdBy ?? board.createdByUser?.id ?? board.createByUser?.id;
}

async function resolveEditorBoardRole(
  board: ApiEditorBoard,
  currentUserId: number,
): Promise<EditorBoardRole> {
  if (boardCreatorId(board) === currentUserId) {
    return 'Owner';
  }

  const permissionsResponse = await apiRequest<PermissionsResponse>(
    `/permissions/me/boards/${board.id}`,
  ).catch(() => null);

  return roleFromPermissions(permissionList(permissionsResponse));
}

export async function fetchEditorBoards(params: { name?: string } = {}) {
  const [response, currentUser] = await Promise.all([
    apiRequest<ApiListResponse<ApiEditorBoard>>('/editor-boards', {
      params: {
        limit: 50,
        me: false,
        name: params.name,
        page: 1,
      },
    }),
    fetchMe(),
  ]);
  const rawBoards = response.data ?? [];
  const boards = await Promise.all(
    rawBoards.map(async (board) =>
      mapEditorBoard(board, {
        currentUserRole: await resolveEditorBoardRole(board, currentUser.id),
      }),
    ),
  );

  return {
    boards: uniqueById(boards),
    pagination: response.pagination,
    rawBoards,
  };
}

type BoardMemberResponseItem = ApiUserSummary & {
  createdAt?: string;
  isLead?: boolean;
  joinedAt?: string;
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
    joinedAt: item.joinedAt ?? item.createdAt,
    user: item,
  };
}

function unwrapBoardProject(item: BoardProjectResponseItem | null) {
  if (!item) return undefined;
  return 'project' in item ? (item.project ?? undefined) : item;
}

function unwrapBoardApplication(item: BoardApplicationResponseItem | null) {
  if (!item) return undefined;
  return 'application' in item ? (item.application ?? undefined) : item;
}

type MappedBoardMember = NonNullable<ReturnType<typeof mapBoardMemberResponse>>;

export async function fetchEditorBoardBundle(boardId: string) {
  const [boardResponse, membersResponse, projectsResponse, applicationsResponse, currentUser] =
    await Promise.all([
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
      fetchMe(),
    ]);

  if (!boardResponse.data) throw new Error('Editor board not found');
  const currentUserRole = await resolveEditorBoardRole(boardResponse.data, currentUser.id);

  return {
    board: mapEditorBoard(boardResponse.data, { currentUserRole }),
    applications: uniqueById(
      (applicationsResponse.data ?? [])
        .map(unwrapBoardApplication)
        .filter((application): application is ApiApplication => Boolean(application))
        .map(mapApplication),
    ),
    members: uniqueById(
      (membersResponse.data ?? [])
        .map(mapBoardMemberResponse)
        .filter((member): member is MappedBoardMember => Boolean(member))
        .map(mapBoardMember),
    ),
    projects: uniqueById(
      (projectsResponse.data ?? [])
        .map(unwrapBoardProject)
        .filter((project): project is ApiProject => Boolean(project))
        .map((project) => mapProject(project)),
    ),
  };
}

export async function leaveEditorBoard(boardId: string) {
  return apiRequest<void>(`/editor-boards/${boardId}/members/me`, {
    method: 'DELETE',
  });
}

export async function deleteEditorBoard(boardId: string) {
  return apiRequest<void>(`/editor-boards/${boardId}`, {
    method: 'DELETE',
  });
}

export async function removeEditorBoardMember(boardId: string, userId: string) {
  return apiRequest<void>(`/editor-boards/${boardId}/members/${userId}`, {
    method: 'DELETE',
  });
}

export async function setEditorBoardMemberLead(boardId: string, userId: string) {
  const response = await apiRequest<ApiDataResponse<BoardMemberResponseItem>>(
    `/editor-boards/${boardId}/members/${userId}/lead`,
    { method: 'PATCH' },
  );

  return response.data ? mapBoardMember(mapBoardMemberResponse(response.data)!) : undefined;
}
