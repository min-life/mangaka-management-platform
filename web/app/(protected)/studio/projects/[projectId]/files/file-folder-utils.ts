import type { ProjectFolderResponse } from '@/services/project.service';

const FOLDER_COVERS_STORAGE_KEY = 'inkly-folder-cover-overrides';

export function getArcCover(index: number) {
  return '';
}

export function getChapterCover(id: number) {
  return '';
}

export function getAssetCover(index: number) {
  return '';
}

export function getFolderCover(
  folder: ProjectFolderResponse,
  folderCovers: Record<number, string>,
  fallbackCover: string,
) {
  return folder.imageUrl || folderCovers[folder.id] || fallbackCover || '';
}

export function normalizeArcTitle(title: string) {
  return title.toLowerCase().includes('arc') ? title : title;
}

export function normalizeChapterTitle(title: string) {
  return title.toLowerCase().includes('chapter') ? title : title;
}

export function getArcSubtitle(title: string, index: number) {
  return title.includes(':') ? title.split(':').slice(1).join(':').trim() : '';
}

export function getChapterSubtitle(title: string, id: number) {
  return title.includes(':') ? title.split(':').slice(1).join(':').trim() : '';
}

export function getArcProgress(index: number) {
  return 0;
}

export function getChapterProgress(id: number) {
  return 0;
}

export function getFolderBranchIds(folders: ProjectFolderResponse[], rootId: number) {
  const ids = new Set<number>([rootId]);
  let changed = true;

  while (changed) {
    changed = false;
    folders.forEach((folder) => {
      if (folder.parentId && ids.has(folder.parentId) && !ids.has(folder.id)) {
        ids.add(folder.id);
        changed = true;
      }
    });
  }

  return [...ids];
}

export function countArcFiles(
  arcId: number,
  folders: ProjectFolderResponse[],
  fileCounts: Record<number, number>,
) {
  const branchIds = getFolderBranchIds(folders, arcId);
  return branchIds.reduce((total, folderId) => total + (fileCounts[folderId] ?? 0), 0);
}

export function isProductionAssetRoot(title: string) {
  const normalizedTitle = title.toLowerCase();
  return ['asset', 'reference', 'material', 'character', 'background', 'logo'].some((keyword) =>
    normalizedTitle.includes(keyword),
  );
}

function getFolderCoversStorageKey(projectId: number) {
  return `${FOLDER_COVERS_STORAGE_KEY}:${projectId}`;
}

export function readStoredFolderCovers(projectId: number) {
  if (typeof window === 'undefined') {
    return {};
  }

  const storedCovers = window.sessionStorage.getItem(getFolderCoversStorageKey(projectId));
  if (!storedCovers) {
    return {};
  }

  try {
    return JSON.parse(storedCovers) as Record<number, string>;
  } catch {
    return {};
  }
}

export function writeStoredFolderCover(projectId: number, folderId: number, coverUrl: string) {
  if (typeof window === 'undefined') {
    return;
  }

  const currentCovers = readStoredFolderCovers(projectId);
  window.sessionStorage.setItem(
    getFolderCoversStorageKey(projectId),
    JSON.stringify({
      ...currentCovers,
      [folderId]: coverUrl,
    }),
  );
}
