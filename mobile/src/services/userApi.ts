import { ApiDataResponse, ApiUserSummary } from './apiTypes';
import { apiRequest } from './apiClient';

export async function fetchMe() {
  const response = await apiRequest<ApiDataResponse<ApiUserSummary> | ApiUserSummary>('/users/me');
  return 'data' in response && response.data ? response.data : (response as ApiUserSummary);
}

