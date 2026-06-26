'use client';

import { FileText, Grid2X2, List, Search } from 'lucide-react';

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
};

export function FileCollection({
  files,
  onSearchChange,
  onSelectFile,
  onViewModeChange,
  searchQuery,
  selectedFileId,
  viewMode,
}: FileCollectionProps) {
  return (
    <section className="min-w-0 bg-[#101820]">
      <div className="flex h-14 items-center justify-between gap-4 border-b border-[#26303b] px-4">
        <div className="flex h-9 min-w-0 max-w-md flex-1 items-center gap-3 rounded-[4px] border border-[#39424f] bg-[#151c25] px-3">
          <Search className="size-4 text-[#dce7f3]" />
          <input
            className="min-w-0 flex-1 bg-transparent text-xs font-medium text-white outline-none placeholder:text-[#8b94a1]"
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search files in this chapter..."
            value={searchQuery}
          />
        </div>
        <div className="flex h-9 items-center rounded-[4px] border border-[#39424f] bg-[#151c25] p-1">
          <Button
            aria-label="Table view"
            className={viewMode === 'table' ? 'size-7 bg-[#303842] text-[#FFD369]' : 'size-7'}
            onClick={() => onViewModeChange('table')}
            size="icon"
            variant="ghost"
          >
            <List className="size-4" />
          </Button>
          <Button
            aria-label="Grid view"
            className={viewMode === 'grid' ? 'size-7 bg-[#303842] text-[#FFD369]' : 'size-7'}
            onClick={() => onViewModeChange('grid')}
            size="icon"
            variant="ghost"
          >
            <Grid2X2 className="size-4" />
          </Button>
        </div>
      </div>

      {files.length ? (
        viewMode === 'table' ? (
          <div className="overflow-x-auto">
            <div className="grid min-w-[800px] grid-cols-[minmax(320px,1fr)_140px_120px_120px] border-b border-[#26303b] bg-[#171e27] px-4 py-3 text-[10px] font-black uppercase tracking-[0.08em] text-[#8b94a1]">
              <span>File</span>
              <span>Status</span>
              <span>Tasks</span>
              <span>Updated</span>
            </div>
            {files.map((file) => (
              <button
                className={`grid min-h-[84px] w-full min-w-[800px] grid-cols-[minmax(320px,1fr)_140px_120px_120px] items-center border-b border-[#26303b] px-4 text-left hover:bg-[#17202b] ${
                  selectedFileId === file.id ? 'bg-[#17202b]' : ''
                }`}
                key={file.id}
                onClick={() => onSelectFile(file)}
                type="button"
              >
                <span className="flex min-w-0 items-center gap-3">
                  <FileThumbnail file={file} size="sm" />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-black text-white">{file.title}</span>
                    <span className="mt-1 block truncate text-[11px] font-bold text-[#8b94a1]">
                      {file.category}
                    </span>
                  </span>
                </span>
                <Badge className={`w-fit rounded-[3px] border ${fileStatusClassName[file.status]}`}>
                  {fileStatusLabels[file.status]}
                </Badge>
                <span className="text-xs font-bold text-[#dce7f3]">{file.taskCount} tasks</span>
                <span className="text-xs font-bold text-[#aeb7c2]">
                  {formatFileDate(file.updatedAt)}
                </span>
              </button>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(210px,1fr))] gap-3 p-4">
            {files.map((file) => (
              <button
                className={`min-h-56 overflow-hidden rounded-[5px] border text-left transition-colors hover:border-[#FFD369]/60 hover:bg-[#17202b] ${
                  selectedFileId === file.id
                    ? 'border-[#FFD369] bg-[#17202b]'
                    : 'border-[#39424f] bg-[#151c25]'
                }`}
                key={file.id}
                onClick={() => onSelectFile(file)}
                type="button"
              >
                <FileThumbnail file={file} size="lg" />
                <span className="block p-4">
                  <span className="block truncate text-sm font-black text-white">{file.title}</span>
                  <span className="mt-1 block truncate text-[11px] font-bold text-[#8b94a1]">
                    {file.category} - {file.taskCount} tasks
                  </span>
                  <Badge className={`mt-4 rounded-[3px] border ${fileStatusClassName[file.status]}`}>
                    {fileStatusLabels[file.status]}
                  </Badge>
                </span>
              </button>
            ))}
          </div>
        )
      ) : (
        <div className="grid min-h-72 place-items-center px-6 text-center">
          <div>
            <FileText className="mx-auto size-8 text-[#5b626d]" />
            <p className="mt-3 text-sm font-black text-white">No files found</p>
            <p className="mt-1 text-xs font-bold text-[#8b94a1]">
              Select another folder or create a file record.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}

function FileThumbnail({ file, size }: { file: FileExplorerItem; size: 'lg' | 'sm' }) {
  const className =
    size === 'lg'
      ? 'relative h-28 w-full overflow-hidden bg-[#0d151e]'
      : 'relative size-14 shrink-0 overflow-hidden rounded-[4px] border border-[#303842] bg-[#0d151e]';

  return (
    <span className={className}>
      {file.previewUrl ? (
        <img alt="" className="h-full w-full object-cover opacity-85" src={file.previewUrl} />
      ) : (
        <span className="grid h-full w-full place-items-center text-[#FFD369]">
          <FileText className={size === 'lg' ? 'size-7' : 'size-5'} />
        </span>
      )}
      <span className="absolute inset-0 bg-gradient-to-t from-[#101820]/50 to-transparent" />
    </span>
  );
}
