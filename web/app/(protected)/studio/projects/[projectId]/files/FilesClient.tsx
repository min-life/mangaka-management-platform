'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft,
  ChevronRight,
  Database,
  FolderOpen,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import {
  createProjectFolder,
  getProjectFolders,
  type ProjectFolderResponse,
} from '@/services/project.service';

import { CreateProductionItemDialog } from './CreateProductionItemDialog';
import { FileCollection, type FileViewMode } from './FileCollection';
import { ArcGrid, ChapterGrid, ChapterWorkspaceHeader } from './FileFolderViews';
import {
  getFolderBranchIds,
  isProductionAssetRoot,
  readStoredFolderCovers,
  writeStoredFolderCover,
} from './file-folder-utils';
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
  const [folderCovers, setFolderCovers] = useState<Record<number, string>>({});
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
      setFolderCovers(readStoredFolderCovers(projectId));
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
    coverPreviewUrl?: string;
    description?: string;
    parentId?: number;
    title: string;
  }) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const createdFolder = await createProjectFolder(projectId, input);
      if (input.coverPreviewUrl) {
        writeStoredFolderCover(projectId, createdFolder.id, input.coverPreviewUrl);
        setFolderCovers((current) => ({
          ...current,
          [createdFolder.id]: input.coverPreviewUrl ?? '',
        }));
      }
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
    previewUrl?: string;
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
      previewUrl: input.previewUrl,
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
          <CreateProductionItemDialog
            folders={folders}
            isSubmitting={isSubmitting}
            onCreateFile={handleCreateFallbackFile}
            onCreateFolder={handleCreateFolder}
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
                  folderCovers={folderCovers}
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
              folderCovers={folderCovers}
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
              folderCovers={folderCovers}
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
