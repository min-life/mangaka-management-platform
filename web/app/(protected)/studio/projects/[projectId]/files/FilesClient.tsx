'use client';

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  CircleDot,
  Database,
  FileText,
  FolderOpen,
  Layers3,
  ListChecks,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import {
  createProjectFolder,
  getProjectFolders,
  type ProjectFolderResponse,
} from '@/services/project.service';

import { CreateFileDialog } from './CreateFileDialog';
import { CreateFolderDialog } from './CreateFolderDialog';
import { FileCollection, type FileViewMode } from './FileCollection';
import {
  buildDemoProductionFolders,
  buildFallbackFiles,
  FILES_LOCAL_STORAGE_KEY,
  type FileExplorerItem,
} from './file-ui';

type FilesClientProps = {
  projectId: number;
};

export function FilesClient({ projectId }: FilesClientProps) {
  const router = useRouter();
  const [folders, setFolders] = useState<ProjectFolderResponse[]>([]);
  const [files, setFiles] = useState<FileExplorerItem[]>([]);
  const [selectedArcId, setSelectedArcId] = useState<number | null>(null);
  const [selectedChapterId, setSelectedChapterId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<FileViewMode>('table');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadFolders = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await getProjectFolders(projectId);
      const productionFolders = buildDemoProductionFolders(projectId, result.folders);
      setFolders(productionFolders);
      setFiles((currentFiles) => {
        const storedFiles = window.sessionStorage.getItem(FILES_LOCAL_STORAGE_KEY);
        const localFiles = storedFiles
          ? (JSON.parse(storedFiles) as FileExplorerItem[]).filter(
              (file) =>
                file.folderId && productionFolders.some((folder) => folder.id === file.folderId),
            )
          : currentFiles.filter((file) => file.id <= -1000);
        return [...buildFallbackFiles(productionFolders), ...localFiles];
      });
    } catch {
      setFolders([]);
      setFiles([]);
      setError('Unable to load project folders.');
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    queueMicrotask(() => {
      void loadFolders();
    });
  }, [loadFolders]);

  const visibleFiles = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    const scopedFolderIds = new Set(
      selectedChapterId ? getFolderBranchIds(folders, selectedChapterId) : folders.map((folder) => folder.id),
    );

    return files.filter((file) => {
      const matchesScope = scopedFolderIds.has(file.folderId);
      const matchesSearch =
        !normalizedQuery ||
        [file.title, file.description ?? '', file.category].some((value) =>
          value.toLowerCase().includes(normalizedQuery),
        );

      return matchesScope && matchesSearch;
    });
  }, [files, folders, searchQuery, selectedChapterId]);

  const folderIds = useMemo(() => new Set(folders.map((folder) => folder.id)), [folders]);
  const rootFolders = useMemo(
    () => folders.filter((folder) => !folder.parentId || !folderIds.has(folder.parentId)),
    [folderIds, folders],
  );
  const arcs = useMemo(
    () => rootFolders.filter((folder) => !isProductionAssetRoot(folder.title)),
    [rootFolders],
  );
  const assetRoots = useMemo(
    () => rootFolders.filter((folder) => isProductionAssetRoot(folder.title)),
    [rootFolders],
  );
  const selectedArc = arcs.find((arc) => arc.id === selectedArcId) ?? null;
  const selectedChapter = folders.find((folder) => folder.id === selectedChapterId) ?? null;
  const chapters = useMemo(() => {
    if (!selectedArc) {
      return [];
    }

    const directChildren = folders.filter((folder) => folder.parentId === selectedArc.id);
    return directChildren.length ? directChildren : [selectedArc];
  }, [folders, selectedArc]);
  const chapterFileCounts = useMemo(
    () =>
      folders.reduce<Record<number, number>>((counts, folder) => {
        const branchIds = new Set(getFolderBranchIds(folders, folder.id));
        counts[folder.id] = files.filter((file) => branchIds.has(file.folderId)).length;
        return counts;
      }, {}),
    [files, folders],
  );

  const handleCreateFolder = async (input: {
    description?: string;
    parentId?: number;
    title: string;
  }) => {
    setIsSubmitting(true);
    setError(null);

    try {
      await createProjectFolder(projectId, input);
      setSuccessMessage('Folder created successfully.');
      await loadFolders();
    } catch {
      setError('Unable to create folder.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateFallbackFile = (input: {
    description?: string;
    folderId: number;
    title: string;
  }) => {
    const now = new Date().toISOString();
    const nextLocalId = Math.min(-1000, ...files.map((file) => file.id)) - 1;
    const nextFile: FileExplorerItem = {
      category: 'Production File *',
      createdAt: now,
      createdByLabel: 'Current user *',
      description: input.description ?? null,
      folderId: input.folderId,
      id: nextLocalId,
      isFallback: true,
      previewUrl: undefined,
      status: 'PENDING',
      taskCount: 0,
      title: `${input.title} *`,
      updatedAt: now,
    };

    setFiles((currentFiles) => [...currentFiles, nextFile]);
    const storedFiles = window.sessionStorage.getItem(FILES_LOCAL_STORAGE_KEY);
    const localFiles = storedFiles ? (JSON.parse(storedFiles) as FileExplorerItem[]) : [];
    window.sessionStorage.setItem(FILES_LOCAL_STORAGE_KEY, JSON.stringify([...localFiles, nextFile]));
    setSuccessMessage('File record created in UI fallback mode. *');
  };

  const handleSelectArc = (arcId: number) => {
    setSelectedArcId(arcId);
    setSelectedChapterId(null);
    setSearchQuery('');
  };

  const handleSelectChapter = (chapterId: number) => {
    setSelectedChapterId(chapterId);
    setSearchQuery('');
  };

  const handleBackToArcs = () => {
    setSelectedArcId(null);
    setSelectedChapterId(null);
    setSearchQuery('');
  };

  const handleBackToChapters = () => {
    setSelectedChapterId(null);
    setSearchQuery('');
  };

  return (
    <section className="flex min-h-0 flex-1 flex-col px-5 py-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[24px] font-black leading-8 text-white">Files</h1>
          <p className="mt-1 text-sm font-medium text-[#aeb7c2]">
            Navigate production work by arc, chapter, then the files inside each chapter.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <CreateFolderDialog
            folders={folders}
            isSubmitting={isSubmitting}
            onCreate={handleCreateFolder}
            selectedFolderId={selectedChapterId}
          />
          <CreateFileDialog
            folders={folders}
            onCreateFallback={handleCreateFallbackFile}
            selectedFolderId={selectedChapterId}
          />
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2 text-xs font-bold text-[#8b94a1]">
        <span>Project #{projectId}</span>
        <ChevronRight className="size-3.5" />
        <span className="text-white">Files</span>
        {selectedArc ? (
          <>
            <ChevronRight className="size-3.5" />
            <span className={selectedChapter ? 'text-white' : 'text-[#FFD369]'}>
              {selectedArc.title}
            </span>
          </>
        ) : null}
        {selectedChapter ? (
          <>
            <ChevronRight className="size-3.5" />
            <span className="text-[#FFD369]">{selectedChapter.title}</span>
          </>
        ) : null}
      </div>

      {error ? (
        <p className="mt-4 rounded-[4px] border border-red-400/30 bg-red-950/20 px-4 py-3 text-xs font-bold text-red-300">
          {error}
        </p>
      ) : null}
      {successMessage ? (
        <button
          className="mt-4 rounded-[4px] border border-[#315846] bg-[#14291f] px-4 py-3 text-left text-xs font-bold text-[#9df2c7]"
          onClick={() => setSuccessMessage(null)}
          type="button"
        >
          {successMessage}
        </button>
      ) : null}

      <div className="mt-4 flex items-center justify-between border-y border-[#26303b] bg-[#151c25] px-4 py-2">
        <div className="flex items-center gap-2 text-xs font-bold text-[#aeb7c2]">
          <Database className="size-4 text-[#FFD369]" />
          Folders use live API data. File records, materials, and tasks marked * use UI fallback.
        </div>
        <Badge className="rounded-[3px] border border-[#6c5516] bg-[#30270d] text-[#ffd35b]">
          API-aware MVP
        </Badge>
      </div>

      <div className="mt-4 min-h-[560px] flex-1 overflow-hidden rounded-[5px] border border-[#26303b] bg-[#101820]">
        {isLoading ? (
          <div className="grid h-full min-h-[560px] place-items-center text-sm font-bold text-[#aeb7c2]">
            Loading file workspace...
          </div>
        ) : folders.length ? (
          selectedChapter ? (
            <div className="min-h-[560px] overflow-hidden">
              <div className="min-w-0">
                <div className="flex h-12 items-center gap-3 border-b border-[#26303b] bg-[#0d151e] px-4">
                  <button
                    className="flex h-8 items-center gap-2 rounded-[4px] px-2 text-xs font-black text-[#aeb7c2] hover:bg-[#17202b] hover:text-white"
                    onClick={handleBackToChapters}
                    type="button"
                  >
                    <ChevronLeft className="size-4" />
                    Chapters
                  </button>
                  <span className="h-4 w-px bg-[#303842]" />
                  <p className="truncate text-sm font-black text-white">{selectedChapter.title}</p>
                </div>
                <ChapterWorkspaceHeader
                  fileCount={chapterFileCounts[selectedChapter.id] ?? 0}
                  selectedChapter={selectedChapter}
                />
                <FileCollection
                  files={visibleFiles}
                  onSearchChange={setSearchQuery}
                  onSelectFile={(file) =>
                    router.push(`/studio/projects/${projectId}/files/${file.id}`)
                  }
                  onViewModeChange={setViewMode}
                  searchQuery={searchQuery}
                  selectedFileId={null}
                  viewMode={viewMode}
                />
              </div>
            </div>
          ) : selectedArc ? (
            <ChapterGrid
              chapters={chapters}
              fileCounts={chapterFileCounts}
              onBack={handleBackToArcs}
              onSelectChapter={handleSelectChapter}
              selectedArc={selectedArc}
              selectedArcIndex={arcs.findIndex((arc) => arc.id === selectedArc.id)}
            />
          ) : (
            <ArcGrid
              arcs={arcs}
              assetRoots={assetRoots}
              chapterCounts={Object.fromEntries(
                arcs.map((arc) => [
                  arc.id,
                  folders.filter((folder) => folder.parentId === arc.id).length || 1,
                ]),
              )}
              fileCounts={chapterFileCounts}
              folders={folders}
              onSelectAssetLibrary={handleSelectChapter}
              onSelectArc={handleSelectArc}
            />
          )
        ) : (
          <div className="grid min-h-[560px] place-items-center px-6 text-center">
            <div>
              <FolderOpen className="mx-auto size-9 text-[#5b626d]" />
              <p className="mt-3 text-sm font-black text-white">No project folders yet</p>
              <p className="mt-1 text-xs font-bold text-[#8b94a1]">
                Create the first folder to start organizing production records.
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

type ArcGridProps = {
  arcs: ProjectFolderResponse[];
  assetRoots: ProjectFolderResponse[];
  chapterCounts: Record<number, number>;
  fileCounts: Record<number, number>;
  folders: ProjectFolderResponse[];
  onSelectAssetLibrary: (folderId: number) => void;
  onSelectArc: (arcId: number) => void;
};

function ArcGrid({
  arcs,
  assetRoots,
  chapterCounts,
  fileCounts,
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
        <div className="mt-5 grid grid-cols-[repeat(auto-fill,minmax(230px,1fr))] gap-4">
        {arcs.map((arc, index) => (
          <button
            className="group min-h-[330px] overflow-hidden rounded-[5px] border border-[#303842] bg-[#151c25] text-left shadow-[0_14px_40px_rgba(0,0,0,0.22)] transition-colors hover:border-[#FFD369]/70 hover:bg-[#17202b]"
            key={arc.id}
            onClick={() => onSelectArc(arc.id)}
            type="button"
          >
            <div className="relative h-48 overflow-hidden bg-[#0d151e]">
              <img
                alt=""
                className="h-full w-full object-cover opacity-85 transition-transform duration-300 group-hover:scale-105"
                src={getArcCover(index)}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#101820] via-transparent to-transparent" />
              <div className="absolute bottom-3 left-3 grid size-10 place-items-center rounded-[4px] border border-[#FFD369]/60 bg-[#101820]/85 text-[#FFD369]">
                <Layers3 className="size-5" />
              </div>
            </div>
            <div className="p-4">
              <p className="truncate text-base font-black text-white">{normalizeArcTitle(arc.title)}</p>
              <p className="mt-1 truncate text-xs font-bold text-[#aeb7c2]">
                {getArcSubtitle(arc.title, index)} *
              </p>
              <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[#26303b]">
                <span
                  className="block h-full rounded-full bg-[#FFD369]"
                  style={{ width: `${getArcProgress(index)}%` }}
                />
              </div>
              <p className="mt-2 text-[10px] font-black uppercase tracking-[0.06em] text-[#8b94a1]">
                {getArcProgress(index)}% production *
              </p>
              <div className="mt-4 space-y-2 text-xs font-bold text-[#dce7f3]">
                <MetricLine icon={<BookOpen className="size-3.5" />} label={`${chapterCounts[arc.id]} chapters`} />
                <MetricLine icon={<FileText className="size-3.5" />} label={`${countArcFiles(arc.id, folders, fileCounts)} files`} />
                <MetricLine icon={<ListChecks className="size-3.5" />} label={`${8 + index * 5} tasks *`} />
                <MetricLine icon={<CircleDot className="size-3.5" />} label={`${index + 1} review *`} />
              </div>
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

          <div className="mt-5 grid grid-cols-[repeat(auto-fill,minmax(230px,1fr))] gap-4">
            {assetRoots.map((assetRoot, index) => (
              <button
                className="group min-h-48 overflow-hidden rounded-[5px] border border-[#303842] bg-[#151c25] text-left shadow-[0_14px_40px_rgba(0,0,0,0.18)] transition-colors hover:border-[#FFD369]/70 hover:bg-[#17202b]"
                key={assetRoot.id}
                onClick={() => onSelectAssetLibrary(assetRoot.id)}
                type="button"
              >
                <div className="relative h-28 overflow-hidden bg-[#0d151e]">
                  <img
                    alt=""
                    className="h-full w-full object-cover opacity-80 transition-transform duration-300 group-hover:scale-105"
                    src={getAssetCover(index)}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#101820] via-transparent to-transparent" />
                  <div className="absolute bottom-3 left-3 grid size-9 place-items-center rounded-[4px] border border-[#FFD369]/60 bg-[#101820]/85 text-[#FFD369]">
                    <FolderOpen className="size-4" />
                  </div>
                </div>
                <div className="p-4">
                  <p className="truncate text-base font-black text-white">{assetRoot.title}</p>
                  <p className="mt-1 truncate text-xs font-bold text-[#aeb7c2]">
                    Shared production library *
                  </p>
                  <div className="mt-4 space-y-2 text-xs font-bold text-[#dce7f3]">
                    <MetricLine
                      icon={<FileText className="size-3.5" />}
                      label={`${countArcFiles(assetRoot.id, folders, fileCounts)} files`}
                    />
                    <MetricLine icon={<Layers3 className="size-3.5" />} label="Reusable assets *" />
                  </div>
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
  onBack: () => void;
  onSelectChapter: (chapterId: number) => void;
  selectedArc: ProjectFolderResponse;
  selectedArcIndex: number;
};

function ChapterGrid({
  chapters,
  fileCounts,
  onBack,
  onSelectChapter,
  selectedArc,
  selectedArcIndex,
}: ChapterGridProps) {
  return (
    <section className="min-h-[560px]">
      <div className="relative min-h-[300px] overflow-hidden border-b border-[#26303b]">
        <img
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-70"
          src={getArcCover(Math.max(0, selectedArcIndex))}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#101820] via-[#101820]/85 to-[#101820]/30" />
        <div className="relative flex min-h-[300px] flex-col justify-between p-6">
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
            <h2 className="mt-2 text-4xl font-black leading-tight text-white">
              {normalizeArcTitle(selectedArc.title)}
            </h2>
            <p className="mt-2 text-lg font-bold text-[#dce7f3]">
              {getArcSubtitle(selectedArc.title, Math.max(0, selectedArcIndex))} *
            </p>
            <p className="mt-3 max-w-xl text-sm font-medium leading-6 text-[#aeb7c2]">
              Opening production workspace for this story arc. Review the chapters and choose the
              next chapter to continue manga production. *
            </p>
            <div className="mt-5 flex max-w-md items-center gap-3">
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#26303b]">
                <span
                  className="block h-full rounded-full bg-[#FFD369]"
                  style={{ width: `${getArcProgress(Math.max(0, selectedArcIndex))}%` }}
                />
              </div>
              <span className="text-xs font-black text-white">
                {getArcProgress(Math.max(0, selectedArcIndex))}% Complete *
              </span>
            </div>
            <div className="mt-5 flex flex-wrap gap-4 text-xs font-bold text-[#dce7f3]">
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
          <Badge className="rounded-[3px] border border-[#4a4f55] bg-[#20282b] text-[#dce7f3]">
            {chapters.length} chapters
          </Badge>
        </div>

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
                src={getChapterCover(chapter.id)}
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
      </div>
    </section>
  );
}

function ChapterWorkspaceHeader({
  fileCount,
  selectedChapter,
}: {
  fileCount: number;
  selectedChapter: ProjectFolderResponse;
}) {
  const progress = getChapterProgress(selectedChapter.id);
  const reviewCount = selectedChapter.id % 3;

  return (
    <section className="border-b border-[#26303b] bg-[#101820] px-4 py-4">
      <div className="flex gap-4">
        <div className="relative h-28 w-40 shrink-0 overflow-hidden rounded-[4px] bg-[#0d151e]">
          <img
            alt=""
            className="h-full w-full object-cover opacity-85"
            src={getChapterCover(selectedChapter.id)}
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

function getFolderBranchIds(folders: ProjectFolderResponse[], rootId: number) {
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

function getArcCover(index: number) {
  return arcCovers[index % arcCovers.length];
}

function getChapterCover(id: number) {
  return chapterCovers[Math.abs(id) % chapterCovers.length];
}

function getAssetCover(index: number) {
  return assetCovers[index % assetCovers.length];
}

function normalizeArcTitle(title: string) {
  return title.toLowerCase().includes('arc') ? title : title;
}

function normalizeChapterTitle(title: string) {
  return title.toLowerCase().includes('chapter') ? title : title;
}

function getArcSubtitle(title: string, index: number) {
  const subtitles = ['The Beginning', 'Rising Conflict', 'Final Gate'];
  return title.includes(':') ? title.split(':').slice(1).join(':').trim() : subtitles[index % subtitles.length];
}

function getChapterSubtitle(title: string, id: number) {
  const subtitles = ['The First Battle', 'Crossroad', 'Neon Shadows', 'Quiet Resolve'];
  return title.includes(':') ? title.split(':').slice(1).join(':').trim() : subtitles[Math.abs(id) % subtitles.length];
}

function getArcProgress(index: number) {
  return [72, 46, 28][index % 3];
}

function getChapterProgress(id: number) {
  return [40, 65, 82, 25][Math.abs(id) % 4];
}

function countArcFiles(
  arcId: number,
  folders: ProjectFolderResponse[],
  fileCounts: Record<number, number>,
) {
  const branchIds = getFolderBranchIds(folders, arcId);
  return branchIds.reduce((total, folderId) => total + (fileCounts[folderId] ?? 0), 0);
}

function isProductionAssetRoot(title: string) {
  const normalizedTitle = title.toLowerCase();
  return ['asset', 'reference', 'material', 'character', 'background', 'logo'].some((keyword) =>
    normalizedTitle.includes(keyword),
  );
}
