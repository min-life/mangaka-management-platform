import {
  ApiApplication,
  ApiApplicationVote,
  ApiComment,
  ApiDataResponse,
  ApiEditorBoard,
  ApiListResponse,
} from './apiTypes';
import { apiRequest } from './apiClient';
import { mapApplication, mapComment, uniqueById } from './mappers';

type PermissionsResponse = ApiDataResponse<string[]> | string[];

function permissionList(response: PermissionsResponse) {
  return Array.isArray(response) ? response : response.data ?? [];
}

export async function fetchApplications(
  params: {
    projectId?: string;
    search?: string;
    status?: string;
    type?: string;
  } = {},
) {
  const path = params.projectId ? `/projects/${params.projectId}/applications` : '/applications';
  const response = await apiRequest<ApiListResponse<ApiApplication>>(path, {
    params: {
      field: 'createdAt',
      limit: 100,
      order: 'desc',
      page: 1,
      search: params.search,
      status: params.status === 'ALL' ? undefined : params.status,
      type: params.type === 'ALL' ? undefined : params.type,
    },
  });

  return {
    applications: uniqueById((response.data ?? []).map(mapApplication)),
    pagination: response.pagination,
    rawApplications: response.data ?? [],
  };
}

export async function fetchApplication(applicationId: string) {
  const response = await apiRequest<ApiDataResponse<ApiApplication>>(
    `/applications/${applicationId}`,
  );
  if (!response.data) throw new Error('Application not found');
  return mapApplication(response.data);
}

export async function fetchLeadApplicationVoteCount(params: {
  applicationId: string;
  projectId: string;
}) {
  const boardResponse = await apiRequest<ApiDataResponse<ApiEditorBoard | null>>(
    `/projects/${params.projectId}/editor-boards`,
  ).catch(() => ({ data: null }));
  const boardId = boardResponse.data?.id;

  if (!boardId) {
    return { canViewVotes: false, voteCount: null };
  }

  const permissionsResponse = await apiRequest<PermissionsResponse>(
    `/permissions/me/boards/${boardId}`,
  ).catch(() => null);
  if (!permissionsResponse) {
    return { canViewVotes: false, voteCount: null };
  }

  const permissions = permissionList(permissionsResponse);
  const canViewVotes = permissions.includes('board:leader') || permissions.includes('board:owner');

  if (!canViewVotes) {
    return { canViewVotes: false, voteCount: null };
  }

  const votesResponse = await apiRequest<ApiListResponse<ApiApplicationVote>>(
    `/applications/${params.applicationId}/votes`,
  );

  return {
    canViewVotes: true,
    voteCount: votesResponse.data?.length ?? votesResponse.pagination?.total ?? 0,
  };
}

export async function fetchApplicationComments(applicationId: string) {
  const response = await apiRequest<ApiListResponse<ApiComment>>(
    `/applications/${applicationId}/comments`,
    {
      params: { field: 'createdAt', limit: 100, order: 'asc', page: 1 },
    },
  );

  return uniqueById((response.data ?? []).map(mapComment));
}

export async function createApplicationComment(params: { applicationId: string; text: string }) {
  const text = params.text.trim();
  if (!text) throw new Error('Please enter a comment.');

  const response = await apiRequest<ApiDataResponse<ApiComment>>(
    `/applications/${params.applicationId}/comments`,
    {
      body: { content: { text } },
      method: 'POST',
    },
  );

  if (!response.data) throw new Error('Unable to create the comment.');
  return mapComment(response.data);
}
