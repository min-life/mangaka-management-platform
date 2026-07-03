import { apiRequest } from './apiClient';
import { saveAccessToken } from './tokenStorage';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
}

export interface RefreshAccessTokenResponse {
  accessToken: string;
}

export interface ForgotPasswordResponse {
  data?: {
    success?: boolean;
  };
}

export async function login(payload: LoginPayload): Promise<LoginResponse> {
  const body = await apiRequest<LoginResponse>('/auth/login', {
    body: payload,
    method: 'POST',
  });

  const accessToken = body.accessToken;
  if (!accessToken) {
    throw new Error('Phản hồi đăng nhập không hợp lệ.');
  }

  return { accessToken };
}

export async function forgotPassword(email: string): Promise<void> {
  await apiRequest<ForgotPasswordResponse>('/auth/forgot', {
    body: { email },
    method: 'POST',
  });
}

export async function refreshAccessToken(): Promise<string> {
  const body = await apiRequest<RefreshAccessTokenResponse>('/auth/refresh', {
    method: 'POST',
    skipAuthRefresh: true,
  });

  const accessToken = body.accessToken;
  if (typeof accessToken !== 'string' || !accessToken.trim()) {
    throw new Error('Phản hồi làm mới phiên đăng nhập không hợp lệ.');
  }

  await saveAccessToken(accessToken);
  return accessToken;
}

export async function logout(accessToken?: string | null): Promise<void> {
  await apiRequest<void>('/auth/logout', {
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
    method: 'POST',
  });
}
