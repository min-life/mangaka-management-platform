import api from '@/lib/api';

export type ApiUser = {
  id: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  roles?: { id: string; name: string }[];
};

type ApiResponse<T> = {
  message: string;
  data: T;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

export async function getUsers() {
  const response = await api.get<ApiResponse<ApiUser[]>>('/users');
  return (response as unknown as ApiResponse<ApiUser[]>).data;
}

export async function getUser(userId: string) {
  const response = await api.get<ApiResponse<ApiUser>>(`/users/${userId}`);
  return (response as unknown as ApiResponse<ApiUser>).data;
}

export async function createUser(payload: { email: string; displayName?: string }) {
  const response = await api.post<ApiResponse<ApiUser>>('/users', payload);
  return (response as unknown as ApiResponse<ApiUser>).data;
}
