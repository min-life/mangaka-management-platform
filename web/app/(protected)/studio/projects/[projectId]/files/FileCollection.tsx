'use client';

import { useState } from 'react';
import { Clock, FileText, Grid2X2, List, Search, Tag, Loader2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

import {
  fileStatusClassName,
  fileStatusLabels,
  formatFileDate,
  type FileExplorerItem,
} from './file-ui';

export type FileViewMode = 'grid' | 'table';

type FileCollectionProps = {
  files: FileExplorerItem[];
  onSearchChange: (value: string) => void;
  onSelectFile: (file: FileExplorerItem) => void;
  onViewModeChange: (mode: FileViewMode) => void;
  searchQuery: string;
  selectedFileId: number | null;
  viewMode: FileViewMode;
  hideSearch?: boolean;
  isLoading?: boolean;
};

export function FileCollection({
  files,
  onSearchChange,
  onSelectFile,
  onViewModeChange,
  searchQuery,
  selectedFileId,
  viewMode,
  hideSearch,
  isLoading,
}: FileCollectionProps) {
  return (
    <section className="min-w-0 bg-[#0d151e]">
      {/* Toolbar */}
      <div className={`flex h-12 items-center gap-3 border-b border-[#1e2936] px-4 ${hideSearch ? 'justify-end' : 'justify-between'}`}>
        {/* Search */}
        {!hideSearch && (
          <div className="flex h-8 min-w-0 max-w-sm flex-1 items-center gap-2 rounded-[5px] border border-[#2a3444] bg-[#111923] px-3 transition-colors focus-within:border-[#FFD369]/40 focus-within:bg-[#141e2a]">
            <Search className="size-3.5 shrink-0 text-[#5d6878]" />
            <input
              className="min-w-0 flex-1 bg-transparent text-xs font-medium text-white outline-none placeholder:text-[#5d6878]"
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Search files..."
              value={searchQuery}
            />
          </div>
        )}
        {/* File count */}
        <span className="shrink-0 text-[11px] font-bold text-[#5d6878]">
          {files.length} {files.length === 1 ? 'file' : 'files'}
        </span>
        {/* View toggle */}
        <div className="flex h-8 items-center rounded-[4px] border border-[#2a3444] bg-[#111923] p-0.5">
          <Button
            aria-label="List view"
            className={`size-7 rounded-[3px] transition-colors ${viewMode === 'table' ? 'bg-[#FFD369] text-[#101820] hover:bg-[#FFD369]' : 'text-[#5d6878] hover:text-white'}`}
            onClick={() => onViewModeChange('table')}
            size="icon"
            variant="ghost"
          >
            <List className="size-3.5" />
          </Button>
          <Button
            aria-label="Card view"
            className={`size-7 rounded-[3px] transition-colors ${viewMode === 'grid' ? 'bg-[#FFD369] text-[#101820] hover:bg-[#FFD369]' : 'text-[#5d6878] hover:text-white'}`}
            onClick={() => onViewModeChange('grid')}
            size="icon"
            variant="ghost"
          >
            <Grid2X2 className="size-3.5" />
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid min-h-[300px] place-items-center px-6">
          <Loader2 className="size-8 animate-spin text-[#FFD369]" />
        </div>
      ) : files.length ? (
        viewMode === 'table' ? (
          /* ── LIST VIEW ── */
          <div className="overflow-x-auto">
            {/* Column headers */}
            <div className="grid min-w-[500px] grid-cols-[minmax(280px,1fr)_110px] border-b border-[#1e2936] bg-[#0b1319] px-4 py-2.5 text-[10px] font-black uppercase tracking-[0.08em] text-[#5d6878]">
              <span>File</span>
              <span>Updated</span>
            </div>
            {files.map((file) => (
              <button
                className={`group grid min-h-[72px] w-full min-w-[500px] grid-cols-[minmax(280px,1fr)_110px] items-center border-b border-[#1a2333]/60 px-4 text-left transition-all duration-150 hover:bg-[#14202e] ${
                  selectedFileId === file.id ? 'bg-[#14202e] border-l-2 border-l-[#FFD369] pl-[14px]' : ''
                }`}
                key={file.id}
                onClick={() => onSelectFile(file)}
                type="button"
              >
                {/* File info */}
                <span className="flex min-w-0 items-center gap-3">
                  <FileThumbnail file={file} size="sm" />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-black text-white group-hover:text-[#FFD369] transition-colors">
                      {file.title}
                    </span>
                    <span className="mt-0.5 block truncate text-[11px] font-medium text-[#5d6878]">
                      {file.category}
                    </span>
                  </span>
                </span>
                {/* Updated */}
                <span className="flex items-center gap-1.5 text-xs font-medium text-[#5d6878]">
                  <Clock className="size-3 shrink-0" />
                  {formatFileDate(file.updatedAt)}
                </span>
              </button>
            ))}
          </div>
        ) : (
          /* ── CARD VIEW ── */
          <div className="grid grid-cols-[repeat(auto-fill,minmax(190px,1fr))] gap-3 p-4">
            {files.map((file) => (
              <button
                className={`group flex flex-col overflow-hidden rounded-[8px] border text-left shadow-[0_4px_16px_rgba(0,0,0,0.2)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_12px_36px_rgba(0,0,0,0.4)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFD369]/50 ${
                  selectedFileId === file.id
                    ? 'border-[#FFD369] bg-[#14202e] shadow-[0_0_0_1px_rgba(255,211,105,0.2)]'
                    : 'border-[#2a3444] bg-[#0f1822] hover:border-[#FFD369]/50'
                }`}
                key={file.id}
                onClick={() => onSelectFile(file)}
                type="button"
              >
                {/* Thumbnail area */}
                <FileThumbnail file={file} size="lg" />
                {/* Body */}
                <span className="flex flex-1 flex-col p-3.5">
                  <span className="block truncate text-sm font-black text-white group-hover:text-[#FFD369] transition-colors">
                    {file.title}
                  </span>
                  <span className="mt-0.5 block truncate text-[11px] font-medium text-[#5d6878]">
                    {file.category}
                  </span>
                  <span className="mt-auto pt-3 flex items-center gap-1 text-[10px] font-bold text-[#5d6878]">
                      <Clock className="size-2.5" />
                      {formatFileDate(file.updatedAt)}
                    </span>
                </span>
              </button>
            ))}
          </div>
        )
      ) : (
        /* Empty state */
        <div className="grid min-h-64 place-items-center px-6 text-center">
          <div>
            <div className="mx-auto flex size-14 items-center justify-center rounded-full border border-[#2a3444] bg-[#111923]">
              <FileText className="size-6 text-[#3d4654]" />
            </div>
            <p className="mt-3 text-sm font-black text-white">No files found</p>
            <p className="mt-1 text-xs font-medium text-[#5d6878]">
              {searchQuery ? 'Try adjusting your search query.' : 'Select another folder or create a file record.'}
            </p>
          </div>
        </div>
      )}
    </section>
  );
}

function FileThumbnail({ file, size }: { file: FileExplorerItem; size: 'lg' | 'sm' }) {
  const [imageFailed, setImageFailed] = useState(false);
  const canShowPreview = Boolean(file.previewUrl) && !imageFailed;

  if (size === 'sm') {
    return (
      <span className="relative block size-12 shrink-0 overflow-hidden rounded-[5px] border border-[#2a3444] bg-[#0d151e]">
        {canShowPreview ? (
          <img
            alt=""
            className="block h-full w-full object-cover opacity-85"
            onError={() => setImageFailed(true)}
            src={file.previewUrl}
          />
        ) : (
          <span className="grid h-full w-full place-items-center text-[#FFD369]/40">
            <FileText className="size-5" />
          </span>
        )}
        <span className="absolute inset-0 bg-gradient-to-t from-[#101820]/40 to-transparent" />
      </span>
    );
  }

  // Large (card)
  return (
    <span className="relative block h-28 w-full overflow-hidden bg-[#0d151e] shrink-0">
      {canShowPreview ? (
        <img
          alt=""
          className="block h-full w-full object-cover opacity-80 transition-all duration-500 group-hover:scale-105 group-hover:opacity-90"
          onError={() => setImageFailed(true)}
          src={file.previewUrl}
        />
      ) : (
        <span className="grid h-full w-full place-items-center bg-gradient-to-br from-[#1a2535] to-[#0d151e]">
          <FileText className="size-8 text-[#FFD369]/10" />
        </span>
      )}
      <span className="absolute inset-0 bg-gradient-to-t from-[#0f1822]/80 via-transparent to-transparent" />
    </span>
  );
}
