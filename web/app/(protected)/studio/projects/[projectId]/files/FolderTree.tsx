'use client';

import { ChevronDown, ChevronRight, Folder, FolderOpen } from 'lucide-react';

import type { ProjectFolderResponse } from '@/services/project.service';

type FolderTreeProps = {
  fileCounts: Record<number, number>;
  folders: ProjectFolderResponse[];
  onSelectFolder: (folderId: number | null) => void;
  selectedFolderId: number | null;
};

export function FolderTree({
  fileCounts,
  folders,
  onSelectFolder,
  selectedFolderId,
}: FolderTreeProps) {
  const folderIds = new Set(folders.map((folder) => folder.id));
  const roots = folders.filter((folder) => !folder.parentId || !folderIds.has(folder.parentId));

  const renderFolder = (folder: ProjectFolderResponse, depth: number): React.ReactNode => {
    const children = folders.filter((candidate) => candidate.parentId === folder.id);
    const isSelected = selectedFolderId === folder.id;

    return (
      <div key={folder.id}>
        <button
          className={`flex h-9 w-full items-center gap-2 border-l-2 pr-3 text-left text-xs font-bold transition-colors ${
            isSelected
              ? 'border-l-[#FFD369] bg-[#303842] text-white'
              : 'border-l-transparent text-[#dce7f3] hover:bg-[#17202b] hover:text-white'
          }`}
          onClick={() => onSelectFolder(folder.id)}
          style={{ paddingLeft: `${12 + depth * 16}px` }}
          type="button"
        >
          {children.length ? (
            isSelected ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />
          ) : (
            <span className="w-3.5" />
          )}
          {isSelected ? (
            <FolderOpen className="size-4 shrink-0 text-[#FFD369]" />
          ) : (
            <Folder className="size-4 shrink-0 text-[#aeb7c2]" />
          )}
          <span className="min-w-0 flex-1 truncate">{folder.title}</span>
          <span className="text-[10px] text-[#8b94a1]">{fileCounts[folder.id] ?? 0}</span>
        </button>
        {children.map((child) => renderFolder(child, depth + 1))}
      </div>
    );
  };

  return (
    <aside className="min-h-0 border-r border-[#26303b] bg-[#0d151e]">
      <div className="border-b border-[#26303b] px-4 py-4">
        <p className="text-[10px] font-black uppercase tracking-[0.08em] text-[#8b94a1]">
          Navigation
        </p>
      </div>
      <div className="overflow-y-auto py-2">
        <button
          className={`flex h-9 w-full items-center gap-2 border-l-2 px-3 text-left text-xs font-bold ${
            selectedFolderId === null
              ? 'border-l-[#FFD369] bg-[#303842] text-white'
              : 'border-l-transparent text-[#dce7f3] hover:bg-[#17202b]'
          }`}
          onClick={() => onSelectFolder(null)}
          type="button"
        >
          <FolderOpen className="size-4 text-[#FFD369]" />
          <span className="flex-1">All Files</span>
          <span className="text-[10px] text-[#8b94a1]">
            {Object.values(fileCounts).reduce((total, count) => total + count, 0)}
          </span>
        </button>
        {roots.map((folder) => renderFolder(folder, 0))}
      </div>
    </aside>
  );
}
