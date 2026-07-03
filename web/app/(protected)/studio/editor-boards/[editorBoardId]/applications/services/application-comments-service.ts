import api from '@/lib/api';

export type ApplicationCommentResponse = {
  applicationId: number;
  content: {
    text?: string;
  };
  createdAt: string;
  createdByUser?: {
    avatarUrl?: string | null;
    displayName?: string | null;
    email?: string;
    id: number;
  } | null;
  id: number;
  updatedAt: string;
};

type CommentsResponse = {
  data?: ApplicationCommentResponse[];
  pagination?: {
    limit: number;
    page: number;
    total: number;
    totalPages: number;
  };
};

type CommentItemResponse = {
  data?: ApplicationCommentResponse;
};

export async function getApplicationComments(applicationId: number | string) {
  const response = await api.get<CommentsResponse, CommentsResponse>(
    `/applications/${applicationId}/comments`,
    {
      params: {
        field: 'createdAt',
        limit: 50,
        order: 'asc',
        page: 1,
      },
    },
  );

  return response.data ?? [];
}

export async function createApplicationComment(applicationId: number | string, text: string) {
  const response = await api.post<CommentItemResponse, CommentItemResponse>(
    `/applications/${applicationId}/comments`,
    {
      content: {
        text,
      },
    },
  );

  return response.data;
}
