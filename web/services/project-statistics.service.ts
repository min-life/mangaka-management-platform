import { AxiosError } from 'axios';

import api from '@/lib/api';

export type StatisticsTotals = {
  averageRating: number;
  totalRatingsCount: number;
  totalSales: number;
  totalViews: number;
};

export type StatisticsSeriesPoint = {
  date: string;
  value: number;
};

export type ProjectStatistics = {
  salesOverTime: StatisticsSeriesPoint[];
  totals: StatisticsTotals;
  viewsOverTime: StatisticsSeriesPoint[];
};

export type ProjectStatisticsQuery = {
  month: number;
  year: number;
};

const EMPTY_STATISTICS: ProjectStatistics = {
  salesOverTime: [],
  totals: {
    averageRating: 0,
    totalRatingsCount: 0,
    totalSales: 0,
    totalViews: 0,
  },
  viewsOverTime: [],
};

export function isStatisticsEmpty(stats: ProjectStatistics): boolean {
  return (
    stats.totals.totalSales === 0 &&
    stats.totals.totalViews === 0 &&
    stats.totals.totalRatingsCount === 0
  );
}

export async function getProjectStatistics(
  projectId: number | string,
  query: ProjectStatisticsQuery,
): Promise<ProjectStatistics> {
  try {
    const response = await api.get<{ data?: ProjectStatistics }, { data?: ProjectStatistics }>(
      `/projects/${projectId}/statistics`,
      { params: query },
    );

    return response.data ?? EMPTY_STATISTICS;
  } catch (error) {
    if (error instanceof AxiosError && error.response?.status === 404) {
      // GET /projects/:id/statistics does not exist yet — see
      // web/docs/statistics-module-api-notes.md. Treat as "no data for this period."
      return EMPTY_STATISTICS;
    }

    throw error;
  }
}
