import api from '@/lib/api';

export type ApplicationStatus =
  | 'APPROVE'
  | 'CANCELLED'
  | 'INTERNAL_APPROVED'
  | 'PENDING'
  | 'REJECT'
  | 'SUBMITTED';
export type ApplicationType =
  | 'CREATE_ARC'
  | 'CREATE_CHAPTER'
  | 'MANUSCRIPT_REVIEW'
  | 'PUBLISH_REQUEST';
export type VoteDecision = 'ABSTAIN' | 'APPROVE' | 'REJECT';

export type UserSummary = {
  avatarUrl?: string | null;
  displayName?: string | null;
  email?: string;
  id: number;
};

export type ApplicationResponse = {
  createdAt: string;
  createdBy?: number | null;
  createdByUser?: UserSummary | null;
  description?: string | null;
  folderImageUrl?: string | null;
  id: number;
  materials: unknown;
  parentFolderId?: number | null;
  project?: {
    id: number;
    name: string;
    imageUrl?: string | null;
  } | null;
  projectId: number;
  status: ApplicationStatus;
  title: string;
  type: ApplicationType;
  updatedAt: string;
  updatedBy?: number | null;
  updatedByUser?: UserSummary | null;
  verifyBy?: number | null;
  verifiedByUser?: UserSummary | null;
};

type PaginationResponse = {
  limit: number;
  page: number;
  total: number;
  totalPages: number;
};

type ApplicationsResponse = {
  data?: ApplicationResponse[];
  pagination?: PaginationResponse;
};

type ApplicationItemResponse = {
  data?: ApplicationResponse;
};

export type ApplicationCommentResponse = {
  content: unknown;
  createdAt: string;
  id: number;
  updatedAt: string;
  user?: UserSummary | null;
  userId?: number;
};

type ApplicationCommentsResponse = {
  data?: ApplicationCommentResponse[];
  pagination?: PaginationResponse;
};

export type CreateApplicationPayload = {
  description?: string;
  folderImageUrl?: string;
  image?: File;
  materials: unknown;
  parentFolderId?: number;
  source?: File;
  text?: File;
  title: string;
  type: ApplicationType;
};

export type UpdateApplicationPayload = {
  description?: string;
  materials?: unknown;
  title?: string;
};

export type ApplicationVoteResponse = {
  applicationId: number;
  userId: number;
  decision: VoteDecision;
  comment?: string | null;
  createdAt: string;
  updatedAt: string;
  user: {
    id: number;
    displayName?: string | null;
    avatarUrl?: string | null;
    email?: string;
  };
};

export type VoteApplicationPayload = {
  decision: VoteDecision;
  comment?: string;
};

export async function getProjectApplications(projectId: number | string) {
  const response = await api.get<ApplicationsResponse, ApplicationsResponse>(
    `/projects/${projectId}/applications`,
    {
      params: {
        field: 'createdAt',
        order: 'desc',
      },
    },
  );

  return {
    applications: response.data ?? [],
    pagination: response.pagination,
  };
}

export async function getApplications(params?: {
  projectId?: number | string;
  search?: string;
  status?: ApplicationStatus;
  type?: ApplicationType;
  page?: number;
  limit?: number;
  field?: string;
  order?: 'asc' | 'desc';
}) {
  const response = await api.get<ApplicationsResponse, ApplicationsResponse>('/applications', {
    params: {
      field: 'createdAt',
      order: 'desc',
      ...params,
    },
  });

  return {
    applications: response.data ?? [],
    pagination: response.pagination,
  };
}

export async function createProjectApplication(
  projectId: number | string,
  payload: CreateApplicationPayload,
) {
  const hasFiles = Boolean(payload.image || payload.text || payload.source);
  let body: CreateApplicationPayload | FormData = payload;

  if (hasFiles) {
    body = new FormData();
    body.append('title', payload.title);
    body.append('type', payload.type);

    if (payload.description) {
      body.append('description', payload.description);
    }

    if (payload.folderImageUrl) {
      body.append('folderImageUrl', payload.folderImageUrl);
    }

    if (payload.parentFolderId) {
      body.append('parentFolderId', String(payload.parentFolderId));
    }

    if (Array.isArray(payload.materials) && payload.materials.length > 0) {
      body.append('materials', JSON.stringify(payload.materials));
    }

    if (payload.image) {
      body.append('image', payload.image);
    }

    if (payload.text) {
      body.append('text', payload.text);
    }

    if (payload.source) {
      body.append('source', payload.source);
    }
  }

  const response = await api.post<ApplicationItemResponse, ApplicationItemResponse>(
    `/projects/${projectId}/applications`,
    body,
    body instanceof FormData
      ? {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      : undefined,
  );

  return response.data;
}

export async function getApplicationById(applicationId: number | string) {
  const response = await api.get<ApplicationItemResponse, ApplicationItemResponse>(
    `/applications/${applicationId}`,
  );

  return response.data;
}

export async function updateApplication(
  applicationId: number | string,
  payload: UpdateApplicationPayload,
) {
  const response = await api.patch<ApplicationItemResponse, ApplicationItemResponse>(
    `/applications/${applicationId}`,
    payload,
  );

  return response.data;
}

export async function deleteApplication(applicationId: number | string) {
  await api.delete(`/applications/${applicationId}`);
}

export async function updateApplicationStatus(
  applicationId: number | string,
  status: ApplicationStatus,
  voteDeadline?: string,
  comment?: string,
) {
  const response = await api.patch<ApplicationItemResponse, ApplicationItemResponse>(
    `/applications/${applicationId}/status`,
    { status, voteDeadline, comment },
  );

  return response.data;
}


export async function getApplicationVotes(applicationId: number | string) {
  const response = await api.get<{ data: ApplicationVoteResponse[] }, { data: ApplicationVoteResponse[] }>(
    `/applications/${applicationId}/votes`,
  );
  return response.data;
}

export async function voteApplication(
  applicationId: number | string,
  payload: VoteApplicationPayload,
) {
  const response = await api.post<{ data: ApplicationVoteResponse }, { data: ApplicationVoteResponse }>(
    `/applications/${applicationId}/votes`,
    payload,
  );

  return response.data;
}

export async function getApplicationComments(applicationId: number | string) {
  const response = await api.get<ApplicationCommentsResponse, ApplicationCommentsResponse>(
    `/applications/${applicationId}/comments`,
    {
      params: {
        field: 'createdAt',
        order: 'desc',
      },
    },
  );

  return {
    comments: response.data ?? [],
    pagination: response.pagination,
  };
}

export async function createApplicationComment(
  applicationId: number | string,
  content: unknown,
) {
  const response = await api.post<
    { data?: ApplicationCommentResponse },
    { data?: ApplicationCommentResponse }
  >(`/applications/${applicationId}/comments`, { content });

  return response.data;
}

export async function addApplicationMaterial(
  applicationId: number | string,
  materialItem: unknown,
) {
  const response = await api.post<ApplicationItemResponse, ApplicationItemResponse>(
    `/applications/${applicationId}/materials/add`,
    { materialItem },
  );

  return response.data;
}

export async function updateApplicationMaterial(
  applicationId: number | string,
  index: number,
  materialItem: unknown,
) {
  const response = await api.patch<ApplicationItemResponse, ApplicationItemResponse>(
    `/applications/${applicationId}/materials/${index}`,
    { materialItem },
  );

  return response.data;
}

export async function deleteApplicationMaterial(
  applicationId: number | string,
  index: number,
) {
  const response = await api.delete<ApplicationItemResponse, ApplicationItemResponse>(
    `/applications/${applicationId}/materials/${index}`,
  );

  return response.data;
}
