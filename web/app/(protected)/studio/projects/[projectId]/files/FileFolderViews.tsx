'use client';

import { useState, type ReactNode } from 'react';
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  FileText,
  FolderOpen,
  Grid2X2,
  Layers3,
  List,
  Calendar,
  Hash,
  Search,
  Loader2,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import type { ProjectFolderResponse } from '@/services/project.service';
import { FileCollection } from './FileCollection';

import {
  countArcFiles,
  getArcCover,
  getArcSubtitle,
  getAssetCover,
  getChapterCover,
  getChapterSubtitle,
  getFolderCover,
  normalizeArcTitle,
  normalizeChapterTitle,
} from './file-folder-utils';

type ArcGridProps = {
  arcs: ProjectFolderResponse[];
  assetRoots: ProjectFolderResponse[];
  chapterCounts: Record<number, number>;
  fileCounts: Record<number, number>;
  folderCovers: Record<number, string>;
  folders: ProjectFolderResponse[];
  onSelectAssetLibrary: (folderId: number) => void;
  onSelectArc: (arcId: number) => void;
};

export function ArcGrid({
  arcs,
  assetRoots,
  chapterCounts,
  fileCounts,
  folderCovers,
  folders,
  onSelectAssetLibrary,
  onSelectArc,
}: ArcGridProps) {
  const [arcViewMode, setArcViewMode] = useState<'grid' | 'list'>('grid');

  return (
    <section className="min-h-[560px] p-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-5">
        <div>
          <h2 className="text-lg font-black text-white tracking-tight">Story Arcs</h2>
          <p className="mt-0.5 text-xs font-medium text-[#8b94a1]">
            Start from the story arc, then open a chapter workspace.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge className="rounded-[3px] border border-[#4a4f55] bg-[#20282b] text-[#dce7f3] font-bold tabular-nums">
            {arcs.length} arcs
          </Badge>
          {/* View toggle */}
          <div className="flex h-8 items-center rounded-[4px] border border-[#39424f] bg-[#151c25] p-0.5">
            <button
              aria-label="Grid view"
              className={`grid size-7 place-items-center rounded-[3px] transition-colors ${arcViewMode === 'grid' ? 'bg-[#FFD369] text-[#101820]' : 'text-[#8b94a1] hover:text-white'}`}
              onClick={() => setArcViewMode('grid')}
              type="button"
            >
              <Grid2X2 className="size-3.5" />
            </button>
            <button
              aria-label="List view"
              className={`grid size-7 place-items-center rounded-[3px] transition-colors ${arcViewMode === 'list' ? 'bg-[#FFD369] text-[#101820]' : 'text-[#8b94a1] hover:text-white'}`}
              onClick={() => setArcViewMode('list')}
              type="button"
            >
              <List className="size-3.5" />
            </button>
          </div>
        </div>
      </div>

      {arcs.length ? (
        arcViewMode === 'grid' ? (
          /* ── CARD VIEW ── */
          <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4">
            {arcs.map((arc, index) => {
              const coverUrl = getFolderCover(arc, folderCovers, getArcCover(index));
              return (
                <button
                  className="group relative overflow-hidden rounded-[10px] border border-[#2d3848] bg-[#141c27] text-left shadow-[0_8px_32px_rgba(0,0,0,0.3)] transition-all duration-200 hover:-translate-y-1.5 hover:border-[#FFD369]/60 hover:shadow-[0_20px_60px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,211,105,0.1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFD369]/60"
                  key={arc.id}
                  onClick={() => onSelectArc(arc.id)}
                  type="button"
                >
                  {/* Cover image */}
                  <div className="relative h-40 overflow-hidden bg-[#0d151e]">
                    {coverUrl ? (
                      <img
                        alt=""
                        className="h-full w-full object-cover opacity-80 transition-all duration-500 group-hover:scale-110 group-hover:opacity-90"
                        src={coverUrl}
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#1a2535] via-[#111d2d] to-[#0d151e]">
                        <Layers3 className="size-10 text-[#FFD369]/10" />
                      </div>
                    )}
                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#141c27] via-[#141c27]/20 to-transparent" />
                    {/* Arc badge */}
                    <span className="absolute right-3 top-3 rounded-full border border-[#FFD369]/30 bg-[#101820]/85 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-widest text-[#FFD369] backdrop-blur-sm">
                      Arc
                    </span>
                    {/* Arc icon */}
                    <div className="absolute bottom-3 left-3 grid size-9 place-items-center rounded-[6px] border border-[#FFD369]/40 bg-[#FFD369]/10 text-[#FFD369] backdrop-blur-md ring-1 ring-inset ring-[#FFD369]/10">
                      <Layers3 className="size-4" />
                    </div>
                    {/* Number badge */}
                    <div className="absolute right-3 bottom-3 grid size-7 place-items-center rounded-full bg-[#101820]/80 text-[10px] font-black text-[#aeb7c2] backdrop-blur-sm">
                      #{index + 1}
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-4">
                    <p className="truncate text-base font-black leading-tight text-white group-hover:text-[#FFD369] transition-colors">
                      {normalizeArcTitle(arc.title)}
                    </p>
                    {(arc.description || getArcSubtitle(arc.title, index)) && (
                      <p className="mt-1 truncate text-xs font-medium text-[#8b94a1]">
                        {arc.description || getArcSubtitle(arc.title, index)}
                      </p>
                    )}
                    {/* Metrics */}
                    <div className="mt-4 flex items-center gap-4">
                      <MetricPill icon={<BookOpen className="size-3" />} label={`${chapterCounts[arc.id] ?? 0} ch`} />
                      <MetricPill icon={<FileText className="size-3" />} label={`${countArcFiles(arc.id, folders, fileCounts)} files`} />
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex h-10 items-center justify-between border-t border-[#26303b]/60 bg-[#111820]/60 px-4">
                    <span className="truncate max-w-[140px] text-[11px] font-medium text-[#5d6878]">
                      {arc.createdByUser?.displayName ? `By ${arc.createdByUser.displayName}` : ''}
                    </span>
                    <span className="flex items-center gap-1 text-[11px] font-black text-[#FFD369]">
                      Open
                      <ChevronRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          /* ── LIST VIEW ── */
          <div className="overflow-hidden rounded-[8px] border border-[#2a3444] bg-[#0f1822]">
            {/* Header row */}
            <div className="grid grid-cols-[1fr_100px_100px_100px] border-b border-[#2a3444] bg-[#141c29] px-4 py-2.5 text-[10px] font-black uppercase tracking-[0.08em] text-[#5d6878]">
              <span>Arc</span>
              <span>Chapters</span>
              <span>Files</span>
              <span className="text-right">Action</span>
            </div>
            {arcs.map((arc, index) => {
              const coverUrl = getFolderCover(arc, folderCovers, getArcCover(index));
              return (
                <button
                  className="group grid w-full grid-cols-[1fr_100px_100px_100px] items-center border-b border-[#1e2936] px-4 py-3 text-left transition-all duration-150 hover:bg-[#182130] last:border-b-0"
                  key={arc.id}
                  onClick={() => onSelectArc(arc.id)}
                  type="button"
                >
                  {/* Name + thumbnail */}
                  <span className="flex min-w-0 items-center gap-3">
                    <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-[5px] border border-[#2a3444] bg-[#0d151e]">
                      {coverUrl ? (
                        <img alt="" className="h-full w-full object-cover opacity-75 group-hover:opacity-90 transition-opacity" src={coverUrl} />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center">
                          <Layers3 className="size-4 text-[#FFD369]/25" />
                        </span>
                      )}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-black text-white group-hover:text-[#FFD369] transition-colors">
                        {normalizeArcTitle(arc.title)}
                      </span>
                      {(arc.description || getArcSubtitle(arc.title, index)) && (
                        <span className="mt-0.5 block truncate text-[11px] font-medium text-[#5d6878]">
                          {arc.description || getArcSubtitle(arc.title, index)}
                        </span>
                      )}
                    </span>
                  </span>
                  {/* Chapters */}
                  <span className="text-sm font-bold text-[#aeb7c2]">{chapterCounts[arc.id] ?? 0}</span>
                  {/* Files */}
                  <span className="text-sm font-bold text-[#aeb7c2]">{countArcFiles(arc.id, folders, fileCounts)}</span>
                  {/* Action */}
                  <span className="flex items-center justify-end gap-1 text-[11px] font-black text-[#FFD369]">
                    Open
                    <ChevronRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </button>
              );
            })}
          </div>
        )
      ) : (
        <div className="mt-2 flex items-center gap-3 rounded-[6px] border border-dashed border-[#2a3444] bg-[#0f1822] px-4 py-6 text-xs font-medium text-[#5d6878]">
          <FolderOpen className="size-4 shrink-0 text-[#3d4654]" />
          No story arcs yet. Submit an Arc application to get started.
        </div>
      )}

      {/* Production Assets */}
      {assetRoots.length ? (
        <section className="mt-8 border-t border-[#1e2936] pt-6">
          <div className="flex items-center justify-between gap-4 mb-5">
            <div>
              <h2 className="text-lg font-black text-white tracking-tight">Production Assets</h2>
              <p className="mt-0.5 text-xs font-medium text-[#8b94a1]">
                Shared references, character sheets, backgrounds, and reusable materials.
              </p>
            </div>
            <Badge className="rounded-[3px] border border-[#4a4f55] bg-[#20282b] text-[#dce7f3] font-bold">
              {assetRoots.length} libraries
            </Badge>
          </div>

          <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
            {assetRoots.map((assetRoot, index) => {
              const coverUrl = getFolderCover(assetRoot, folderCovers, getAssetCover(index));
              return (
                <button
                  className="group relative overflow-hidden rounded-[10px] border border-[#2d3848] bg-[#141c27] text-left shadow-[0_8px_32px_rgba(0,0,0,0.25)] transition-all duration-200 hover:-translate-y-1 hover:border-[#8fb3ff]/40 hover:shadow-[0_16px_50px_rgba(0,0,0,0.4)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8fb3ff]/40"
                  key={assetRoot.id}
                  onClick={() => onSelectAssetLibrary(assetRoot.id)}
                  type="button"
                >
                  <div className="relative h-32 overflow-hidden bg-[#0d151e]">
                    {coverUrl ? (
                      <img
                        alt=""
                        className="h-full w-full object-cover opacity-75 transition-all duration-500 group-hover:scale-110 group-hover:opacity-90"
                        src={coverUrl}
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#1a2535] via-[#111d2d] to-[#0d151e]">
                        <FolderOpen className="size-8 text-[#8fb3ff]/10" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#141c27] via-[#141c27]/20 to-transparent" />
                    <span className="absolute right-3 top-3 rounded-full border border-[#8fb3ff]/30 bg-[#101820]/85 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-widest text-[#b8ccff] backdrop-blur-sm">
                      Library
                    </span>
                    <div className="absolute bottom-3 left-3 grid size-9 place-items-center rounded-[6px] border border-[#8fb3ff]/30 bg-[#8fb3ff]/10 text-[#b8ccff] backdrop-blur-md">
                      <FolderOpen className="size-4" />
                    </div>
                  </div>
                  <div className="p-4">
                    <p className="truncate text-base font-black leading-tight text-white group-hover:text-[#b8ccff] transition-colors">
                      {assetRoot.title}
                    </p>
                    <div className="mt-3 flex items-center gap-4">
                      <MetricPill icon={<FileText className="size-3" />} label={`${countArcFiles(assetRoot.id, folders, fileCounts)} files`} color="blue" />
                    </div>
                  </div>
                  <div className="flex h-10 items-center justify-between border-t border-[#26303b]/60 bg-[#111820]/60 px-4">
                    <span />
                    <span className="flex items-center gap-1 text-[11px] font-black text-[#b8ccff]">
                      Open library
                      <ChevronRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      ) : null}
    </section>
  );
}

type ChapterGridProps = {
  chapters: ProjectFolderResponse[];
  fileCounts: Record<number, number>;
  folderCovers: Record<number, string>;
  onBack: () => void;
  onSelectChapter: (chapterId: number) => void;
  selectedArc: ProjectFolderResponse;
  selectedArcIndex: number;
  
  // Optional props for arc files
  arcFiles?: import('./file-ui').FileExplorerItem[];
  arcSearchQuery?: string;
  onArcSearchChange?: (value: string) => void;
  onSelectFile?: (file: import('./file-ui').FileExplorerItem) => void;
  arcViewMode?: 'grid' | 'table';
  onArcViewModeChange?: (mode: 'grid' | 'table') => void;
  isLoadingArcFiles?: boolean;
  isLoadingChapters?: boolean;
};

export function ChapterGrid({
  chapters,
  fileCounts,
  folderCovers,
  onBack,
  onSelectChapter,
  selectedArc,
  selectedArcIndex,
  arcFiles,
  arcSearchQuery,
  onArcSearchChange,
  onSelectFile,
  arcViewMode,
  onArcViewModeChange,
  isLoadingArcFiles,
  isLoadingChapters,
}: ChapterGridProps) {
  const [chapterViewMode, setChapterViewMode] = useState<'grid' | 'list'>('grid');
  const arcCoverUrl = getFolderCover(selectedArc, folderCovers, getArcCover(Math.max(0, selectedArcIndex)));

  return (
    <section className="min-h-[560px]">
      {/* Hero banner */}
      <div className="relative min-h-[200px] overflow-hidden border-b border-[#1e2936]">
        {arcCoverUrl ? (
          <img
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-60"
            src={arcCoverUrl}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#1b2530] via-[#0d151e] to-[#1b2530]" />
        )}
        {/* Cinematic gradients */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#101820]/95 via-[#101820]/70 to-[#101820]/30" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#101820] via-transparent to-transparent" />

        <div className="relative flex min-h-[200px] flex-col justify-between p-5">
          <button
            className="flex h-8 w-fit items-center gap-2 rounded-[5px] border border-[#2a3444]/80 bg-[#101820]/60 px-3 text-xs font-black text-[#aeb7c2] backdrop-blur-sm transition-colors hover:bg-[#17202b] hover:text-white hover:border-[#FFD369]/30"
            onClick={onBack}
            type="button"
          >
            <ChevronLeft className="size-3.5" />
            All Arcs
          </button>
          <div className="max-w-2xl">
            <span className="inline-block rounded-full border border-[#FFD369]/30 bg-[#FFD369]/10 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-widest text-[#FFD369]">
              Story Arc #{selectedArcIndex + 1}
            </span>
            <h2 className="mt-2 text-3xl font-black leading-tight text-white">
              {normalizeArcTitle(selectedArc.title)}
            </h2>
            {getArcSubtitle(selectedArc.title, Math.max(0, selectedArcIndex)) && (
              <p className="mt-1 text-sm font-semibold text-[#dce7f3]/70">
                {getArcSubtitle(selectedArc.title, Math.max(0, selectedArcIndex))}
              </p>
            )}
            <p className="mt-2 max-w-xl text-xs font-medium leading-relaxed text-[#8b94a1]">
              {selectedArc.description || 'Opening production workspace for this story arc. Review the chapters and choose the next chapter to continue manga production.'}
            </p>
            <div className="mt-3 flex flex-wrap gap-4">
              <MetricPill icon={<BookOpen className="size-3" />} label={`${chapters.length} chapters`} />
              <MetricPill icon={<FileText className="size-3" />} label={`${chapters.reduce((t, c) => t + (fileCounts[c.id] ?? 0), 0)} files`} />
            </div>
          </div>
        </div>
      </div>

      {/* Chapters list */}
      <div className="p-5">
        <div className="flex items-center justify-between gap-4 mb-5">
          <div>
            <h3 className="text-base font-black text-white tracking-tight">Chapters</h3>
            <p className="mt-0.5 text-xs font-medium text-[#8b94a1]">Choose the chapter you are producing.</p>
          </div>
          <div className="flex items-center gap-3">
            {onArcSearchChange && arcSearchQuery !== undefined && (
              <div className="flex h-8 w-64 items-center gap-2 rounded-[5px] border border-[#2a3444] bg-[#111923] px-3 transition-colors focus-within:border-[#FFD369]/40 focus-within:bg-[#141e2a]">
                <Search className="size-3.5 shrink-0 text-[#5d6878]" />
                <input
                  className="min-w-0 flex-1 bg-transparent text-xs font-medium text-white outline-none placeholder:text-[#5d6878]"
                  onChange={(event) => onArcSearchChange(event.target.value)}
                  placeholder="Search chapters & files..."
                  value={arcSearchQuery}
                />
              </div>
            )}
            <Badge className="rounded-[3px] border border-[#4a4f55] bg-[#20282b] text-[#dce7f3] font-bold">
              {chapters.length} chapters
            </Badge>
            <div className="flex h-8 items-center rounded-[4px] border border-[#39424f] bg-[#151c25] p-0.5">
              <button
                aria-label="Chapter grid view"
                className={`grid size-7 place-items-center rounded-[3px] transition-colors ${chapterViewMode === 'grid' ? 'bg-[#FFD369] text-[#101820]' : 'text-[#8b94a1] hover:text-white'}`}
                onClick={() => setChapterViewMode('grid')}
                type="button"
              >
                <Grid2X2 className="size-3.5" />
              </button>
              <button
                aria-label="Chapter list view"
                className={`grid size-7 place-items-center rounded-[3px] transition-colors ${chapterViewMode === 'list' ? 'bg-[#FFD369] text-[#101820]' : 'text-[#8b94a1] hover:text-white'}`}
                onClick={() => setChapterViewMode('list')}
                type="button"
              >
                <List className="size-3.5" />
              </button>
            </div>
          </div>
        </div>

        {isLoadingChapters ? (
          <div className="grid min-h-[200px] place-items-center px-6">
            <Loader2 className="size-8 animate-spin text-[#FFD369]" />
          </div>
        ) : chapters.length === 0 ? (
          <div className="flex items-center gap-3 rounded-[6px] border border-dashed border-[#2a3444] bg-[#0f1822] px-4 py-6 text-xs font-medium text-[#5d6878]">
            <BookOpen className="size-4 shrink-0 text-[#3d4654]" />
            No chapters yet. Submit a Chapter application to add the first chapter.
          </div>
        ) : chapterViewMode === 'grid' ? (
          /* ── CHAPTER CARD VIEW ── */
          <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4">
            {chapters.map((chapter) => {
              const coverUrl = getFolderCover(chapter, folderCovers, getChapterCover(chapter.id));
              return (
                <button
                  className="group flex flex-col overflow-hidden rounded-[8px] border border-[#2a3444] bg-[#0f1822] text-left shadow-[0_6px_24px_rgba(0,0,0,0.25)] transition-all duration-200 hover:-translate-y-1 hover:border-[#FFD369]/50 hover:shadow-[0_14px_40px_rgba(0,0,0,0.4),0_0_0_1px_rgba(255,211,105,0.06)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFD369]/50"
                  key={chapter.id}
                  onClick={() => onSelectChapter(chapter.id)}
                  type="button"
                >
                  {/* Thumbnail */}
                  <div className="relative h-28 w-full overflow-hidden bg-[#0d151e] shrink-0">
                    {coverUrl ? (
                      <img
                        alt=""
                        className="h-full w-full object-cover opacity-70 transition-all duration-500 group-hover:scale-110 group-hover:opacity-85"
                        src={coverUrl}
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#1a2535] to-[#0d151e]">
                        <BookOpen className="size-8 text-[#FFD369]/10" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0f1822] via-transparent to-transparent" />
                    <div className="absolute bottom-2 left-2 grid size-8 place-items-center rounded-[4px] border border-[#FFD369]/30 bg-[#FFD369]/10 text-[#FFD369] backdrop-blur-sm">
                      <BookOpen className="size-3.5" />
                    </div>
                  </div>
                  {/* Body */}
                  <div className="flex flex-1 flex-col justify-between p-3.5 min-w-0 w-full">
                    <div>
                      <span className="block truncate text-sm font-black text-white group-hover:text-[#FFD369] transition-colors">
                        {normalizeChapterTitle(chapter.title)}
                      </span>
                      {(chapter.description || getChapterSubtitle(chapter.title, chapter.id)) && (
                        <span className="mt-0.5 block truncate text-[11px] font-medium text-[#5d6878]">
                          {chapter.description || getChapterSubtitle(chapter.title, chapter.id)}
                        </span>
                      )}
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-[11px] font-bold text-[#aeb7c2]">
                        <FileText className="size-3 text-[#FFD369]/60" />
                        {fileCounts[chapter.id] ?? 0} files
                      </span>
                      {chapter.createdByUser?.displayName && (
                        <span className="truncate max-w-[90px] text-[10px] font-medium text-[#5d6878]">
                          {chapter.createdByUser.displayName}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          /* ── CHAPTER LIST VIEW ── */
          <div className="overflow-hidden rounded-[8px] border border-[#2a3444] bg-[#0f1822]">
            <div className="grid grid-cols-[1fr_90px_90px] border-b border-[#2a3444] bg-[#141c29] px-4 py-2.5 text-[10px] font-black uppercase tracking-[0.08em] text-[#5d6878]">
              <span>Chapter</span>
              <span>Files</span>
              <span className="text-right">Open</span>
            </div>
            {chapters.map((chapter) => {
              const coverUrl = getFolderCover(chapter, folderCovers, getChapterCover(chapter.id));
              return (
                <button
                  className="group grid w-full grid-cols-[1fr_90px_90px] items-center border-b border-[#1e2936] px-4 py-3 text-left transition-all duration-150 hover:bg-[#182130] last:border-b-0"
                  key={chapter.id}
                  onClick={() => onSelectChapter(chapter.id)}
                  type="button"
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span className="relative h-14 w-10 shrink-0 overflow-hidden rounded-[4px] border border-[#2a3444] bg-[#0d151e]">
                      {coverUrl ? (
                        <img alt="" className="h-full w-full object-cover opacity-70 group-hover:opacity-90 transition-opacity" src={coverUrl} />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center">
                          <BookOpen className="size-3.5 text-[#FFD369]/20" />
                        </span>
                      )}
                      <span className="absolute inset-0 bg-gradient-to-t from-[#101820]/40 to-transparent" />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-black text-white group-hover:text-[#FFD369] transition-colors">
                        {normalizeChapterTitle(chapter.title)}
                      </span>
                      {(chapter.description || getChapterSubtitle(chapter.title, chapter.id)) && (
                        <span className="mt-0.5 block truncate text-[11px] font-medium text-[#5d6878]">
                          {chapter.description || getChapterSubtitle(chapter.title, chapter.id)}
                        </span>
                      )}
                      {chapter.createdByUser?.displayName && (
                        <span className="mt-0.5 block text-[10px] font-medium text-[#FFD369]/60">
                          By {chapter.createdByUser.displayName}
                        </span>
                      )}
                    </span>
                  </span>
                  <span className="text-sm font-bold text-[#aeb7c2]">{fileCounts[chapter.id] ?? 0}</span>
                  <span className="flex items-center justify-end gap-0.5 text-[11px] font-black text-[#FFD369]">
                    Open
                    <ChevronRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ARC FILES SECTION */}
      {arcFiles && arcFiles.length > 0 && onArcSearchChange && onSelectFile && onArcViewModeChange && arcSearchQuery !== undefined && arcViewMode !== undefined && (
        <div className="border-t border-[#1e2936]">
          <div className="p-5 pb-3">
            <h3 className="text-base font-black text-white tracking-tight">Story Arc Files</h3>
            <p className="mt-0.5 text-xs font-medium text-[#8b94a1]">Direct files and references for this story arc.</p>
          </div>
          <FileCollection
            files={arcFiles}
            onSearchChange={onArcSearchChange}
            onSelectFile={onSelectFile}
            onViewModeChange={onArcViewModeChange}
            searchQuery={arcSearchQuery}
            selectedFileId={null}
            viewMode={arcViewMode}
            hideSearch={true}
            isLoading={isLoadingArcFiles}
          />
        </div>
      )}
    </section>
  );
}

export function ChapterWorkspaceHeader({
  fileCount,
  folderCovers,
  selectedChapter,
}: {
  fileCount: number;
  folderCovers: Record<number, string>;
  selectedChapter: ProjectFolderResponse;
}) {
  const coverUrl = getFolderCover(selectedChapter, folderCovers, getChapterCover(selectedChapter.id));

  return (
    <section className="relative overflow-hidden border-b border-[#1e2936] bg-[#0d151e]">
      {/* Blurred background image */}
      {coverUrl && (
        <>
          <img
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-20 blur-xl scale-110"
            src={coverUrl}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0d151e]/95 to-[#0d151e]/80" />
        </>
      )}

      <div className="relative flex gap-4 px-5 py-4">
        {/* Cover */}
        <div className="relative h-[130px] w-[88px] shrink-0 overflow-hidden rounded-[6px] border border-[#2a3444] bg-[#0d151e] shadow-[0_8px_24px_rgba(0,0,0,0.4)]">
          {coverUrl ? (
            <img alt="" className="h-full w-full object-cover opacity-85" src={coverUrl} />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#1b2530] to-[#0d151e]">
              <BookOpen className="size-8 text-[#FFD369]/15" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#101820]/50 to-transparent" />
        </div>

        <div className="min-w-0 flex-1 py-1">
          <span className="inline-block rounded-full border border-[#FFD369]/25 bg-[#FFD369]/8 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-widest text-[#FFD369]">
            Chapter Workspace
          </span>
          <h2 className="mt-2 truncate text-xl font-black text-white">
            {normalizeChapterTitle(selectedChapter.title)}
          </h2>
          {getChapterSubtitle(selectedChapter.title, selectedChapter.id) && (
            <p className="mt-0.5 truncate text-sm font-semibold text-[#dce7f3]/70">
              {getChapterSubtitle(selectedChapter.title, selectedChapter.id)}
            </p>
          )}
          <p className="mt-1.5 max-w-2xl text-xs font-medium leading-relaxed text-[#5d6878]">
            {selectedChapter.description || 'Compact production view for chapter files, tasks, references, and review handoff.'}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <MetricPill icon={<FileText className="size-3" />} label={`${fileCount} Files`} />
            {selectedChapter.createdByUser?.displayName && (
              <MetricPill icon={<Hash className="size-3" />} label={selectedChapter.createdByUser.displayName} />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function MetricPill({
  icon,
  label,
  color = 'yellow',
}: {
  icon: ReactNode;
  label: string;
  color?: 'yellow' | 'blue';
}) {
  const colorClass = color === 'blue' ? 'text-[#b8ccff] bg-[#8fb3ff]/10 border-[#8fb3ff]/20' : 'text-[#dce7f3] bg-[#FFD369]/8 border-[#FFD369]/15';
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${colorClass}`}>
      <span className={color === 'blue' ? 'text-[#8fb3ff]' : 'text-[#FFD369]'}>{icon}</span>
      {label}
    </span>
  );
}

function MetricLine({
  icon,
  label,
}: {
  icon: ReactNode;
  label: string;
}) {
  return (
    <span className="flex items-center gap-2 text-[#dce7f3]">
      <span className="text-[#FFD369]">{icon}</span>
      <span className="min-w-0 truncate">{label}</span>
    </span>
  );
}
