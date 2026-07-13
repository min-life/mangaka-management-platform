import { useState, useEffect, useCallback, useRef } from 'react';
import { getProjectFolders, getProjectMembers, getProjectById, type ProjectFolderResponse, type ProjectResponse } from '@/services/project.service';
import { parseDecimal } from '@/lib/utils';
import { getFileById, getFileComments, getFileMaterials, getFileTasks } from '@/services/file.service';
import { getTaskFrames, getTaskComments, getTaskMaterials } from '@/services/task.service';
import { getFrameComments, getFrameById } from '@/services/frame.service';
import { getMaterialById, getMaterialFrames } from '@/services/material.service';
import pLimit from 'p-limit';
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
  } | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // A stable flag to detect if the FIRST load ever finished
  const [hasLoaded, setHasLoaded] = useState(false);
  const activeLoadRef = useRef<number>(0);
  const reloadTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingResolvesRef = useRef<(() => void)[]>([]);

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

      // 2. Fetch File Data
      const response = await getFileById(fileId);
      if (signal?.aborted || currentLoadId !== activeLoadRef.current) return;

      const createdByLabel =
        response.createdByUser?.displayName ||
        response.createdByUser?.email ||
        (response.createdBy ? `User #${response.createdBy}` : 'Unknown user');

      // 3. Fetch Versions/Materials
      let dbVersions: FileVersionItem[] = [];
      try {
        const materialsRes = await getFileMaterials(fileId);
        let versionsArray = (materialsRes || []) as FileMaterialVersionRecord[];
        
        // Strip data wrappers if they exist
        if (!Array.isArray(versionsArray) && (materialsRes as any).data) {
          versionsArray = (materialsRes as any).data;
        }

        if (signal?.aborted || currentLoadId !== activeLoadRef.current) return;
        dbVersions = buildStableMaterialVersions(versionsArray);

        // Fetch Task Materials if a task is selected
        if (selectedTaskId) {
          const taskIdNum = Number(selectedTaskId);
          if (!isNaN(taskIdNum) && taskIdNum > 0) {
            const taskMaterials = await getTaskMaterials(selectedTaskId);
            if (signal?.aborted || currentLoadId !== activeLoadRef.current) return;

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
      } catch (err) {
        console.error('Failed to load version history:', err);
      }

      // 4. Fetch Tasks
      let dbTasks: FileTaskItem[] = [];
      try {
        const tasksRes = await getFileTasks(fileId);
        if (signal?.aborted || currentLoadId !== activeLoadRef.current) return;

        const tasksWithFramesPromises = (tasksRes || []).map(async (t: any) => {
          let region: FileTaskRegion | undefined = undefined;
          try {
            const frames = await getTaskFrames(t.id);
            const taskFrame = frames[frames.length - 1];
            if (taskFrame) {
              region = {
                endX: parseDecimal(taskFrame.endX),
                endY: parseDecimal(taskFrame.endY),
                startX: parseDecimal(taskFrame.startX),
                startY: parseDecimal(taskFrame.startY),
              };
            }
          } catch (frameErr) {
            console.error(`Failed to load frames for task ${t.id}:`, frameErr);
          }

          const versionMatch = t.description?.match(/\[version:(v\d+)\]/);
          let taskVersion = versionMatch ? versionMatch[1] : undefined;

          if (!taskVersion && dbVersions.length > 0 && t.createdAt) {
            const sorted = [...dbVersions].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
            const taskTime = new Date(t.createdAt).getTime();
            let matchedVer = sorted[0];
            for (const v of sorted) {
              if (new Date(v.createdAt).getTime() <= taskTime) {
                matchedVer = v;
              } else {
                break;
              }
            }
            if (matchedVer) {
              taskVersion = `v${matchedVer.version}`;
            }
          }

          const rawDesc = t.description || '';
          const submissions: any[] = [];
          const submissionRegex = /\[Note:\s*([\s\S]*?)\](?:\s*\[version:(v\d+)\])?/g;
          let match;

          while ((match = submissionRegex.exec(rawDesc)) !== null) {
            const note = match[1].trim();
            const versionTag = match[2];
            let previewUrl = undefined;
            let assetName = 'submission.png';
            if (versionTag) {
              const matchVer = dbVersions.find(v => `v${v.version}` === versionTag && v.taskId === t.id) || dbVersions.find(v => `v${v.version}` === versionTag && !v.taskId);
              if (matchVer) {
                previewUrl = matchVer.previewUrl;
                const thumbnailMaterial = matchVer.materials?.find((m: any) => m.isThumbnail) || matchVer.materials?.find((m: any) => m.type === 'IMAGE' || m.originalName?.match(/\.(png|jpe?g)$/i) || m.name?.match(/\.(png|jpe?g)$/i));
                assetName = (thumbnailMaterial as any)?.name || (thumbnailMaterial as any)?.originalName || `submission-${versionTag}.png`;
              }
            } else {
              const currentV = dbVersions.filter(v => v.taskId === t.id).find(v => v.isCurrent)
                || dbVersions.find(v => v.taskId === t.id)
                || dbVersions.find(v => v.isCurrent && !v.taskId)
                || dbVersions[dbVersions.length - 1];
              if (currentV) {
                previewUrl = currentV.previewUrl;
                const thumbnailMaterial = currentV.materials?.find((m: any) => m.isThumbnail) || currentV.materials?.find((m: any) => m.type === 'IMAGE' || m.originalName?.match(/\.(png|jpe?g)$/i) || m.name?.match(/\.(png|jpe?g)$/i));
                assetName = (thumbnailMaterial as any)?.name || (thumbnailMaterial as any)?.originalName || `submission-v${currentV.version}.png`;
              }
            }
            submissions.push({
              id: `sub_${Date.now()}_${Math.random()}`,
              status: 'PENDING_REVIEW',
              note,
              assetName,
              previewUrl,
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

      // 5. Fetch Comments
      let dbComments: FileDiscussionComment[] = [];
      let dbTaskComments: SubmissionFrameComment[] = [];

      try {
        if (selectedTaskId) {
          const taskCommentsRes = await getTaskComments(selectedTaskId);
          if (signal?.aborted || currentLoadId !== activeLoadRef.current) return;

          dbComments = (taskCommentsRes || []).map((c: any) => ({
            author: c.createdByUser?.displayName || c.createdByUser?.email || `User #${c.createdByUser?.id || c.createdBy || c.userId}`,
            content: getCommentText(c.content),
            id: String(c.id),
            time: c.createdAt ? formatFileDate(c.createdAt) : '',
            context: `task:${selectedTaskId}`,
          }));
        } else {
          const fileCommentsRes = await getFileComments(fileId);
          if (signal?.aborted || currentLoadId !== activeLoadRef.current) return;

          dbComments = (fileCommentsRes || []).map((c: any) => ({
            author: c.createdByUser?.displayName || c.createdByUser?.email || `User #${c.createdByUser?.id || c.createdBy || c.userId}`,
            content: getCommentText(c.content),
            id: String(c.id),
            time: c.createdAt ? formatFileDate(c.createdAt) : '',
          }));
        }
      } catch (err) {
        console.error('Failed to load comments:', err);
      }

      try {
        const limit = pLimit(10);
        let allFrames: any[] = [];

        if (selectedTaskId) {
          try {
            const frames = await getTaskFrames(selectedTaskId);
            allFrames = frames.map(f => ({
              ...f,
              injectedMaterialId: f.materialId,
              injectedTaskId: selectedTaskId,
            }));
          } catch (e) {
            console.error('Failed to load task frames:', e);
          }
        } else {
          const materialIds = [...new Set(dbVersions.map(v => String(v.id)).filter(id => id && id !== ''))];
          const allFramesResults = await Promise.allSettled(
            materialIds.map(matId => limit(async () => {
              const frames = await getMaterialFrames(matId);
              const material = dbVersions.find(v => String(v.id) === String(matId));
              return frames.map((f: any) => ({
                ...f,
                injectedMaterialId: matId,
                injectedTaskId: material?.taskId,
              }));
            }))
          );

          allFrames = allFramesResults.flatMap((result, idx) => {
            if (result.status === 'rejected') {
              console.error(`Failed to load frames for material ${materialIds[idx]}`, result.reason);
              return [];
            }
            return result.value;
          });
        }

        if (signal?.aborted || currentLoadId !== activeLoadRef.current) return;

        const allFrameCommentsResults = await Promise.allSettled(
          allFrames.map(frame => limit(async () => {
            const commentsRes = await getFrameComments(frame.id);
            return commentsRes.map((c: any) => ({
              id: String(c.id),
              author: c.createdByUser?.displayName || c.createdByUser?.email || `User #${c.createdByUser?.id || c.userId}`,
              content: getCommentText(c.content),
              time: c.createdAt ? formatFileDate(c.createdAt) : '',
              region: {
                startX: parseDecimal(frame.startX),
                startY: parseDecimal(frame.startY),
                endX: parseDecimal(frame.endX),
                endY: parseDecimal(frame.endY),
              },
              taskId: frame.injectedTaskId ? String(frame.injectedTaskId) : undefined,
              targetVersion: undefined,
              frameId: String(frame.id),
              materialId: frame.injectedMaterialId ? String(frame.injectedMaterialId) : undefined,
              materialName: undefined,
            } as SubmissionFrameComment));
          }))
        );

        dbTaskComments = allFrameCommentsResults.flatMap((result, idx) => {
          if (result.status === 'rejected') {
            console.error(`Failed to load comments for frame ${allFrames[idx].id}`, result.reason);
            return [];
          }
          return result.value;
        });

      } catch (err) {
        console.error('Failed to load frame comments:', err);
      }

      if (signal?.aborted || currentLoadId !== activeLoadRef.current) return;

      const result = {
        project: projData,
        folders: productionFolders,
        members: apiMembers,
        file: ({
          id: String(response.id),
          title: response.title,
          updatedAt: response.updatedAt ? formatFileDate(response.updatedAt) : '',
          updatedBy: response.updatedByUser?.displayName || response.updatedByUser?.email || 'Unknown',
          previewUrl: (response as any).previewUrl || '',
          isFolder: false,
          createdBy: createdByLabel,
          createdAt: response.createdAt ? formatFileDate(response.createdAt) : '',
          status: (response as any).status || 'DRAFT',
          folderId: (response as any).folder?.id,
        } as unknown) as FileExplorerItem,
        versions: dbVersions,
        tasks: dbTasks,
        comments: dbComments,
        frameComments: dbTaskComments,
      };

      setData(result);
      setHasLoaded(true);
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

  useEffect(() => {
    const controller = new AbortController();
    setHasLoaded(false);
    setData(null);
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
              // Fallback to full reload if we fail to get frame details
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
  };
}
