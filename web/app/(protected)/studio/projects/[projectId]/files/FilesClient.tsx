'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from '@/lib/toast';
import {
  ChevronLeft,
  ChevronRight,
  FolderOpen,
} from 'lucide-react';

import {
  createFolderFile,
  getFolderChildren,
  getFolderFiles,
  getProjectFolders,
  getProjectById,
  type ProjectFolderResponse,
  type ProjectFileResponse,
} from '@/services/project.service';
import { createMaterial } from '@/services/file.service';

import { CreateProductionItemDialog } from './CreateProductionItemDialog';
import { FileCollection, type FileViewMode } from './FileCollection';
import { LoadingState } from '@/components/ui/loading-state';
import { RefreshingIndicator } from '@/components/ui/refreshing-indicator';
import { useAsyncResource } from '@/hooks/useAsyncResource';
import { ArcGrid, ChapterGrid, ChapterWorkspaceHeader } from './FileFolderViews';
import {
  getFolderBranchIds,
  isProductionAssetRoot,
  readStoredFolderCovers,
} from './file-folder-utils';
import {
  type FileExplorerItem,
} from './file-ui';

type FilesClientProps = {
  projectId: number;
};

function normalizeFolder(folder: ProjectFolderResponse, projectId: number): ProjectFolderResponse {
  return {
    ...folder,
    parentId: folder.parentId ?? folder.parent?.id ?? null,
    projectId: folder.projectId ?? projectId,
  };
}

function mapApiFileToExplorerItem(file: ProjectFileResponse, folderId: number): FileExplorerItem {
  return {
    category: 'Production File',
    createdAt: file.createdAt,
    createdByLabel:
      file.createdByUser?.displayName ?? file.createdByUser?.email ?? 'Project member',
    description: file.description,
    folderId: file.folderId ?? file.folder?.id ?? folderId,
    id: file.id,
    status: 'PENDING',
    taskCount: 0,
    title: file.title,
    updatedAt: file.updatedAt,
  };
}

export function FilesClient({ projectId }: FilesClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [selectedArcId, setSelectedArcId] = useState<number | null>(() => {
    const val = searchParams.get('arcId');
    return val ? Number(val) : null;
  });
  const [selectedChapterId, setSelectedChapterId] = useState<number | null>(() => {
    const val = searchParams.get('chapterId');
    return val ? Number(val) : null;
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<FileViewMode>('table');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data, setData, error, isInitialLoading, isRefreshing, reload } = useAsyncResource(async () => {
    let projName = '';
    try {
      const proj = await getProjectById(projectId);
      projName = proj.name;
    } catch { }

    const result = await getProjectFolders(projectId, { type: 'ARC' });
    const rootFolders = result.folders.map((folder) => ({
      ...normalizeFolder(folder, projectId),
      parentId: null,
    }));
    const childFolderGroups = await Promise.all(
      rootFolders.map(async (folder) => {
        try {
          const childResult = await getFolderChildren(folder.id);
          return childResult.folders.map((child) => ({
            ...normalizeFolder(child, projectId),
            parentId: folder.id,
          }));
        } catch {
          return [];
        }
      }),
    );
    const apiFolders = [...rootFolders, ...childFolderGroups.flat()];
    const apiFilesByFolder = await Promise.all(
      apiFolders.map(async (folder) => {
        try {
          const folderFiles = await getFolderFiles(folder.id);
          return folderFiles.files.map((file) => mapApiFileToExplorerItem(file, folder.id));
        } catch {
          return [];
        }
      }),
    );
    const apiFiles = apiFilesByFolder.flat();

    return {
      projectName: projName,
      folders: apiFolders,
      files: apiFiles,
      folderCovers: readStoredFolderCovers(projectId)
    };
  }, [projectId]);

  const folders = data?.folders ?? [];
  const files = data?.files ?? [];
  const projectName = data?.projectName ?? '';
  const folderCovers = data?.folderCovers ?? {};

  useEffect(() => {
    if (selectedArcId && !selectedChapterId && folders.length > 0) {
      const hasChapters = folders.some((folder) => folder.parentId === selectedArcId);
      if (!hasChapters) {
        setSelectedChapterId(selectedArcId);
        updateUrlParams(selectedArcId, selectedArcId);
      }
    }
  }, [selectedArcId, selectedChapterId, folders]);


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

    return folders.filter((folder) => folder.parentId === selectedArc.id);
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

  const arcDirectFiles = useMemo(() => {
    if (!selectedArc) return [];
    return files.filter((f) => f.folderId === selectedArc.id);
  }, [files, selectedArc]);

  const visibleArcFiles = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    return arcDirectFiles.filter((file) => {
      if (!normalizedQuery) return true;
      return [file.title, file.description ?? '', file.category].some((value) =>
        value.toLowerCase().includes(normalizedQuery),
      );
    });
  }, [arcDirectFiles, searchQuery]);


  const handleCreateFile = async (input: {
    description?: string;
    folderId: number;
    imageFile?: File;
    textFile?: File;
    sourceFile?: File;
    title: string;
  }) => {
    setIsSubmitting(true);

    try {
      const rawResponse = await createFolderFile(input.folderId, {
        description: input.description,
        title: input.title,
      });

      // Backend trả về { data: { id, ... } } hoặc trực tiếp { id, ... }
      const createdFile = (rawResponse as any)?.data ?? rawResponse;
      const fileId: number = createdFile?.id;

      if (!fileId) {
        throw new Error('Không lấy được ID của file vừa tạo.');
      }

      const hasFiles = input.imageFile || input.textFile || input.sourceFile;
      if (hasFiles) {
        const formData = new FormData();
        const firstName = (input.imageFile ?? input.textFile ?? input.sourceFile)!.name;
        formData.append('name', firstName.replace(/\.[^/.]+$/, ''));

        if (input.imageFile) formData.append('image', input.imageFile);
        if (input.textFile) formData.append('text', input.textFile);
        if (input.sourceFile) formData.append('source', input.sourceFile);

        await createMaterial(fileId, formData);
      }

      toast.success(hasFiles ? 'File created with initial material.' : 'File created.');
      await reload();
    } catch {
      toast.error('Failed to create file. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateUrlParams = (arc: number | null, chap: number | null) => {
    const params = new URLSearchParams(window.location.search);
    if (arc !== null) {
      params.set('arcId', String(arc));
    } else {
      params.delete('arcId');
    }
    if (chap !== null) {
      params.set('chapterId', String(chap));
    } else {
      params.delete('chapterId');
    }
    const newSearch = params.toString();
    const newUrl = `${window.location.pathname}${newSearch ? `?${newSearch}` : ''}`;
    window.history.replaceState(null, '', newUrl);
  };

  const handleSelectArc = (arcId: number) => {
    const hasChapters = folders.some((folder) => folder.parentId === arcId);
    if (!hasChapters) {
      setSelectedArcId(arcId);
      setSelectedChapterId(arcId);
      setSearchQuery('');
      updateUrlParams(arcId, arcId);
    } else {
      setSelectedArcId(arcId);
      setSelectedChapterId(null);
      setSearchQuery('');
      updateUrlParams(arcId, null);
    }
  };

  const handleSelectChapter = (chapterId: number) => {
    setSelectedChapterId(chapterId);
    setSearchQuery('');
    updateUrlParams(selectedArcId, chapterId);
  };

  const handleBackToArcs = () => {
    setSelectedArcId(null);
    setSelectedChapterId(null);
    setSearchQuery('');
    updateUrlParams(null, null);
  };

  const handleBackToChapters = () => {
    const hasChapters = folders.some((folder) => folder.parentId === selectedArcId);
    if (!hasChapters) {
      handleBackToArcs();
    } else {
      setSelectedChapterId(null);
      setSearchQuery('');
      updateUrlParams(selectedArcId, null);
    }
  };

  return (
    <section className="flex min-h-0 flex-1 flex-col px-5 py-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-[24px] font-black leading-8 text-white">Resources</h1>
            <RefreshingIndicator isRefreshing={isRefreshing} />
          </div>
          <p className="mt-1 text-sm font-medium text-[#aeb7c2]">
            Navigate production work by arc, chapter, then the files inside each chapter.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <CreateProductionItemDialog
            folders={folders}
            isSubmitting={isSubmitting}
            onCreateFile={handleCreateFile}
            selectedFolderId={selectedChapterId}
          />
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2 text-xs font-bold text-[#8b94a1]">
        {isInitialLoading && !projectName ? (
          <div className="h-4 w-24 animate-pulse rounded bg-[#26303b]" />
        ) : (
          <span>{projectName || `Project #${projectId}`}</span>
        )}
        <ChevronRight className="size-3.5" />
        {selectedArc || selectedChapter ? (
          <button onClick={handleBackToArcs} className="text-[#aeb7c2] hover:text-white transition-colors">
            Resources
          </button>
        ) : (
          <span className="text-white">Resources</span>
        )}
        
        {selectedArc ? (
          <>
            <ChevronRight className="size-3.5" />
            {selectedChapter && selectedChapter.id !== selectedArc.id ? (
              <button onClick={handleBackToChapters} className="text-[#aeb7c2] hover:text-white transition-colors">
                {selectedArc.title}
              </button>
            ) : (
              <span className="text-[#FFD369]">{selectedArc.title}</span>
            )}
          </>
        ) : null}
        
        {selectedChapter && selectedChapter.id !== selectedArc?.id ? (
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


      <div className="mt-4 min-h-[560px] flex-1 overflow-hidden rounded-[5px] border border-[#26303b] bg-[#101820]">
        {isInitialLoading ? (
          <LoadingState message="Loading file workspace..." minHeight="560px" />
        ) : (
          <div className={`transition-opacity duration-200 ${isRefreshing ? 'opacity-50 pointer-events-none' : ''}`}>
            {folders.length ? (
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
                      onSelectFile={(file) => {
                        const currentUrl = `/studio/projects/${projectId}/files${window.location.search}`;
                        router.push(
                          `/studio/projects/${projectId}/files/${file.id}?back=${encodeURIComponent(currentUrl)}`
                        );
                      }}
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
                  arcFiles={visibleArcFiles}
                  arcSearchQuery={searchQuery}
                  onArcSearchChange={setSearchQuery}
                  onSelectFile={(file) => {
                    const currentUrl = `/studio/projects/${projectId}/files${window.location.search}`;
                    router.push(
                      `/studio/projects/${projectId}/files/${file.id}?back=${encodeURIComponent(currentUrl)}`
                    );
                  }}
                  arcViewMode={viewMode}
                  onArcViewModeChange={setViewMode}
                />
              ) : (
                <ArcGrid
                  arcs={arcs}
                  assetRoots={assetRoots}
                  chapterCounts={Object.fromEntries(
                    arcs.map((arc) => [
                      arc.id,
                      folders.filter((folder) => folder.parentId === arc.id).length,
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
        )}
      </div>
    </section>
  );
}
