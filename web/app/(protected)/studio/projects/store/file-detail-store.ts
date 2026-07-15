import { create } from 'zustand';
import type { FileExplorerItem, FileTaskItem, FileVersionItem } from '../[projectId]/files/file-ui';

export type FileDetailCacheState = {
  file: FileExplorerItem | null;
  tasks: FileTaskItem[];
  latestMaterialVersion: FileVersionItem | null;
  
  isFetching: boolean;
  loaded: boolean;
};

export const EMPTY_FILE_CACHE_STATE: FileDetailCacheState = {
  file: null,
  tasks: [],
  latestMaterialVersion: null,
  isFetching: false,
  loaded: false,
};

type FileDetailStore = {
  files: Record<string, FileDetailCacheState>; // Keyed by fileId

  // Actions
  setFileData: (fileId: number | string, data: Partial<FileDetailCacheState>) => void;
  invalidateFile: (fileId: number | string) => void;
  clearAll: () => void;
};

export const useFileDetailStore = create<FileDetailStore>((set) => ({
  files: {},

  setFileData: (fileId, data) => set((state) => {
    const key = String(fileId);
    const existing = state.files[key] ?? EMPTY_FILE_CACHE_STATE;
    return {
      files: {
        ...state.files,
        [key]: { ...existing, ...data },
      },
    };
  }),

  invalidateFile: (fileId) => set((state) => {
    const key = String(fileId);
    if (!state.files[key]) return state;
    return {
      files: {
        ...state.files,
        [key]: { ...state.files[key], loaded: false },
      },
    };
  }),

  clearAll: () => set({ files: {} }),
}));

export function selectFileDetail(fileId: number | string) {
  return (state: FileDetailStore) => state.files[String(fileId)] ?? EMPTY_FILE_CACHE_STATE;
}
