import api from '@/lib/api';

export type ApplicationStatus = 'APPROVE' | 'CANCELLED' | 'PENDING' | 'REJECT';
export type ApplicationType = 'MANUSCRIPT_REVIEW' | 'PUBLISH_REQUEST';

export type ApplicationResponse = {
  createdAt: string;
  createdBy?: number | null;
  createdByUser?: {
    avatarUrl?: string | null;
    displayName?: string | null;
    email?: string;
    id: number;
  } | null;
  description?: string | null;
  id: number;
  materials: unknown;
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
  updatedByUser?: {
    avatarUrl?: string | null;
    displayName?: string | null;
    email?: string;
    id: number;
  } | null;
  verifyBy?: number | null;
  verifiedByUser?: {
    avatarUrl?: string | null;
    displayName?: string | null;
    email?: string;
    id: number;
  } | null;
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

export type CreateApplicationPayload = {
  description?: string;
  materials: unknown;
  title: string;
  type: ApplicationType;
};

export type UpdateApplicationPayload = {
  description?: string;
  materials?: unknown;
  title?: string;
};

export type VoteDecision = 'APPROVE' | 'REJECT' | 'ABSTAIN';

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

export async function createProjectApplication(
  projectId: number | string,
  payload: CreateApplicationPayload,
) {
  const response = await api.post<ApplicationItemResponse, ApplicationItemResponse>(
    `/projects/${projectId}/applications`,
    payload,
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
) {
  const response = await api.patch<ApplicationItemResponse, ApplicationItemResponse>(
    `/applications/${applicationId}/status`,
    { status },
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
