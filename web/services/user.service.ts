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

export async function getUsers(params?: {
  field?: 'createdAt' | 'displayName' | 'email';
  isActive?: boolean;
  limit?: number;
  order?: 'asc' | 'desc';
  page?: number;
  search?: string;
}) {
  const response = await api.get<UsersResponse, UsersResponse>('/users', { params });

  return response.data ?? [];
}
