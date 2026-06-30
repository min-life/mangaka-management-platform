import { apiRequest } from './apiClient';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
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

export async function logout(accessToken?: string | null): Promise<void> {
  await apiRequest<void>('/auth/logout', {
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
    method: 'POST',
  });
}
