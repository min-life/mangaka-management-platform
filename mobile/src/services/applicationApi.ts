import { ApiApplication, ApiComment, ApiDataResponse, ApiListResponse } from './apiTypes';
import { apiRequest } from './apiClient';
import { mapApplication, mapComment, uniqueById } from './mappers';

export async function fetchApplications(params: {
  projectId?: string;
  search?: string;
  status?: string;
  type?: string;
} = {}) {
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
  const response = await apiRequest<ApiDataResponse<ApiApplication>>(`/applications/${applicationId}`);
  if (!response.data) throw new Error('Application not found');
  return mapApplication(response.data);
}

export async function fetchApplicationComments(applicationId: string) {
  const response = await apiRequest<ApiListResponse<ApiComment>>(
    `/applications/${applicationId}/comments`,
    {
      params: { field: 'createdAt', limit: 100, order: 'desc', page: 1 },
    },
  );

  return uniqueById((response.data ?? []).map(mapComment));
}

export async function createApplicationComment(params: {
  applicationId: string;
  text: string;
}) {
  const text = params.text.trim();
  if (!text) throw new Error('Vui lòng nhập nội dung bình luận.');

  const response = await apiRequest<ApiDataResponse<ApiComment>>(
    `/applications/${params.applicationId}/comments`,
    {
      body: { content: { text } },
      method: 'POST',
    },
  );

  if (!response.data) throw new Error('Không thể tạo bình luận.');
  return mapComment(response.data);
}

