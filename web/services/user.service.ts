import api from '@/lib/api';

export type UserResponse = {
  avatarUrl: string | null;
  createdAt?: string;
  displayName: string | null;
  email: string;
  id: number;
  updatedAt?: string;
};

type UsersResponse = {
  data?: UserResponse[];
};

export async function getUsers() {
  const response = await api.get<UsersResponse, UsersResponse>('/users');

  return response.data ?? [];
}
