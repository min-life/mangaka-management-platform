import { ApiFolder } from './apiTypes';

export type ProjectStatRow = {
  Month: number;
  Year: number;
  [key: string]: number;
};

export type ProjectStatsAggregate = {
  months: ProjectStatRow[];
  summary: Record<string, number>;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isAverageMetric(key: string) {
  const normalized = key.toLowerCase();
  return normalized.includes('average') || normalized.includes('rating');
}

function normalizeRow(row: unknown): ProjectStatRow | null {
  if (!isRecord(row)) return null;
  const month = typeof row.Month === 'number' ? row.Month : undefined;
  const year = typeof row.Year === 'number' ? row.Year : undefined;
  if (!month || !year) return null;

  const nextRow: ProjectStatRow = { Month: month, Year: year };
  for (const [key, value] of Object.entries(row)) {
    if (key === 'Month' || key === 'Year') continue;
    if (typeof value === 'number' && Number.isFinite(value)) {
      nextRow[key] = value;
    }
  }

  return nextRow;
}

function getChapterStats(metrics: unknown) {
  if (!isRecord(metrics) || !isRecord(metrics.chapters)) {
    return {};
  }

  const chapters: Record<string, ProjectStatRow[]> = {};
  for (const [chapterId, rows] of Object.entries(metrics.chapters)) {
    if (!Array.isArray(rows)) continue;
    chapters[chapterId] = rows.map(normalizeRow).filter((row): row is ProjectStatRow => !!row);
  }

  return chapters;
}

export function getProjectStatsYears(metrics: unknown) {
  const years = new Set<number>();
  const chapters = getChapterStats(metrics);

  for (const rows of Object.values(chapters)) {
    for (const row of rows) {
      years.add(row.Year);
    }
  }

  if (years.size === 0) {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 5 }, (_, index) => currentYear - index);
  }

  return Array.from(years).sort((a, b) => b - a);
}

export function aggregateProjectStats(
  metrics: unknown,
  filters: { arcId?: string; chapterId?: string; year?: number },
  folders: ApiFolder[],
): ProjectStatsAggregate {
  const chapters = getChapterStats(metrics);
  const targetYear = filters.year ?? getProjectStatsYears(metrics)[0] ?? new Date().getFullYear();
  let targetChapterIds: string[];

  if (filters.chapterId) {
    targetChapterIds = [filters.chapterId];
  } else if (filters.arcId) {
    targetChapterIds = folders
      .filter((folder) => folder.type === 'CHAPTER' && String(folder.parentId) === filters.arcId)
      .map((folder) => String(folder.id));
  } else {
    targetChapterIds = Object.keys(chapters);
  }

  const monthlyAggregations: Record<number, Record<string, number>> = {};
  const monthlyCounts: Record<number, Record<string, number>> = {};

  for (const chapterId of targetChapterIds) {
    const rows = chapters[chapterId] ?? [];
    for (const row of rows) {
      if (row.Year !== targetYear) continue;
      if (!monthlyAggregations[row.Month]) {
        monthlyAggregations[row.Month] = {};
        monthlyCounts[row.Month] = {};
      }

      for (const [key, value] of Object.entries(row)) {
        if (key === 'Month' || key === 'Year') continue;
        monthlyAggregations[row.Month][key] = (monthlyAggregations[row.Month][key] ?? 0) + value;
        monthlyCounts[row.Month][key] = (monthlyCounts[row.Month][key] ?? 0) + 1;
      }
    }
  }

  for (const [month, values] of Object.entries(monthlyAggregations)) {
    const numericMonth = Number(month);
    for (const key of Object.keys(values)) {
      if (isAverageMetric(key) && monthlyCounts[numericMonth]?.[key]) {
        values[key] = values[key] / monthlyCounts[numericMonth][key];
      }
    }
  }

  const months = Array.from({ length: 12 }, (_, index) => {
    const month = index + 1;
    return {
      Month: month,
      Year: targetYear,
      ...(monthlyAggregations[month] ?? {}),
    };
  });

  const summary: Record<string, number> = {};
  const summaryCounts: Record<string, number> = {};

  for (const row of months) {
    for (const [key, value] of Object.entries(row)) {
      if (key === 'Month' || key === 'Year') continue;
      summary[key] = (summary[key] ?? 0) + value;
      summaryCounts[key] = (summaryCounts[key] ?? 0) + 1;
    }
  }

  for (const key of Object.keys(summary)) {
    if (isAverageMetric(key) && summaryCounts[key] > 0) {
      summary[key] = summary[key] / summaryCounts[key];
    }
  }

  return { months, summary };
}

export function formatProjectStatValue(key: string, value: number) {
  if (isAverageMetric(key)) return value.toFixed(1);
  return Math.round(value).toLocaleString();
}
