'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from '@/lib/toast';
import {
  ChevronLeft,
  ChevronRight,
  Database,
  FolderOpen,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
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

  const loadFolders = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
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
      const productionFolders = apiFolders;
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

      setFolders(productionFolders);
      setFolderCovers(readStoredFolderCovers(projectId));
      setFiles(apiFiles);
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

  const handleCreateFile = async (input: {
    assetFile?: File;
    description?: string;
    folderId: number;
    previewUrl?: string;
    title: string;
  }) => {
    setIsSubmitting(true);

    try {
      const createdFile = await createFolderFile(input.folderId, {
        description: input.description,
        title: input.title,
      });

      if (input.assetFile) {
        const formData = new FormData();
        formData.append('name', input.assetFile.name.replace(/\.[^/.]+$/, ''));

        if (input.assetFile.type.startsWith('image/')) {
          formData.append('image', input.assetFile);
        } else if (
          input.assetFile.type.startsWith('text/') ||
          input.assetFile.type === 'application/pdf' ||
          /\.(txt|doc|docx)$/i.test(input.assetFile.name)
        ) {
          formData.append('text', input.assetFile);
        } else {
          formData.append('source', input.assetFile);
        }

        await createMaterial(createdFile.id, formData);
      }

      if (input.previewUrl) {
        setFiles((currentFiles) =>
          currentFiles.map((file) =>
            file.id === createdFile.id ? { ...file, previewUrl: input.previewUrl } : file,
          ),
        );
      }

      toast.success(input.assetFile ? 'File created with initial material.' : 'File created.');
      await loadFolders();
    } catch {
      toast.error('Failed to create file. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
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
            onCreateFile={handleCreateFile}
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


      <div className="mt-4 flex items-center justify-between border-y border-[#26303b] bg-[#151c25] px-4 py-2">
        <div className="flex items-center gap-2 text-xs font-bold text-[#aeb7c2]">
          <Database className="size-4 text-[#FFD369]" />
          Folders and files use live API data.
        </div>
        <Badge className="rounded-[3px] border border-[#6c5516] bg-[#30270d] text-[#ffd35b]">
          Production Ready
        </Badge>
      </div>

      <div className="mt-4 min-h-[560px] flex-1 overflow-hidden rounded-[5px] border border-[#26303b] bg-[#101820]">
        {isLoading ? (
          <LoadingState message="Loading file workspace..." />
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
