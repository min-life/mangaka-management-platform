'use client';

import { useState, type ReactNode } from 'react';
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  CircleDot,
  FileText,
  FolderOpen,
  Grid2X2,
  Layers3,
  List,
  ListChecks,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import type { ProjectFolderResponse } from '@/services/project.service';

import {
  countArcFiles,
  getArcCover,
  getArcProgress,
  getArcSubtitle,
  getAssetCover,
  getChapterCover,
  getChapterProgress,
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
  return (
    <section className="min-h-[560px] p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-white">Story Arcs</h2>
          <p className="mt-1 text-xs font-bold text-[#8b94a1]">
            Start from the story arc, then open a chapter workspace.
          </p>
        </div>
        <Badge className="rounded-[3px] border border-[#4a4f55] bg-[#20282b] text-[#dce7f3]">
          {arcs.length} arcs
        </Badge>
      </div>

      {arcs.length ? (
        <div className="mt-5 grid grid-cols-[repeat(auto-fit,minmax(320px,1fr))] gap-4">
          {arcs.map((arc, index) => (
            <button
              className="group overflow-hidden rounded-[7px] border border-[#3d4654] bg-[#19222d] text-left shadow-[0_16px_48px_rgba(0,0,0,0.28)] transition-all duration-150 hover:-translate-y-1 hover:border-[#FFD369]/75 hover:bg-[#1d2835] hover:shadow-[0_24px_70px_rgba(0,0,0,0.38)]"
              key={arc.id}
              onClick={() => onSelectArc(arc.id)}
              type="button"
            >
              <div className="relative h-36 overflow-hidden bg-[#0d151e]">
                <img
                  alt=""
                  className="h-full w-full object-cover opacity-90 transition-transform duration-300 group-hover:scale-105"
                  src={getFolderCover(arc, folderCovers, getArcCover(index))}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#101820] via-[#101820]/15 to-transparent" />
                <div className="absolute bottom-3 left-3 grid size-9 place-items-center rounded-[4px] border border-[#FFD369]/60 bg-[#101820]/90 text-[#FFD369] shadow-lg">
                  <Layers3 className="size-4" />
                </div>
                <span className="absolute right-3 top-3 rounded-full border border-[#FFD369]/35 bg-[#101820]/85 px-2.5 py-1 text-[10px] font-black uppercase text-[#FFD369]">
                  Arc
                </span>
              </div>
              <div className="p-4">
                <p className="truncate text-lg font-black leading-6 text-white">{normalizeArcTitle(arc.title)}</p>
                <p className="mt-1 truncate text-xs font-bold text-[#aeb7c2]">
                  {getArcSubtitle(arc.title, index)} *
                </p>
                <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[#2b3541]">
                  <span
                    className="block h-full rounded-full bg-[#FFD369]"
                    style={{ width: `${getArcProgress(index)}%` }}
                  />
                </div>
                <p className="mt-2 text-[10px] font-black uppercase tracking-[0.06em] text-[#8b94a1]">
                  {getArcProgress(index)}% production *
                </p>
                <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-xs font-bold text-[#dce7f3]">
                  <MetricLine icon={<BookOpen className="size-3" />} label={`${chapterCounts[arc.id]} chapters`} />
                  <MetricLine icon={<FileText className="size-3" />} label={`${countArcFiles(arc.id, folders, fileCounts)} files`} />
                  <MetricLine icon={<ListChecks className="size-3" />} label={`${8 + index * 5} tasks *`} />
                  <MetricLine icon={<CircleDot className="size-3" />} label={`${index + 1} review *`} />
                </div>
              </div>
              <div className="flex h-11 items-center justify-between border-t border-[#303842] bg-[#121a24] px-4 text-xs font-black text-[#FFD369]">
                <span>Open arc</span>
                <ChevronRight className="size-4 transition-transform group-hover:translate-x-1" />
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="mt-5 rounded-[5px] border border-[#303842] bg-[#151c25] px-4 py-6 text-xs font-bold text-[#8b94a1]">
          No story arcs found. Create a root folder such as Arc 1, Arc 2, or One Shot.
        </div>
      )}

      {assetRoots.length ? (
        <section className="mt-8 border-t border-[#26303b] pt-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-black text-white">Production Assets</h2>
              <p className="mt-1 text-xs font-bold text-[#8b94a1]">
                Shared references, character sheets, backgrounds, and reusable materials.
              </p>
            </div>
            <Badge className="rounded-[3px] border border-[#4a4f55] bg-[#20282b] text-[#dce7f3]">
              {assetRoots.length} libraries
            </Badge>
          </div>

          <div className="mt-5 grid grid-cols-[repeat(auto-fit,minmax(320px,1fr))] gap-4">
            {assetRoots.map((assetRoot, index) => (
              <button
                className="group overflow-hidden rounded-[7px] border border-[#3d4654] bg-[#19222d] text-left shadow-[0_16px_48px_rgba(0,0,0,0.24)] transition-all duration-150 hover:-translate-y-1 hover:border-[#FFD369]/75 hover:bg-[#1d2835] hover:shadow-[0_24px_70px_rgba(0,0,0,0.34)]"
                key={assetRoot.id}
                onClick={() => onSelectAssetLibrary(assetRoot.id)}
                type="button"
              >
                <div className="relative h-32 overflow-hidden bg-[#0d151e]">
                  <img
                    alt=""
                    className="h-full w-full object-cover opacity-85 transition-transform duration-300 group-hover:scale-105"
                    src={getFolderCover(assetRoot, folderCovers, getAssetCover(index))}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#101820] via-[#101820]/15 to-transparent" />
                  <div className="absolute bottom-3 left-3 grid size-9 place-items-center rounded-[4px] border border-[#FFD369]/60 bg-[#101820]/90 text-[#FFD369] shadow-lg">
                    <FolderOpen className="size-4" />
                  </div>
                  <span className="absolute right-3 top-3 rounded-full border border-[#8fb3ff]/35 bg-[#101820]/85 px-2.5 py-1 text-[10px] font-black uppercase text-[#b8ccff]">
                    Library
                  </span>
                </div>
                <div className="p-4">
                  <p className="truncate text-lg font-black leading-6 text-white">{assetRoot.title}</p>
                  <p className="mt-1 truncate text-xs font-bold text-[#aeb7c2]">
                    Shared production library *
                  </p>
                  <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-xs font-bold text-[#dce7f3]">
                    <MetricLine
                      icon={<FileText className="size-3.5" />}
                      label={`${countArcFiles(assetRoot.id, folders, fileCounts)} files`}
                    />
                    <MetricLine icon={<Layers3 className="size-3.5" />} label="Reusable assets *" />
                  </div>
                </div>
                <div className="flex h-11 items-center justify-between border-t border-[#303842] bg-[#121a24] px-4 text-xs font-black text-[#FFD369]">
                  <span>Open library</span>
                  <ChevronRight className="size-4 transition-transform group-hover:translate-x-1" />
                </div>
              </button>
            ))}
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
};

export function ChapterGrid({
  chapters,
  fileCounts,
  folderCovers,
  onBack,
  onSelectChapter,
  selectedArc,
  selectedArcIndex,
}: ChapterGridProps) {
  const [chapterViewMode, setChapterViewMode] = useState<'grid' | 'table'>('grid');

  return (
    <section className="min-h-[560px]">
      <div className="relative min-h-[220px] overflow-hidden border-b border-[#26303b]">
        <img
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-70"
          src={getFolderCover(selectedArc, folderCovers, getArcCover(Math.max(0, selectedArcIndex)))}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#101820] via-[#101820]/85 to-[#101820]/30" />
        <div className="relative flex min-h-[220px] flex-col justify-between p-5">
          <button
            className="flex h-8 w-fit items-center gap-2 rounded-[4px] bg-[#101820]/70 px-3 text-xs font-black text-[#dce7f3] hover:bg-[#17202b] hover:text-white"
            onClick={onBack}
            type="button"
          >
            <ChevronLeft className="size-4" />
            Files
          </button>
          <div className="max-w-2xl">
            <p className="text-[10px] font-black uppercase tracking-[0.1em] text-[#FFD369]">
              Story Arc
            </p>
            <h2 className="mt-1 text-3xl font-black leading-tight text-white">
              {normalizeArcTitle(selectedArc.title)}
            </h2>
            <p className="mt-1 text-sm font-bold text-[#dce7f3]">
              {getArcSubtitle(selectedArc.title, Math.max(0, selectedArcIndex))} *
            </p>
            <p className="mt-2 max-w-xl text-xs font-medium leading-5 text-[#aeb7c2]">
              Opening production workspace for this story arc. Review the chapters and choose the
              next chapter to continue manga production. *
            </p>
            <div className="mt-3 flex max-w-md items-center gap-3">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#26303b]">
                <span
                  className="block h-full rounded-full bg-[#FFD369]"
                  style={{ width: `${getArcProgress(Math.max(0, selectedArcIndex))}%` }}
                />
              </div>
              <span className="text-xs font-black text-white">
                {getArcProgress(Math.max(0, selectedArcIndex))}% Complete *
              </span>
            </div>
            <div className="mt-3 flex flex-wrap gap-4 text-xs font-bold text-[#dce7f3]">
              <MetricLine icon={<BookOpen className="size-3.5" />} label={`${chapters.length} chapters`} />
              <MetricLine
                icon={<FileText className="size-3.5" />}
                label={`${chapters.reduce((total, chapter) => total + (fileCounts[chapter.id] ?? 0), 0)} files`}
              />
              <MetricLine icon={<ListChecks className="size-3.5" />} label={`${chapters.length * 3} tasks *`} />
            </div>
          </div>
        </div>
      </div>

      <div className="p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-black text-white">Chapters</h3>
            <p className="mt-1 text-xs font-bold text-[#8b94a1]">
              Choose the chapter you are producing.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge className="rounded-[3px] border border-[#4a4f55] bg-[#20282b] text-[#dce7f3]">
              {chapters.length} chapters
            </Badge>
            <div className="flex h-9 items-center rounded-[4px] border border-[#39424f] bg-[#151c25] p-1">
              <button
                aria-label="Chapter gallery view"
                className={`grid size-7 place-items-center rounded-[3px] ${
                  chapterViewMode === 'grid' ? 'bg-[#303842] text-[#FFD369]' : 'text-white'
                }`}
                onClick={() => setChapterViewMode('grid')}
                type="button"
              >
                <Grid2X2 className="size-4" />
              </button>
              <button
                aria-label="Chapter table view"
                className={`grid size-7 place-items-center rounded-[3px] ${
                  chapterViewMode === 'table' ? 'bg-[#303842] text-[#FFD369]' : 'text-white'
                }`}
                onClick={() => setChapterViewMode('table')}
                type="button"
              >
                <List className="size-4" />
              </button>
            </div>
          </div>
        </div>

        {chapterViewMode === 'grid' ? (
          <div className="mt-5 grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-4">
            {chapters.map((chapter) => (
              <button
                className="group min-h-[300px] overflow-hidden rounded-[5px] border border-[#303842] bg-[#151c25] text-left shadow-[0_14px_40px_rgba(0,0,0,0.2)] transition-colors hover:border-[#FFD369]/70 hover:bg-[#17202b]"
                key={chapter.id}
                onClick={() => onSelectChapter(chapter.id)}
                type="button"
              >
                <div className="relative h-44 overflow-hidden bg-[#0d151e]">
                  <img
                    alt=""
                    className="h-full w-full object-cover opacity-85 transition-transform duration-300 group-hover:scale-105"
                    src={getFolderCover(chapter, folderCovers, getChapterCover(chapter.id))}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#101820] via-transparent to-transparent" />
                  <div className="absolute bottom-3 left-3 grid size-9 place-items-center rounded-[4px] border border-[#FFD369]/60 bg-[#101820]/85 text-[#FFD369]">
                    <BookOpen className="size-4" />
                  </div>
                </div>
                <div className="p-4">
                  <span className="block truncate text-base font-black text-white">
                    {normalizeChapterTitle(chapter.title)}
                  </span>
                  <span className="mt-1 block truncate text-xs font-bold text-[#aeb7c2]">
                    {getChapterSubtitle(chapter.title, chapter.id)} *
                  </span>
                  <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[#26303b]">
                    <span
                      className="block h-full rounded-full bg-[#FFD369]"
                      style={{ width: `${getChapterProgress(chapter.id)}%` }}
                    />
                  </div>
                  <span className="mt-2 block text-[10px] font-black uppercase tracking-[0.06em] text-[#8b94a1]">
                    {getChapterProgress(chapter.id)}% complete *
                  </span>
                  <div className="mt-4 flex flex-wrap gap-x-3 gap-y-1 text-xs font-bold text-[#dce7f3]">
                    <span>{fileCounts[chapter.id] ?? 0} Files</span>
                    <span className="text-[#5b626d]">/</span>
                    <span>{(chapter.id % 5) + 2} Tasks *</span>
                    {chapter.id % 3 ? (
                      <>
                        <span className="text-[#5b626d]">/</span>
                        <span className="text-[#ffd35b]">Review Pending *</span>
                      </>
                    ) : null}
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="mt-5 overflow-hidden rounded-[5px] border border-[#303842] bg-[#151c25]">
            <div className="grid min-w-[760px] grid-cols-[minmax(320px,1fr)_130px_130px_150px] border-b border-[#303842] bg-[#1b2430] px-4 py-3 text-[10px] font-black uppercase tracking-[0.08em] text-[#8b94a1]">
              <span>Chapter</span>
              <span>Files</span>
              <span>Progress</span>
              <span>Review</span>
            </div>
            {chapters.map((chapter) => (
              <button
                className="grid min-h-[108px] w-full min-w-[760px] grid-cols-[minmax(320px,1fr)_130px_130px_150px] items-center border-b border-[#303842] px-4 text-left transition-colors hover:bg-[#17202b]"
                key={chapter.id}
                onClick={() => onSelectChapter(chapter.id)}
                type="button"
              >
                <span className="flex min-w-0 items-center gap-4">
                  <span className="relative h-24 w-16 shrink-0 overflow-hidden rounded-[4px] border border-[#303842] bg-[#0d151e]">
                    <img
                      alt=""
                      className="h-full w-full object-cover opacity-85"
                      src={getFolderCover(chapter, folderCovers, getChapterCover(chapter.id))}
                    />
                    <span className="absolute inset-0 bg-gradient-to-t from-[#101820]/50 to-transparent" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-black text-white">
                      {normalizeChapterTitle(chapter.title)}
                    </span>
                    <span className="mt-1 block truncate text-xs font-bold text-[#8b94a1]">
                      {getChapterSubtitle(chapter.title, chapter.id)} *
                    </span>
                  </span>
                </span>
                <span className="text-xs font-bold text-[#dce7f3]">
                  {fileCounts[chapter.id] ?? 0} files
                </span>
                <span className="text-xs font-black text-[#FFD369]">
                  {getChapterProgress(chapter.id)}%
                </span>
                <span className="text-xs font-bold text-[#ffd35b]">
                  {chapter.id % 3 ? 'Review Pending *' : 'Clear *'}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
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
  const progress = getChapterProgress(selectedChapter.id);
  const reviewCount = selectedChapter.id % 3;

  return (
    <section className="border-b border-[#26303b] bg-[#101820] px-4 py-4">
      <div className="flex gap-4">
        <div className="relative h-[150px] w-[100px] shrink-0 overflow-hidden rounded-[4px] bg-[#0d151e]">
          <img
            alt=""
            className="h-full w-full object-cover opacity-85"
            src={getFolderCover(selectedChapter, folderCovers, getChapterCover(selectedChapter.id))}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#101820]/60 to-transparent" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-black uppercase tracking-[0.1em] text-[#FFD369]">
            Chapter Workspace
          </p>
          <h2 className="mt-1 truncate text-2xl font-black text-white">
            {normalizeChapterTitle(selectedChapter.title)}
          </h2>
          <p className="mt-1 truncate text-sm font-bold text-[#dce7f3]">
            {getChapterSubtitle(selectedChapter.title, selectedChapter.id)} *
          </p>
          <p className="mt-2 max-w-2xl text-xs font-medium leading-5 text-[#aeb7c2]">
            Compact production view for chapter files, tasks, references, and review handoff. *
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-4">
            <div className="flex min-w-52 items-center gap-3">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#26303b]">
                <span
                  className="block h-full rounded-full bg-[#FFD369]"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-[10px] font-black uppercase text-[#8b94a1]">
                {progress}% *
              </span>
            </div>
            <span className="text-xs font-bold text-[#dce7f3]">{fileCount} Files</span>
            <span className="text-xs font-bold text-[#dce7f3]">
              {(selectedChapter.id % 5) + 2} Tasks *
            </span>
            {reviewCount ? (
              <span className="rounded-full bg-[#30270d] px-2.5 py-1 text-[10px] font-black text-[#ffd35b]">
                {reviewCount} Review *
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </section>
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
