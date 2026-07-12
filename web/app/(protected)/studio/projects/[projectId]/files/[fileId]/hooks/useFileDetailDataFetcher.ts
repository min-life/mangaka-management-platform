import { useState, useEffect, useCallback, useRef } from 'react';
import { getProjectFolders, getProjectMembers, getProjectById, type ProjectFolderResponse, type ProjectResponse } from '@/services/project.service';
import { getFileById, getFileComments, getFileMaterials, getFileTasks } from '@/services/file.service';
import { getTaskFrames, getTaskComments, getTaskMaterials } from '@/services/task.service';
import { getFrameComments } from '@/services/frame.service';
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
  } | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // A stable flag to detect if the FIRST load ever finished
  const [hasLoaded, setHasLoaded] = useState(false);
  const activeLoadRef = useRef<number>(0);
  const reloadTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const loadData = useCallback(async (isRefresh = false, signal?: AbortSignal) => {
    const currentLoadId = ++activeLoadRef.current;

    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsInitialLoading(true);
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
        // ALWAYS Fetch File Materials
        const materialsRes = await getFileMaterials(fileId);
        const versionsArray = (materialsRes || []) as FileMaterialVersionRecord[];
        if (signal?.aborted || currentLoadId !== activeLoadRef.current) return;

        const fullMaterials = await Promise.all(
          versionsArray.map(async (m: any) => {
            try {
              const res = await getMaterialById(m.id);
              const full = (res as any)?.data ?? res;
              return full ?? m;
            } catch {
              return m;
            }
          })
        );
        if (signal?.aborted || currentLoadId !== activeLoadRef.current) return;
        dbVersions = buildStableMaterialVersions(fullMaterials);

        // Fetch Task Materials if a task is selected
        if (selectedTaskId) {
          const taskIdNum = Number(selectedTaskId);
          if (!isNaN(taskIdNum) && taskIdNum > 0) {
            const taskMaterials = await getTaskMaterials(selectedTaskId);
            if (signal?.aborted || currentLoadId !== activeLoadRef.current) return;

            const rawList: any[] = Array.isArray(taskMaterials)
              ? taskMaterials
              : (taskMaterials?.data ?? (taskMaterials ?? []));

            const fullTaskMaterials = await Promise.all(
              rawList.map(async (m: any) => {
                try {
                  const res = await getMaterialById(m.id);
                  const full = (res as any)?.data ?? res;
                  return full ?? m;
                } catch {
                  return m;
                }
              })
            );
            if (signal?.aborted || currentLoadId !== activeLoadRef.current) return;

            const isFileName = (name: string) => /\.[a-zA-Z0-9]+$/.test(name);
            const sortedMaterials = [...fullTaskMaterials].sort(
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
                endX: Number(taskFrame.endX),
                endY: Number(taskFrame.endY),
                startX: Number(taskFrame.startX),
                startY: Number(taskFrame.startY),
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
        let allFrameComments: SubmissionFrameComment[] = [];

        const materialIds = [...new Set(dbVersions.map(v => v.id).filter(id => id && id !== ''))];

        const allFramesPromises = materialIds.map(async (matId) => {
          try {
            const frames = await getMaterialFrames(matId);
            const material = dbVersions.find(v => String(v.id) === String(matId));
            return frames.map((f: any) => ({
              ...f,
              injectedMaterialId: matId,
              injectedTaskId: material?.taskId,
            }));
          } catch (e) {
            return [];
          }
        });
        const nestedFrames = await Promise.all(allFramesPromises);
        const allFrames = nestedFrames.flat();

        if (signal?.aborted || currentLoadId !== activeLoadRef.current) return;

        const frameCommentsPromises = allFrames.map(async (frame: any) => {
          try {
            const commentsRes = await getFrameComments(frame.id);
            return commentsRes.map((c: any) => ({
              id: String(c.id),
              author: c.createdByUser?.displayName || c.createdByUser?.email || `User #${c.createdByUser?.id || c.userId}`,
              content: getCommentText(c.content),
              time: c.createdAt ? formatFileDate(c.createdAt) : '',
              region: {
                startX: Number(frame.startX),
                startY: Number(frame.startY),
                endX: Number(frame.endX),
                endY: Number(frame.endY),
              },
              taskId: frame.injectedTaskId ? String(frame.injectedTaskId) : undefined,
              targetVersion: undefined,
              frameId: String(frame.id),
              materialId: String(frame.injectedMaterialId),
              materialName: c.material?.name || undefined,
            } as SubmissionFrameComment));
          } catch (e) {
            return [];
          }
        });

        const nestedComments = await Promise.all(frameCommentsPromises);
        dbTaskComments = nestedComments.flat();

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
    void loadData(false, controller.signal).catch(() => { });
    return () => controller.abort();
  }, [projectId, fileId]);

  useEffect(() => {
    if (hasLoaded) {
      const controller = new AbortController();
      void loadData(true, controller.signal).catch(() => { });
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
        if (reloadTimeoutRef.current) clearTimeout(reloadTimeoutRef.current);
        reloadTimeoutRef.current = setTimeout(() => {
          loadData(true).finally(resolve);
        }, 100);
      });
    }, [loadData]),
  };
}
