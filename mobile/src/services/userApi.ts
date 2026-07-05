import { ApiCurrentUser, ApiDataResponse } from './apiTypes';
import { apiRequest } from './apiClient';
import { saveAccessToken } from './tokenStorage';

interface UpdatePasswordResponse {
  accessToken?: string;
}

export async function fetchMe() {
  const response = await apiRequest<ApiDataResponse<ApiCurrentUser> | ApiCurrentUser>('/users/me');
  return 'data' in response && response.data ? response.data : (response as ApiCurrentUser);
}

export async function updateMe(params: { avatarUrl?: string; displayName?: string }) {
  const response = await apiRequest<ApiDataResponse<ApiCurrentUser> | ApiCurrentUser>('/users/me', {
    body: params,
    method: 'PATCH',
  });

  return 'data' in response && response.data ? response.data : (response as ApiCurrentUser);
}

export async function updatePassword(params: { currentPassword: string; newPassword: string }) {
  const response = await apiRequest<ApiDataResponse<UpdatePasswordResponse>>('/users/me/password', {
    body: params,
    method: 'PATCH',
  });

  const accessToken = response.data?.accessToken;
  if (!accessToken) throw new Error('Unable to update the login session.');

  await saveAccessToken(accessToken);
}

