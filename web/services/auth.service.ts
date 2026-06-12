import api from '@/lib/api';

export type RegisterPayload = {
  displayName: string;
  email: string;
  password: string;
};

export type UpdateDisplayNamePayload = {
  displayName: string;
};

export async function register(payload: RegisterPayload) {
  return await api.post('/auth/register', payload);
}

export async function updateDisplayName(payload: UpdateDisplayNamePayload) {
  return await api.patch('/users/me/display-name', payload);
}
