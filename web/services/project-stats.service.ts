import api from '@/lib/api';

export type ProjectStatMonth = {
  month: number;
  rating: number;
  revenue: number;
  reviews: number;
  sales: number;
  views: number;
};

export type ProjectStatSummary = {
  averageRating: number;
  totalRevenue: number;
  totalReviews: number;
  totalSales: number;
  totalViews: number;
};

export type ProjectStatsResult = {
  maxYear: number;
  minYear: number;
  months: ProjectStatMonth[];
  summary: ProjectStatSummary;
  year: number;
};

export type ProjectStatsQuery = {
  arcId?: number;
  chapterId?: number;
  year?: number;
};

export type ImportProjectStatsPayload = {
  chapterId: number;
  file: File;
};

type ProjectStatsApiResponse = {
  data?: ProjectStatsResult;
};

export async function getProjectStats(projectId: number, query?: ProjectStatsQuery) {
  const response = await api.get<ProjectStatsApiResponse, ProjectStatsApiResponse>(
    `/projects/${projectId}/stats`,
    { params: query },
  );

  return response.data ?? null;
}

export async function importProjectStats(projectId: number, payload: ImportProjectStatsPayload) {
  const formData = new FormData();
  formData.append('file', payload.file);
  formData.append('chapterId', String(payload.chapterId));

  const response = await api.post<ProjectStatsApiResponse, ProjectStatsApiResponse>(
    `/projects/${projectId}/stats`,
    formData,
  );

  return response.data ?? null;
}
