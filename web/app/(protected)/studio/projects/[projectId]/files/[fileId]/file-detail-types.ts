import { formatFileDate, type FileVersionItem } from '../file-ui';

export type ResourceTab = 'overview' | 'discussion' | 'versions' | 'activity';
export type NormalizedPoint = { x: number; y: number };

export type FileDiscussionComment = {
  author: string;
  content: string;
  id: string;
  time: string;
};

export function getCommentText(content: unknown) {
  if (typeof content === 'string') return content;
  if (content && typeof content === 'object' && 'text' in content) {
    const text = (content as { text?: unknown }).text;
    return typeof text === 'string' ? text : JSON.stringify(text ?? '');
  }
  return content ? JSON.stringify(content) : '';
}

export type FileMaterialVersionRecord = {
  createdAt: string;
  createdByUser?: {
    displayName?: string | null;
    email?: string | null;
  } | null;
  id: number | string;
  materials: Array<{
    isThumbnail?: boolean;
    url?: string;
  }>;
  name?: string | null;
  taskId?: number | null;
};

export function buildStableMaterialVersions(rawVersions: FileMaterialVersionRecord[]) {
  const versionsByAge = [...rawVersions].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
  const newestId = versionsByAge.at(-1)?.id;

  return versionsByAge
    .map((versionRecord, index) => {
      const versionNumber = index + 1;
      const materials = versionRecord.materials || [];
      const thumbnailMaterial =
        materials.find((material) => material.isThumbnail) ||
        materials[0];

      return {
        author:
          versionRecord.createdByUser?.displayName ||
          versionRecord.createdByUser?.email ||
          'Unknown',
        createdAt: formatFileDate(versionRecord.createdAt),
        id: String(versionRecord.id),
        taskId: versionRecord.taskId != null ? Number(versionRecord.taskId) : null,
        isCurrent: versionRecord.id === newestId,
        materials: materials,
        note: versionRecord.name || `Version ${versionNumber}`,
        previewUrl: thumbnailMaterial?.url,
        version: versionNumber,
      } as FileVersionItem;
    })
    .reverse();
}
