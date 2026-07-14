import api from '@/lib/api';

export type ApplicationCommentResponse = {
  applicationId: number;
  content:
    | {
        text?: string;
      }
    | string;
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

type CommentsPagination = {
  limit: number;
  page: number;
  total: number;
  totalPages: number;
};

type CommentsResponse = {
  data?:
    | ApplicationCommentResponse[]
    | {
        data?: ApplicationCommentResponse[];
        pagination?: CommentsPagination;
      };
  pagination?: CommentsPagination;
};

type CommentItemResponse = {
  data?: ApplicationCommentResponse;
};

export async function getApplicationComments(
  applicationId: number | string,
  params?: {
    limit?: number;
    page?: number;
  },
) {
  const response = await api.get<CommentsResponse, CommentsResponse>(
    `/applications/${applicationId}/comments`,
    {
      params: {
        field: 'createdAt',
        limit: params?.limit ?? 10,
        order: 'desc',
        page: params?.page ?? 1,
      },
    },
  );
  const responseData = response.data;
  const nestedData =
    responseData && !Array.isArray(responseData) && 'data' in responseData
      ? responseData.data
      : undefined;
  const comments = Array.isArray(response)
    ? response
    : Array.isArray(responseData)
      ? responseData
      : Array.isArray(nestedData)
        ? nestedData
        : [];

  return {
    comments,
    pagination:
      response.pagination ?? (!Array.isArray(responseData) ? responseData?.pagination : undefined),
  };
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
