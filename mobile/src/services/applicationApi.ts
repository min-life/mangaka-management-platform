import { ApiApplication, ApiDataResponse, ApiListResponse } from './apiTypes';
import { apiRequest } from './apiClient';
import { mapApplication, uniqueById } from './mappers';

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

