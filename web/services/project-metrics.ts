export type ProjectStatus = 'HIATUS' | 'IN_PRODUCTION' | 'STORYBOARDING';

export type ProjectMetrics = {
  cycleTimeDays: number;
  progress: number;
  status: ProjectStatus;
  targetChapter: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function getNumberMetric(metrics: unknown, key: string, fallback: number) {
  if (!isRecord(metrics)) {
    return fallback;
  }

  const value = metrics[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function getStringMetric(metrics: unknown, key: string, fallback: string) {
  if (!isRecord(metrics)) {
    return fallback;
  }

  const value = metrics[key];
  return typeof value === 'string' && value.trim().length > 0 ? value : fallback;
}

function getProjectStatus(metrics: unknown): ProjectStatus {
  const status = getStringMetric(metrics, 'status', 'IN_PRODUCTION');

  if (status === 'HIATUS' || status === 'IN_PRODUCTION' || status === 'STORYBOARDING') {
    return status;
  }

  return 'IN_PRODUCTION';
}

export function normalizeProjectMetrics(metrics: unknown): ProjectMetrics {
  return {
    cycleTimeDays: getNumberMetric(metrics, 'cycleTimeDays', 0),
    progress: getNumberMetric(metrics, 'progress', 0),
    status: getProjectStatus(metrics),
    targetChapter: getStringMetric(metrics, 'targetChapter', 'Chapter --'),
  };
}
