'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { useProjectStore, selectProject } from '../../store/project-store';

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

import { useProjectParams } from '@/hooks/useProjectParams';

function FilesSkeleton() {
  return (
    <section className="min-h-[560px] p-5">
      {/* Grid Skeleton */}
      <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-[234px] animate-pulse rounded-[10px] border border-[#2d3848] bg-[#141c27]" />
        ))}
      </div>
    </section>
  );
}

export function FilesClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { slug, numericId: projectId } = useProjectParams();

  // ── Project name from store ────────────────────────────────────────────────
  const { loadProject } = useProjectStore();
  const projectState = useProjectStore(selectProject(projectId));

  useEffect(() => {
    void loadProject(projectId);
  }, [projectId, loadProject]);

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
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [isLoadingChapters, setIsLoadingChapters] = useState(false);

  const loadedFolderIdsRef = React.useRef<Set<number>>(new Set());
  const loadedFileFolderIdsRef = React.useRef<Set<number>>(new Set());

  const { data, setData, error, isInitialLoading, isRefreshing, reload } = useAsyncResource(async () => {
    const result = await getProjectFolders(projectId, { type: 'ARC' });
    const rootFolders = result.folders.map((folder) => ({
      ...normalizeFolder(folder, projectId),
      parentId: null,
    }));

    loadedFolderIdsRef.current.clear();
    loadedFileFolderIdsRef.current.clear();

    return {
      folders: rootFolders as ProjectFolderResponse[],
      files: [] as FileExplorerItem[],
      folderCovers: readStoredFolderCovers(projectId)
    };
  }, [projectId]);

  const folders = data?.folders ?? [];
  const files = data?.files ?? [];
  const projectName = projectState.data?.name ?? '';
  const folderCovers = data?.folderCovers ?? {};

  // Lazy load children folders when an arc is selected
  useEffect(() => {
    if (!selectedArcId || !data) return;
    if (loadedFolderIdsRef.current.has(selectedArcId)) return;

    let isMounted = true;
    setIsLoadingChapters(true);
    getFolderChildren(selectedArcId).then(childResult => {
       if (!isMounted) return;
       const children = childResult.folders.map((child) => ({
         ...normalizeFolder(child, projectId),
         parentId: selectedArcId,
       }));
       
       setData(prev => {
         if (!prev) return prev;
         // Avoid duplicates if multiple requests fire
         const existingIds = new Set(prev.folders.map(f => f.id));
         const newFolders = children.filter(c => !existingIds.has(c.id));
         return {
           ...prev,
           folders: [...prev.folders, ...newFolders]
         };
       });
       loadedFolderIdsRef.current.add(selectedArcId);
    }).catch(console.error).finally(() => {
       if (isMounted) setIsLoadingChapters(false);
    });

    return () => { isMounted = false; };
  }, [selectedArcId, data, projectId, setData]);

  // Lazy load files when a chapter or arc is selected
  useEffect(() => {
    const targetFolderId = selectedChapterId || selectedArcId;
    if (!targetFolderId || !data) return;
    if (loadedFileFolderIdsRef.current.has(targetFolderId)) return;

    let isMounted = true;
    setIsLoadingFiles(true);
    getFolderFiles(targetFolderId).then(folderFiles => {
       if (!isMounted) return;
       const newFiles = folderFiles.files.map((file) => mapApiFileToExplorerItem(file, targetFolderId));
       
       setData(prev => {
         if (!prev) return prev;
         const existingIds = new Set(prev.files.map(f => f.id));
         const filteredNewFiles = newFiles.filter(f => !existingIds.has(f.id));
         return {
           ...prev,
           files: [...prev.files, ...filteredNewFiles]
         };
       });
       loadedFileFolderIdsRef.current.add(targetFolderId);
    }).catch(console.error).finally(() => {
       if (isMounted) setIsLoadingFiles(false);
    });

    return () => { isMounted = false; };
  }, [selectedChapterId, selectedArcId, data, setData]);




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

    const allChapters = folders.filter((folder) => folder.parentId === selectedArc.id);
    const normalizedQuery = searchQuery.trim().toLowerCase();
    
    if (!normalizedQuery) return allChapters;
    
    return allChapters.filter(ch => 
      ch.title.toLowerCase().includes(normalizedQuery) ||
      (ch.description || '').toLowerCase().includes(normalizedQuery)
    );
  }, [folders, selectedArc, searchQuery]);
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
      void reload();
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
    // We set the selected arc and let the useEffect auto-forward to chapter 
    // if it turns out there are no child folders after fetching.
    setSelectedArcId(arcId);
    setSelectedChapterId(null);
    setSearchQuery('');
    updateUrlParams(arcId, null);
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
          <FilesSkeleton />
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
                        const currentUrl = `/studio/projects/${slug}/files${window.location.search}`;
                        router.push(
                          `/studio/projects/${slug}/files/${file.id}?back=${encodeURIComponent(currentUrl)}`
                        );
                      }}
                      onViewModeChange={setViewMode}
                      searchQuery={searchQuery}
                      selectedFileId={null}
                      viewMode={viewMode}
                      isLoading={isLoadingFiles}
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
                    const currentUrl = `/studio/projects/${slug}/files${window.location.search}`;
                    router.push(
                      `/studio/projects/${slug}/files/${file.id}?back=${encodeURIComponent(currentUrl)}`
                    );
                  }}
                  arcViewMode={viewMode}
                  onArcViewModeChange={setViewMode}
                  isLoadingArcFiles={isLoadingFiles}
                  isLoadingChapters={isLoadingChapters}
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
