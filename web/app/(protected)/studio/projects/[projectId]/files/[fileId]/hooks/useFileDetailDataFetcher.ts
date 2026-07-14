import { useState, useEffect, useCallback, useRef } from 'react';
import { getProjectFolders, getProjectMembers, getProjectById, type ProjectFolderResponse, type ProjectResponse } from '@/services/project.service';
import { parseDecimal } from '@/lib/utils';
import { getFileById, getFileComments, getFileMaterials, getFileTasks } from '@/services/file.service';
import { getTaskComments, getTaskMaterials } from '@/services/task.service';
import { getFrameComments, getFrameById } from '@/services/frame.service';
import { getMaterialById, getMaterialFrames } from '@/services/material.service';
import {
  formatFileDate,
  type FileTaskItem,
  type FileTaskRegion,
  type FileVersionItem,
  type SubmissionFrameComment,
  type FileExplorerItem,
} from '../../file-ui';
import {
  buildStableMaterialVersions,
  getCommentText,
  type FileMaterialVersionRecord,
  type FileDiscussionComment,
} from '../file-detail-types';

type UseFileDetailDataFetcherProps = {
  projectId: number;
  fileId: number;
  selectedTaskId: string | null;
};

export function useFileDetailDataFetcher({ projectId, fileId, selectedTaskId }: UseFileDetailDataFetcherProps) {
  const [data, setData] = useState<{
    project: any;
    folders: ProjectFolderResponse[];
    members: { id: number; name: string }[];
    file: FileExplorerItem | null;
    versions: FileVersionItem[];
    tasks: FileTaskItem[];
    comments: FileDiscussionComment[];
    frameComments: SubmissionFrameComment[];
    latestMaterialVersion: FileVersionItem | null;
  } | null>(null);

  const [commentPagination, setCommentPagination] = useState<{ page: number; totalPages: number }>({ page: 1, totalPages: 1 });
  const [isLoadingMoreComments, setIsLoadingMoreComments] = useState(false);
  const hasMoreComments = commentPagination.page < commentPagination.totalPages;

  // Track whether deferred sections have been loaded
  const [versionsLoaded, setVersionsLoaded] = useState(false);
  const [commentsLoaded, setCommentsLoaded] = useState(false);
  const [isLoadingVersions, setIsLoadingVersions] = useState(false);
  const [isLoadingComments, setIsLoadingComments] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // A stable flag to detect if the FIRST load ever finished
  const [hasLoaded, setHasLoaded] = useState(false);
  const activeLoadRef = useRef<number>(0);
  const reloadTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingResolvesRef = useRef<(() => void)[]>([]);

  // ─────────────────────────────────────────────────────────────────────────────
  // FAST initial load: project + file + tasks only (no materials, no comments)
  // ─────────────────────────────────────────────────────────────────────────────
  const loadData = useCallback(async (isRefresh = false, quiet = false, signal?: AbortSignal) => {
    const currentLoadId = ++activeLoadRef.current;

    if (!quiet) {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsInitialLoading(true);
      }
    }
    setError(null);

    try {
      // 1. Fetch Project Data
      let projData = null;
      try {
        projData = await getProjectById(projectId);
      } catch (err) {
        console.error('Failed to load project details:', err);
      }
      if (signal?.aborted || currentLoadId !== activeLoadRef.current) return;

      const folderResult = await getProjectFolders(projectId);
      const productionFolders = folderResult.folders;
      if (signal?.aborted || currentLoadId !== activeLoadRef.current) return;

      let apiMembers: { id: number; name: string }[] = [];
      try {
        const membersRes = await getProjectMembers(projectId);
        apiMembers = (membersRes.members || []).map((m) => ({
          id: m.id,
          name: m.displayName || m.email,
        }));
      } catch (err) {
        console.error('Failed to load project members:', err);
      }
      if (signal?.aborted || currentLoadId !== activeLoadRef.current) return;

      if (isNaN(Number(fileId)) || fileId < 0) {
        throw new Error('File was not found in the current project workspace.');
      }

      // 2. Fetch File Data (has previewUrl for canvas — no need to call materials yet)
      const response = await getFileById(fileId);
      if (signal?.aborted || currentLoadId !== activeLoadRef.current) return;

      const createdByLabel =
        response.createdByUser?.displayName ||
        response.createdByUser?.email ||
        (response.createdBy ? `User #${response.createdBy}` : 'Unknown user');

      // 3. Fetch Tasks only (materials fetched lazily when Versions tab is opened)
      let dbTasks: FileTaskItem[] = [];
      try {
        const tasksRes = await getFileTasks(fileId);
        if (signal?.aborted || currentLoadId !== activeLoadRef.current) return;

        const tasksWithFramesPromises = (tasksRes || []).map(async (t: any) => {
          let region: FileTaskRegion | undefined = undefined;

          const versionMatch = t.description?.match(/\[version:(v\d+)\]/);
          let taskVersion = versionMatch ? versionMatch[1] : undefined;

          const rawDesc = t.description || '';
          const submissions: any[] = [];
          const submissionRegex = /\[Note:\s*([\s\S]*?)\](?:\s*\[version:(v\d+)\])?/g;
          let match;

          while ((match = submissionRegex.exec(rawDesc)) !== null) {
            const note = match[1].trim();
            const versionTag = match[2];
            submissions.push({
              id: `sub_${Date.now()}_${Math.random()}`,
              status: 'PENDING_REVIEW',
              note,
              assetName: 'submission.png',
              previewUrl: undefined,
              createdAt: new Date().toISOString(),
              targetVersion: versionTag,
            });
          }

          return {
            assignedTo: t.assignedByUser?.displayName || t.assignedByUser?.email || 'Unassigned',
            assignedToUserId: t.assignedBy,
            assignedByUserId: t.createdBy,
            description: rawDesc.replace(/\[Note:\s*([\s\S]*?)\](?:\s*\[version:(v\d+)\])?/g, '').replace(/\s*\[version:v\d+\]/g, '').trim() || 'No description.',
            dueDate: t.deadline ? formatFileDate(t.deadline) : '',
            id: String(t.id),
            priority: 'MEDIUM',
            status: t.status,
            title: t.title,
            region,
            updatedAt: t.updatedAt,
            targetVersion: taskVersion,
            submissions,
            isMine: t.isMine,
          } as FileTaskItem;
        });

        dbTasks = await Promise.all(tasksWithFramesPromises);
        if (signal?.aborted || currentLoadId !== activeLoadRef.current) return;

        dbTasks.sort((a, b) => {
          if (a.status !== b.status) {
            const getPriority = (status: string) => {
              switch (status.toLowerCase()) {
                case 'in_review': return 1;
                case 'pending': return 2;
                case 'done': return 3;
                default: return 4;
              }
            };
            return getPriority(a.status) - getPriority(b.status);
          }
          const da = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
          const db = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
          return db - da;
        });
      } catch (err) {
        console.error('Failed to load file tasks:', err);
      }

      if (signal?.aborted || currentLoadId !== activeLoadRef.current) return;

      // Extract preview URL from the latestMaterial returned by GET /file/:id
      const latestMaterial = (response as any).latestMaterial;
      const latestMaterials: any[] = latestMaterial?.materials ?? [];
      const latestThumbnail =
        latestMaterials.find((m: any) => m.isThumbnail) ||
        latestMaterials.find((m: any) =>
          m.type === 'IMAGE' ||
          m.originalName?.match(/\.(png|jpe?g)$/i) ||
          m.name?.match(/\.(png|jpe?g)$/i)
        );
      const latestPreviewUrl = latestThumbnail?.downloadUrl || latestThumbnail?.url || (response as any).previewUrl || '';

      // Build a synthetic version from latestMaterial for the sidebar
      let latestMaterialVersion: FileVersionItem | null = null;
      if (latestMaterial) {
        const mats: any[] = latestMaterial.materials ?? [];
        const thumb = mats.find((m: any) => m.isThumbnail) ||
          mats.find((m: any) => m.type === 'IMAGE' || m.originalName?.match(/\.(png|jpe?g)$/i) || m.name?.match(/\.(png|jpe?g)$/i));
        latestMaterialVersion = {
          id: String(latestMaterial.id),
          note: latestMaterial.name || 'Latest',
          author: latestMaterial.createdByUser?.displayName || latestMaterial.createdByUser?.email || '',
          createdAt: latestMaterial.createdAt ? formatFileDate(latestMaterial.createdAt) : '',
          isCurrent: true,
          version: 1,
          materials: mats,
          previewUrl: thumb?.downloadUrl || thumb?.url || undefined,
        } as FileVersionItem;
      }

      const result = {
        project: projData,
        folders: productionFolders,
        members: apiMembers,
        file: ({
          id: String(response.id),
          title: response.title,
          updatedAt: response.updatedAt ? formatFileDate(response.updatedAt) : '',
          updatedBy: response.updatedByUser?.displayName || response.updatedByUser?.email || 'Unknown',
          previewUrl: latestPreviewUrl,
          isFolder: false,
          createdBy: createdByLabel,
          createdAt: response.createdAt ? formatFileDate(response.createdAt) : '',
          status: (response as any).status || 'DRAFT',
          folderId: (response as any).folder?.id,
        } as unknown) as FileExplorerItem,
        // Versions & comments start empty — loaded lazily on demand
        versions: [],
        tasks: dbTasks,
        comments: [],
        frameComments: [],
        latestMaterialVersion,
      };

      setData(result);
      setHasLoaded(true);
      // Reset deferred flags on full reload so they can be triggered again
      if (!isRefresh) {
        setVersionsLoaded(false);
        setCommentsLoaded(false);
      }
    } catch (err: any) {
      if (signal?.aborted || currentLoadId !== activeLoadRef.current) return;
      if (!hasLoaded) {
        setError(err?.message || 'Failed to load resource');
      }
      throw err;
    } finally {
      if (!signal?.aborted && currentLoadId === activeLoadRef.current) {
        setIsInitialLoading(false);
        setIsRefreshing(false);
      }
    }
  }, [projectId, fileId, selectedTaskId, hasLoaded]);

  // ─────────────────────────────────────────────────────────────────────────────
  // DEFERRED: load versions/materials (triggered when Versions tab is opened)
  // ─────────────────────────────────────────────────────────────────────────────
  const loadVersions = useCallback(async () => {
    if (versionsLoaded || isLoadingVersions) return;
    setIsLoadingVersions(true);
    try {
      let dbVersions: FileVersionItem[] = [];

      const materialsRes = await getFileMaterials(fileId);
      let versionsArray = (materialsRes || []) as FileMaterialVersionRecord[];
      if (!Array.isArray(versionsArray) && (materialsRes as any).data) {
        versionsArray = (materialsRes as any).data;
      }
      dbVersions = buildStableMaterialVersions(versionsArray);

      if (selectedTaskId) {
        const taskIdNum = Number(selectedTaskId);
        if (!isNaN(taskIdNum) && taskIdNum > 0) {
          const taskMaterials = await getTaskMaterials(selectedTaskId);

          const rawList: any[] = Array.isArray(taskMaterials)
            ? taskMaterials
            : (taskMaterials?.data ?? (taskMaterials ?? []));

          const isFileName = (name: string) => /\.[a-zA-Z0-9]+$/.test(name);
          const sortedMaterials = [...rawList].sort(
            (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
          const newestId = sortedMaterials.at(-1)?.id;

          const taskVersions = sortedMaterials
            .map((m: any, index: number) => {
              const thumbnail = m.materials?.find((item: any) => item.isThumbnail) ||
                m.materials?.find((item: any) => item.type === 'IMAGE' || item.originalName?.match(/\.(png|jpe?g)$/i) || item.name?.match(/\.(png|jpe?g)$/i));
              return {
                id: String(m.id),
                note: (m.name && !isFileName(m.name)) ? m.name : `Material v${index + 1}`,
                author: m.createdByUser?.displayName || m.createdByUser?.email || '',
                createdAt: m.createdAt ? formatFileDate(m.createdAt) : '',
                isCurrent: m.id === newestId,
                version: index + 1,
                materials: m.materials || [],
                previewUrl: thumbnail?.downloadUrl || thumbnail?.url || undefined,
                taskId: Number(selectedTaskId),
              } as FileVersionItem;
            })
            .reverse();

          dbVersions = [...dbVersions, ...taskVersions];
        }
      }

      setData(prev => prev ? { ...prev, versions: dbVersions } : prev);
      setVersionsLoaded(true);
    } catch (err) {
      console.error('Failed to load version history:', err);
    } finally {
      setIsLoadingVersions(false);
    }
  }, [fileId, selectedTaskId, versionsLoaded, isLoadingVersions]);

  // ─────────────────────────────────────────────────────────────────────────────
  // DEFERRED: load comments (triggered when Discussion tab is opened)
  // ─────────────────────────────────────────────────────────────────────────────
  const loadComments = useCallback(async () => {
    if (commentsLoaded || isLoadingComments) return;
    setIsLoadingComments(true);
    try {
      const commentsRes = selectedTaskId
        ? await getTaskComments(selectedTaskId, 1, 20)
        : await getFileComments(fileId, 1, 20);

      const rawComments = (commentsRes as any)?.data ?? commentsRes ?? [];
      const rawPagination = (commentsRes as any)?.pagination;
      if (rawPagination) {
        setCommentPagination({ page: rawPagination.page, totalPages: rawPagination.totalPages });
      }

      const dbComments: FileDiscussionComment[] = [];
      const dbTaskComments: SubmissionFrameComment[] = [];

      for (const c of rawComments as any[]) {
        if (c.frame && c.material) {
          dbTaskComments.push({
            id: String(c.id),
            content: getCommentText(c.content),
            frameId: String(c.frame.id),
            frameName: c.frame.name,
            materialId: String(c.material.id),
            materialName: c.material.name,
            author: c.createdByUser?.displayName || c.createdByUser?.email || `User #${c.createdByUser?.id || c.createdBy || c.userId}`,
            time: c.createdAt ? formatFileDate(c.createdAt) : '',
            timestamp: c.createdAt ? new Date(c.createdAt).getTime() : 0,
            taskId: selectedTaskId || undefined,
          });
        } else {
          dbComments.push({
            id: String(c.id),
            content: getCommentText(c.content),
            author: c.createdByUser?.displayName || c.createdByUser?.email || `User #${c.createdByUser?.id || c.createdBy || c.userId}`,
            time: c.createdAt ? formatFileDate(c.createdAt) : '',
            timestamp: c.createdAt ? new Date(c.createdAt).getTime() : 0,
          });
        }
      }

      setData(prev => prev ? { ...prev, comments: dbComments, frameComments: dbTaskComments } : prev);
      setCommentsLoaded(true);
    } catch (err) {
      console.error('Failed to load comments:', err);
    } finally {
      setIsLoadingComments(false);
    }
  }, [fileId, selectedTaskId, commentsLoaded, isLoadingComments]);

  useEffect(() => {
    const controller = new AbortController();
    setHasLoaded(false);
    setData(null);
    setVersionsLoaded(false);
    setCommentsLoaded(false);
    void loadData(false, false, controller.signal).catch(() => { });
    return () => controller.abort();
  }, [projectId, fileId]);

  useEffect(() => {
    if (hasLoaded) {
      const controller = new AbortController();
      void loadData(true, false, controller.signal).catch(() => { });
      return () => controller.abort();
    }
  }, [selectedTaskId]);

  return {
    data,
    setData,
    error,
    setError,
    isInitialLoading,
    isRefreshing,
    isLoadingVersions,
    isLoadingComments,
    versionsLoaded,
    commentsLoaded,
    loadVersions,
    loadComments,
    reload: useCallback(() => {
      return new Promise<void>((resolve) => {
        pendingResolvesRef.current.push(resolve);
        if (reloadTimeoutRef.current) clearTimeout(reloadTimeoutRef.current);
        reloadTimeoutRef.current = setTimeout(() => {
          const resolves = [...pendingResolvesRef.current];
          pendingResolvesRef.current = [];
          loadData(true, false).finally(() => {
            resolves.forEach(r => r());
          });
        }, 100);
      });
    }, [loadData]),
    quietReload: useCallback(() => {
      return new Promise<void>((resolve) => {
        pendingResolvesRef.current.push(resolve);
        if (reloadTimeoutRef.current) clearTimeout(reloadTimeoutRef.current);
        reloadTimeoutRef.current = setTimeout(() => {
          const resolves = [...pendingResolvesRef.current];
          pendingResolvesRef.current = [];
          loadData(true, true).finally(() => {
            resolves.forEach(r => r());
          });
        }, 100);
      });
    }, [loadData]),
    refreshFrameComments: useCallback(async (frameId: number) => {
      try {
        const commentsRes = await getFrameComments(frameId);
        setData((currentData) => {
          if (!currentData) return currentData;
          const existing = currentData.frameComments.find((c) => c.frameId === String(frameId));
          if (!existing) {
            // New frame: we need to fetch its details so we can place its comments correctly
            getFrameById(frameId).then((frameDetails: any) => {
              if (!frameDetails) return;
              setData((latestData) => {
                if (!latestData) return latestData;

                // Find material to get its taskId
                const materialObj = latestData.versions.find(v => String(v.id) === String(frameDetails.materialId));

                const newComments = commentsRes.map((c: any) => ({
                  id: String(c.id),
                  author: c.createdByUser?.displayName || c.createdByUser?.email || `User #${c.createdByUser?.id || c.userId}`,
                  content: getCommentText(c.content),
                  time: c.createdAt ? formatFileDate(c.createdAt) : '',
                  timestamp: c.createdAt ? new Date(c.createdAt).getTime() : 0,
                  region: {
                    startX: parseDecimal(frameDetails.startX),
                    startY: parseDecimal(frameDetails.startY),
                    endX: parseDecimal(frameDetails.endX),
                    endY: parseDecimal(frameDetails.endY),
                  },
                  taskId: materialObj?.taskId ? String(materialObj.taskId) : undefined,
                  targetVersion: undefined,
                  frameId: String(frameId),
                  materialId: String(frameDetails.materialId),
                  materialName: (materialObj as any)?.name || undefined,
                } as SubmissionFrameComment));

                const otherComments = latestData.frameComments.filter((c) => c.frameId !== String(frameId));
                return {
                  ...latestData,
                  frameComments: [...otherComments, ...newComments],
                };
              });
            }).catch((err) => {
              console.error('Failed to get frame details', err);
              if (reloadTimeoutRef.current) clearTimeout(reloadTimeoutRef.current);
              reloadTimeoutRef.current = setTimeout(() => {
                loadData(true, true).catch(() => { });
              }, 100);
            });
            return currentData;
          }

          const newComments = commentsRes.map((c: any) => ({
            id: String(c.id),
            author: c.createdByUser?.displayName || c.createdByUser?.email || `User #${c.createdByUser?.id || c.userId}`,
            content: getCommentText(c.content),
            time: c.createdAt ? formatFileDate(c.createdAt) : '',
            timestamp: c.createdAt ? new Date(c.createdAt).getTime() : 0,
            region: existing.region,
            taskId: existing.taskId,
            targetVersion: undefined,
            frameId: String(frameId),
            materialId: existing.materialId,
            materialName: existing.materialName,
          } as SubmissionFrameComment));

          const otherComments = currentData.frameComments.filter((c) => c.frameId !== String(frameId));
          return {
            ...currentData,
            frameComments: [...otherComments, ...newComments],
          };
        });
      } catch (err) {
        console.error('Failed to refresh frame comments', err);
      }
    }, [loadData, setData]),
    hasMoreComments,
    isLoadingMoreComments,
    loadMoreComments: useCallback(async () => {
      if (!hasMoreComments || isLoadingMoreComments) return;
      const nextPage = commentPagination.page + 1;
      setIsLoadingMoreComments(true);
      try {
        const commentsRes = selectedTaskId
          ? await getTaskComments(selectedTaskId, nextPage, 20)
          : await getFileComments(fileId, nextPage, 20);
        const rawComments = (commentsRes as any)?.data ?? commentsRes ?? [];
        const rawPagination = (commentsRes as any)?.pagination;
        if (rawPagination) {
          setCommentPagination({ page: rawPagination.page, totalPages: rawPagination.totalPages });
        }
        const newComments: FileDiscussionComment[] = [];
        for (const c of rawComments as any[]) {
          if (!(c.frame && c.material)) {
            newComments.push({
              id: String(c.id),
              content: getCommentText(c.content),
              author: c.createdByUser?.displayName || c.createdByUser?.email || `User #${c.createdByUser?.id || c.createdBy}`,
              time: c.createdAt ? formatFileDate(c.createdAt) : '',
              timestamp: c.createdAt ? new Date(c.createdAt).getTime() : 0,
            });
          }
        }
        setData(prev => {
          if (!prev) return prev;
          const existingIds = new Set(prev.comments.map(c => c.id));
          const unique = newComments.filter(c => !existingIds.has(c.id));
          return { ...prev, comments: [...prev.comments, ...unique] };
        });
      } catch (err) {
        console.error('Failed to load more comments', err);
      } finally {
        setIsLoadingMoreComments(false);
      }
    }, [hasMoreComments, isLoadingMoreComments, commentPagination.page, selectedTaskId, fileId]),
  };
}
