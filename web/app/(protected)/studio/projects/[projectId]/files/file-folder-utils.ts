import type { ProjectFolderResponse } from '@/services/project.service';

const FOLDER_COVERS_STORAGE_KEY = 'inkly-folder-cover-overrides';

const arcCovers = [
  'https://images.unsplash.com/photo-1519608487953-e999c86e7455?q=80&w=1200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1518709268805-4e9042af2176?q=80&w=1200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1200&auto=format&fit=crop',
];

const chapterCovers = [
  'https://images.unsplash.com/photo-1518709268805-4e9042af2176?q=80&w=1000&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1519608487953-e999c86e7455?q=80&w=1000&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1000&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1516541196182-6bdb0516ed27?q=80&w=1000&auto=format&fit=crop',
];

const assetCovers = [
  'https://images.unsplash.com/photo-1516541196182-6bdb0516ed27?q=80&w=1000&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1000&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1518709268805-4e9042af2176?q=80&w=1000&auto=format&fit=crop',
];

export function getArcCover(index: number) {
  return arcCovers[index % arcCovers.length];
}

export function getChapterCover(id: number) {
  return chapterCovers[Math.abs(id) % chapterCovers.length];
}

export function getAssetCover(index: number) {
  return assetCovers[index % assetCovers.length];
}

export function getFolderCover(
  folder: ProjectFolderResponse,
  folderCovers: Record<number, string>,
  fallbackCover: string,
) {
  return folderCovers[folder.id] || fallbackCover;
}

export function normalizeArcTitle(title: string) {
  return title.toLowerCase().includes('arc') ? title : title;
}

export function normalizeChapterTitle(title: string) {
  return title.toLowerCase().includes('chapter') ? title : title;
}

export function getArcSubtitle(title: string, index: number) {
  const subtitles = ['The Beginning', 'Rising Conflict', 'Final Gate'];
  return title.includes(':') ? title.split(':').slice(1).join(':').trim() : subtitles[index % subtitles.length];
}

export function getChapterSubtitle(title: string, id: number) {
  const subtitles = ['The First Battle', 'Crossroad', 'Neon Shadows', 'Quiet Resolve'];
  return title.includes(':') ? title.split(':').slice(1).join(':').trim() : subtitles[Math.abs(id) % subtitles.length];
}

export function getArcProgress(index: number) {
  return [72, 46, 28][index % 3];
}

export function getChapterProgress(id: number) {
  return [40, 65, 82, 25][Math.abs(id) % 4];
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
