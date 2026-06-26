import api from '@/lib/api';

export type RegisterPayload = {
  displayName: string;
  email: string;
  password: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type LoginResponse = {
  accessToken: string;
};

export type ForgotPasswordPayload = {
  email: string;
};

export type ResetPasswordPayload = {
  token: string;
  password: string;
};

export async function login(payload: LoginPayload) {
  return await api.post<LoginResponse, LoginResponse>('/auth/login', payload);
}

export async function register(payload: RegisterPayload) {
  return await api.post('/auth/register', payload);
}

export async function forgotPassword(payload: ForgotPasswordPayload) {
  return await api.post('/auth/forgot', payload);
}

export async function resetPassword(payload: ResetPasswordPayload) {
  return await api.post('/auth/reset', payload);
}

export async function verifyEmail(token: string) {
  return await api.post('/auth/verify-email', { token });
}
