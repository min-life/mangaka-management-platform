import { ApiProjectStat, ApiProjectStatMonth } from './apiTypes';

export type ProjectStatsMetricKey = 'views' | 'sales' | 'revenue' | 'reviews' | 'rating';

export type ProjectStatsSummaryKey =
  | 'averageRating'
  | 'totalRevenue'
  | 'totalReviews'
  | 'totalSales'
  | 'totalViews';

export const PROJECT_STATS_KPIS: Array<{
  icon: string;
  key: ProjectStatsSummaryKey;
  label: string;
  meta: (stats: ApiProjectStat) => string;
}> = [
  { icon: 'visibility', key: 'totalViews', label: 'Total Views', meta: (stats) => String(stats.year) },
  { icon: 'trending_up', key: 'totalSales', label: 'Total Sales', meta: (stats) => String(stats.year) },
  { icon: 'attach_money', key: 'totalRevenue', label: 'Total Revenue', meta: (stats) => String(stats.year) },
  { icon: 'forum', key: 'totalReviews', label: 'Total Reviews', meta: (stats) => String(stats.year) },
  { icon: 'star', key: 'averageRating', label: 'Average Rating', meta: () => 'Out of 5' },
];

export const PROJECT_STATS_CHARTS: Array<{
  color: string;
  icon: string;
  key: ProjectStatsMetricKey;
  title: string;
}> = [
  { color: '#60A5FA', icon: 'visibility', key: 'views', title: 'Views Over Time' },
  { color: '#FFD369', icon: 'trending_up', key: 'sales', title: 'Sales Over Time' },
  { color: '#34D399', icon: 'attach_money', key: 'revenue', title: 'Revenue Over Time' },
  { color: '#F472B6', icon: 'forum', key: 'reviews', title: 'Reviews Over Time' },
];

export function getProjectStatsYears(stats?: ApiProjectStat | null) {
  if (!stats) return [new Date().getFullYear()];

  const minYear = Math.min(stats.minYear, stats.maxYear);
  const maxYear = Math.max(stats.minYear, stats.maxYear);
  return Array.from({ length: maxYear - minYear + 1 }, (_, index) => maxYear - index);
}

export function isProjectStatsEmpty(stats?: ApiProjectStat | null) {
  if (!stats) return true;
  return (
    stats.summary.totalViews === 0 &&
    stats.summary.totalSales === 0 &&
    stats.summary.totalRevenue === 0 &&
    stats.summary.totalReviews === 0
  );
}

export function formatProjectStatValue(
  key: ProjectStatsMetricKey | ProjectStatsSummaryKey,
  value: number,
) {
  if (key === 'averageRating' || key === 'rating') return value.toFixed(1);
  if (key === 'totalRevenue' || key === 'revenue') {
    return Math.round(value).toLocaleString();
  }
  return Math.round(value).toLocaleString();
}

export function getProjectStatMonthValue(month: ApiProjectStatMonth, key: ProjectStatsMetricKey) {
  return typeof month[key] === 'number' && Number.isFinite(month[key]) ? month[key] : null;
}
