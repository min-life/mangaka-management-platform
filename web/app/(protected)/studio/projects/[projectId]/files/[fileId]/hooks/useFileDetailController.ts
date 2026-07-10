'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { useCanvasViewport } from './useCanvasViewport';
import { useCanvasAnnotations } from './useCanvasAnnotations';

import { getProjectFolders, getProjectMembers, getProjectById, type ProjectFolderResponse, type ProjectResponse } from '@/services/project.service';
import { getFileById, getFileComments, getFileMaterials, getFileTasks } from '@/services/file.service';
import { getTaskFrames, getTaskComments, getTaskMaterials } from '@/services/task.service';
import { getFrameComments } from '@/services/frame.service';
import { getMaterialById, getMaterialFrames } from '@/services/material.service';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/use-permissions';
import { useAsyncResource } from '@/hooks/useAsyncResource';

import { useFileDetailVersionActions } from './useFileDetailVersionActions';
import { useFileDetailTaskActions } from './useFileDetailTaskActions';
import { useFileDetailCommentActions } from './useFileDetailCommentActions';

import {
  formatFileDate,
  type FileExplorerItem,
  type FileTaskItem,
  type FileTaskRegion,
  type FileVersionItem,
  type SubmissionFrameComment,
} from '../../file-ui';
import type { TaskWorkspaceItem } from '../../../tasks/task-ui';
import {
  buildStableMaterialVersions,
  getCommentText,
  type FileDiscussionComment,
  type FileMaterialVersionRecord,
  type ResourceTab,
} from '../file-detail-types';

type UseFileDetailControllerProps = {
  fileId: number;
  focusedTaskId: string | null;
  projectId: number;
};

export function useFileDetailController({ fileId, focusedTaskId, projectId }: UseFileDetailControllerProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const lastProcessedTaskIdRef = useRef<string | null | undefined>(undefined);
  const [resourceTab, setResourceTab] = useState<ResourceTab>('versions');
  const [selectedVersion, setSelectedVersion] = useState<FileVersionItem | null>(null);
  const [versionHistoryOpen, setVersionHistoryOpen] = useState(false);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [focusedTask, setFocusedTask] = useState<TaskWorkspaceItem | null>(null);
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null);
  const [isSavingComment, setIsSavingComment] = useState(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [versionTabMode, setVersionTabMode] = useState<'list' | 'detail'>('list');
  const [selectedVersionForDetails, setSelectedVersionForDetails] = useState<FileVersionItem | null>(null);
  const [deletingVersionId, setDeletingVersionId] = useState<string | null>(null);
  const [mobileTasksOpen, setMobileTasksOpen] = useState(false);
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true);



  const viewport = useCanvasViewport();

  const { user } = useAuth();
  const { can: canProject } = usePermissions({ resource: 'PROJECT', resourceId: projectId });
  const {
    zoom,
    setZoom,
    rotation,
    setRotation,
    comparisonOpacity,
    setComparisonOpacity,
    panOffset,
    setPanOffset,
    panStart,
    setPanStart,
    isPanning,
    setIsPanning,
  } = viewport;

  const annotations = useCanvasAnnotations({
    isPanning,
    setIsPanning,
    panOffset,
    setPanOffset,
    panStart,
    setPanStart,
    setSelectedTaskId,
    setTaskDialogOpen,
  });
  const {
    annotationMode,
    setAnnotationMode,
    frameAnnotationMode,
    setFrameAnnotationMode,
    annotationStart,
    setAnnotationStart,
    draftRegion,
    setDraftRegion,
    pendingTaskRegion,
    setPendingTaskRegion,
    pendingFrameRegion,
    setPendingFrameRegion,
    getCanvasPoint,
    buildRegion,
    handleCanvasPointerDown,
    handleCanvasPointerMove,
    handleCanvasPointerUp,
  } = annotations;

  const { data, error, isInitialLoading, isRefreshing, reload, setData, setError } = useAsyncResource(async () => {
    let projData = null;
    try {
      projData = await getProjectById(projectId);
    } catch (err) {
      console.error('Failed to load project details:', err);
    }

    const folderResult = await getProjectFolders(projectId);
    const productionFolders = folderResult.folders;

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

    if (isNaN(Number(fileId)) || fileId < 0) {
      throw new Error('File was not found in the current project workspace.');
    }

    const response = await getFileById(fileId);
    const createdByLabel =
      response.createdByUser?.displayName ||
      response.createdByUser?.email ||
      (response.createdBy ? `User #${response.createdBy}` : 'Unknown user');

    let dbVersions: FileVersionItem[] = [];
    try {
      if (!selectedTaskId) {
        // 1. Khi KHÔNG bấm vào task: Gọi GET /files/:id/materials chỉ lấy các version gốc
        const materialsRes = await getFileMaterials(fileId);
        const versionsArray = (materialsRes || []) as FileMaterialVersionRecord[];

        // Fetch full detail (with presigned URLs) for each material in parallel
        const fullMaterials = await Promise.all(
          versionsArray.map(async (m: any) => {
            try {
              const res = await getMaterialById(m.id);
              const full = (res as any)?.data ?? res;
              return full ?? m;
            } catch {
              return m; // fallback to basic data on error
            }
          })
        );
        dbVersions = buildStableMaterialVersions(fullMaterials);
      } else {
        const taskIdNum = Number(selectedTaskId);
        if (selectedTaskId && !isNaN(taskIdNum) && taskIdNum > 0) {
          // 2. Khi BẤM vào task: Gọi GET /tasks/:id/materials để lấy danh sách,
          // sau đó gọi GET /materials/:id song song để lấy đầy đủ materials + presigned URL
          const taskMaterials = await getTaskMaterials(selectedTaskId);
          const rawList: any[] = Array.isArray(taskMaterials)
            ? taskMaterials
            : (taskMaterials?.data ?? (taskMaterials ?? []));

          // Fetch full detail (with presigned URLs) for each material in parallel
          const fullMaterials = await Promise.all(
            rawList.map(async (m: any) => {
              try {
                const res = await getMaterialById(m.id);
                const full = (res as any)?.data ?? res;
                return full ?? m;
              } catch {
                return m; // fallback to basic data on error
              }
            })
          );

          const isFileName = (name: string) => /\.[a-zA-Z0-9]+$/.test(name);

          // Sắp xếp tăng dần theo thời gian tạo (cũ nhất lên đầu) để đánh số phiên bản chính xác
          const sortedMaterials = [...fullMaterials].sort(
            (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
          const newestId = sortedMaterials.at(-1)?.id;

          dbVersions = sortedMaterials
            .map((m: any, index: number) => {
              const thumbnail = m.materials?.find((item: any) => item.isThumbnail) || m.materials?.[0];
              return {
                id: String(m.id),
                note: (m.name && !isFileName(m.name)) ? m.name : `Material v${index + 1}`,
                author: m.createdByUser?.displayName || m.createdByUser?.email || '',
                createdAt: m.createdAt ? formatFileDate(m.createdAt) : '',
                isCurrent: m.id === newestId,
                version: index + 1,
                materials: m.materials || [],
                previewUrl: thumbnail?.url || undefined,
                taskId: Number(selectedTaskId),
              } as FileVersionItem;
            })
            .reverse(); // Đảo ngược để phiên bản mới nhất nằm ở đầu (index 0)
        } else {
          // Fallback if taskId is not a valid number
          const materialsRes = await getFileMaterials(fileId);
          const versionsArray = (materialsRes || []) as FileMaterialVersionRecord[];

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
          dbVersions = buildStableMaterialVersions(fullMaterials);
        }
      }
    } catch (err) {
      console.error('Failed to load version history:', err);
    }

    let dbTasks: FileTaskItem[] = [];
    try {
      const tasksRes = await getFileTasks(fileId);
      const tasksWithFramesPromises = (tasksRes || []).map(async (t: any) => {
        let region: FileTaskRegion | undefined = undefined;
        try {
          const frames = await getTaskFrames(t.id);
          const taskFrame = frames[frames.length - 1]; // Lấy frame định vị gốc (tạo đầu tiên) của task
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
            const matchVer = dbVersions.find(v => `v${v.version}` === versionTag);
            if (matchVer) {
              previewUrl = matchVer.previewUrl;
              assetName = `submission-${versionTag}.png`;
            }
          } else if (dbVersions.length > 0) {
            previewUrl = dbVersions[0].previewUrl;
            assetName = `submission-v${dbVersions[0].version}.png`;
          }

          submissions.push({
            id: `sub-${t.id}-${submissions.length + 1}`,
            assetName,
            note,
            previewUrl,
            status: 'PENDING_REVIEW',
            submittedAt: t.updatedAt ? formatFileDate(t.updatedAt) : 'Submitted',
            submittedBy: t.assignedByUser?.displayName || t.assignedByUser?.email || 'Assignee',
          });
        }

        if (submissions.length > 0) {
          const latest = submissions[submissions.length - 1];
          if (t.status === 'DONE') {
            latest.status = 'APPROVED';
          } else if (t.status === 'INPROGRESS') {
            latest.status = 'CHANGES_REQUESTED';
          } else if (t.status === 'REVIEW') {
            latest.status = 'PENDING_REVIEW';
          }
          for (let i = 0; i < submissions.length - 1; i++) {
            submissions[i].status = 'CHANGES_REQUESTED';
          }
          submissions.reverse();
        }

        const cleanDesc = rawDesc
          .replace(/\[Note:\s*([\s\S]*?)\]/g, '')
          .replace(/\[version:(v\d+)\]/g, '')
          .trim();

        return {
          assignedTo: t.assignedByUser?.displayName || t.assignedByUser?.email || 'Unassigned',
          assignedToUserId: t.assignedByUser?.id,
          assignedByUserId: t.assignedBy,
          description: cleanDesc,
          id: String(t.id),
          region,
          status: t.status,
          title: t.title,
          targetVersion: taskVersion,
          submissions,
          updatedAt: t.updatedAt,
          parent: t.parent ? {
            id: String(t.parent.id),
            title: t.parent.title,
            description: t.parent.description ?? null,
            status: t.parent.status,
          } : null,
        };
      });
      dbTasks = await Promise.all(tasksWithFramesPromises);
    } catch (err) {
      console.error('Failed to load tasks:', err);
    }

    let dbComments: SubmissionFrameComment[] = [];
    let dbFileComments: FileDiscussionComment[] = [];
    try {
      const frameCommentGroups = await Promise.all(
        dbVersions.map(async (version) => {
          const frames = await getMaterialFrames(version.id);
          const commentsByFrame = await Promise.all(
            frames.map(async (frame) => {
              const frameCommentsRes = await getFrameComments(frame.id);
              return frameCommentsRes.map((comment: any) => ({
                author:
                  comment.createdByUser?.displayName ||
                  comment.createdByUser?.email ||
                  'Unknown User',
                content: getCommentText(comment.content),
                frameId: String(frame.id),
                id: String(comment.id),
                materialId: String(comment.material?.id ?? version.id),
                materialVersion: `v${version.version}`,
                materialName: version.note || `Material #${version.id}`,
                region: {
                  endX: Number(frame.endX),
                  endY: Number(frame.endY),
                  startX: Number(frame.startX),
                  startY: Number(frame.startY),
                },
                taskId:
                  comment.taskId != null
                    ? String(comment.taskId)
                    : typeof comment.content === 'object' && comment.content
                      ? String((comment.content as any).taskId || '')
                      : '',
                time: formatFileDate(comment.createdAt),
              }));
            }),
          );
          return commentsByFrame.flat();
        }),
      );
      dbComments = frameCommentGroups.flat();
    } catch (err) {
      console.error('Failed to load frame comments:', err);
    }

    try {
      const commentsRes = await getFileComments(fileId);
      dbFileComments = (commentsRes || []).map((comment: any) => ({
        author:
          comment.createdByUser?.displayName ||
          comment.createdByUser?.email ||
          'Unknown User',
        content: getCommentText(comment.content),
        id: String(comment.id),
        time: formatFileDate(comment.createdAt),
      }));
    } catch (err) {
      console.error('Failed to load file comments:', err);
    }

    let dbTaskComments: FileDiscussionComment[] = [];
    if (selectedTaskId && dbTasks.some((t) => t.id === selectedTaskId)) {
      try {
        const taskCommentsRes = await getTaskComments(selectedTaskId);
        dbTaskComments = (taskCommentsRes || []).map((c: any) => ({
          author: c.createdByUser?.displayName || c.createdByUser?.email || 'Unknown User',
          content: getCommentText(c.content),
          id: String(c.id),
          time: formatFileDate(c.createdAt),
        }));
      } catch (err) {
        console.error('Failed to load task comments:', err);
      }
    }

    const currentVersionPreview = dbVersions.find((v) => v.isCurrent)?.previewUrl;

    let fileStatus: 'PENDING' | 'INPROGRESS' | 'REVIEW' | 'DONE' = 'PENDING';
    if (dbTasks.some((t: any) => t.status === 'REVIEW')) {
      fileStatus = 'REVIEW';
    } else if (dbTasks.some((t: any) => t.status === 'INPROGRESS')) {
      fileStatus = 'INPROGRESS';
    } else if (dbTasks.length > 0 && dbTasks.every((t: any) => t.status === 'DONE')) {
      fileStatus = 'DONE';
    }

    const mappedFile = {
      category: 'Production File',
      createdAt: response.createdAt,
      createdByLabel,
      description: response.description,
      folderId: response.folderId,
      id: response.id,
      previewUrl: currentVersionPreview || undefined,
      status: fileStatus,
      taskCount: dbTasks.length,
      title: response.title,
      updatedAt: response.updatedAt,
    };

    const frameCommentIds = new Set(dbComments.map((c) => c.id));
    const filteredFileComments = dbFileComments.filter((c) => !frameCommentIds.has(c.id));
    const filteredTaskComments = dbTaskComments.filter((c) => !frameCommentIds.has(c.id));

    return {
      project: projData,
      folders: productionFolders,
      members: apiMembers,
      versions: dbVersions,
      tasks: dbTasks,
      frameComments: dbComments,
      fileComments: filteredFileComments,
      taskComments: filteredTaskComments,
      file: mappedFile,
    };
  }, [fileId, projectId], [selectedTaskId]);


  const file = data?.file ?? null;
  const project = data?.project ?? null;
  const folders = data?.folders ?? [];
  const tasks = data?.tasks ?? [];
  const versions = useMemo(() => {
    const rawVersions = data?.versions ?? [];
    return rawVersions.filter((v: any) => {
      if (!focusedTask) {
        return v.taskId === null || v.taskId === undefined;
      }
      return v.taskId === Number(focusedTask.id);
    });
  }, [data?.versions, focusedTask]);
  const frameComments = data?.frameComments ?? [];
  const fileComments = data?.fileComments ?? [];
  const taskComments = data?.taskComments ?? [];
  const members = data?.members ?? [];
  const isLoading = isInitialLoading || isRefreshing;
  const isTaskContextLoading = isRefreshing;
  // Expose separately so consumers can distinguish
  // first-load (block everything) from background refresh (only overlay canvas)



  const loadFile = useCallback(async () => {
    await reload();
  }, [reload]);

  const setIsLoading = useCallback((val: boolean) => {
    // No-op
  }, []);

  useEffect(() => {
    // If the URL has no task selection and it hasn't changed to null from a previous value,
    // do not reset the local selection.
    if (!focusedTaskId) {
      if (lastProcessedTaskIdRef.current !== undefined && lastProcessedTaskIdRef.current !== null) {
        setFocusedTask(null);
        setSelectedTaskId(null);
      }
      lastProcessedTaskIdRef.current = null;
      return;
    }

    lastProcessedTaskIdRef.current = focusedTaskId;

    let isMounted = true;

    queueMicrotask(() => {
      if (!isMounted) return;

      const dbTask = tasks.find((t) => t.id === focusedTaskId);
      if (!dbTask) return;

      const workspaceTask: TaskWorkspaceItem = {
        id: dbTask.id,
        title: dbTask.title,
        description: dbTask.description,
        status: dbTask.status,
        dueDate: dbTask.dueDate || 'No due date',
        assignee: dbTask.assignedTo,
        fileId: file?.id ?? fileId,
        fileTitle: file?.title ?? 'Production File',
        previewUrl: file?.previewUrl ?? '',
        priority: 'MEDIUM',
        region: dbTask.region,
        submissions: dbTask.submissions || [],
        isMine: user?.id != null && dbTask.assignedToUserId === user.id,
        assignedByUserId: dbTask.assignedByUserId,
        updatedAt: dbTask.updatedAt ?? new Date().toISOString(),
      };

      setFocusedTask(workspaceTask);
      setSelectedTaskId(workspaceTask.id);

      // Auto select matching version for task
      if (workspaceTask.targetVersion) {
        const matchVersionItem = versions.find(
          (v) => `v${v.version}` === workspaceTask.targetVersion
        );
        if (matchVersionItem) {
          setSelectedVersion(matchVersionItem);
        }
      }

      // Auto select latest submission if it is pending review
      if (
        workspaceTask.submissions.length > 0 &&
        workspaceTask.submissions[0].status === 'PENDING_REVIEW' &&
        !selectedSubmissionId
      ) {
        setSelectedSubmissionId(workspaceTask.submissions[0].id);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [focusedTaskId, tasks, file, fileId, selectedSubmissionId, versions]);

  const isProjectOwner = (user?.id != null && project?.createdBy === user.id) ||
    (user?.id != null && project?.createdByUser?.id === user.id) ||
    canProject('project:owner');

  // Reviewer = is owner/admin or the user who assigned the task, but not the worker themselves (unless self-assigned)
  const isTaskAssigner = user?.id != null && focusedTask?.assignedByUserId === user.id;
  const isTaskAssignee = focusedTask?.isMine === true;

  const canReviewTask = (isTaskAssigner && !isTaskAssignee) || canProject('admin') || isProjectOwner;
  const canSubmitTask = canProject('project:material.create') || canProject('admin') || isProjectOwner;
  const canCreateTask = canProject('project:task.create') || canProject('admin') || isProjectOwner;
  const canRestoreVersion = canProject('project:material.restore') || canProject('project:material.update') || canProject('admin') || isProjectOwner;
  const canDeleteVersion = canProject('project:material.delete') || canProject('admin') || isProjectOwner;

  const {
    handleCreateReview,
    handleRestoreVersion,
    handleDeleteVersion,
  } = useFileDetailVersionActions({
    projectId,
    file,
    selectedVersion,
    deletingVersionId,
    isLoading,
    loadFile,
    setError,
    setIsLoading,
    setIsSubmittingReview,
    setSelectedVersion,
    setSelectedSubmissionId,
    setDeletingVersionId,
    setSelectedVersionForDetails,
    setVersionTabMode,
  });

  const setFileCustom = useCallback((update: any) => {
    setData((currentData) => {
      if (!currentData) return null;
      const nextFile = typeof update === 'function' ? update(currentData.file) : update;
      return {
        ...currentData,
        file: nextFile,
      };
    });
  }, [setData]);

  const setTasksCustom = useCallback((update: any) => {
    setData((currentData) => {
      if (!currentData) return null;
      const nextTasks = typeof update === 'function' ? update(currentData.tasks) : update;
      return {
        ...currentData,
        tasks: nextTasks,
      };
    });
  }, [setData]);

  const setVersionsCustom = useCallback((nextVersions: any[]) => {
    setData((currentData) => {
      if (!currentData) return null;
      return {
        ...currentData,
        versions: nextVersions,
      };
    });
  }, [setData]);

  const {
    handleCreateAnnotatedTask,
    focusFileTask,
    handleFocusedTaskChange,
    handleSubmitTaskWork,
    handleMarkReadyForReview,
  } = useFileDetailTaskActions({
    fileId,
    projectId,
    user,
    file,
    versions,
    selectedVersion,
    focusedTask,
    selectedTaskId,
    loadFile,
    setError,
    setIsLoading,
    setPendingTaskRegion,
    setDraftRegion,
    setTaskDialogOpen,
    setSelectedTaskId,
    setSelectedSubmissionId,
    setFrameAnnotationMode,
    setFocusedTask,
    setFile: setFileCustom,
    setTasks: setTasksCustom,
    setSelectedVersion,
    setVersions: setVersionsCustom,
  });

  const {
    handleCreateFrameComment,
    handleCreateDiscussionComment,
    handleUpdateDiscussionComment,
    handleDeleteDiscussionComment,
  } = useFileDetailCommentActions({
    fileId,
    selectedVersion,
    versions,
    selectedTaskId,
    file,
    loadFile,
    setError,
    setIsSavingComment,
    setPendingFrameRegion,
    setDraftRegion,
    setFrameAnnotationMode,
  });

  const startTaskFrameSelection = () => {
    setTaskDialogOpen(false);
    setSelectedVersion(null);
    setSelectedSubmissionId(null);
    setFrameAnnotationMode(false);
    setPendingFrameRegion(null);
    setPendingTaskRegion(null);
    setDraftRegion(null);
    setAnnotationStart(null);
    setAnnotationMode(true);
    requestAnimationFrame(() =>
      canvasRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }),
    );
  };

  const folder = file ? folders.find((candidate) => candidate.id === file.folderId) : undefined;
  const selectedSubmission =
    focusedTask?.submissions.find((submission) => submission.id === selectedSubmissionId) ?? null;
  const currentVersion = versions.find((v) => v.isCurrent) ?? versions[0] ?? null;
  const displayedPreviewUrl =
    selectedSubmission?.previewUrl ?? selectedVersion?.previewUrl ?? currentVersion?.previewUrl ?? file?.previewUrl ?? '';
  const isViewingHistoricalVersion = Boolean(selectedVersion && !selectedVersion.isCurrent);
  const currentVersionName = selectedVersion
    ? `v${selectedVersion.version}`
    : versions[0]
      ? `v${versions[0].version}`
      : 'v1';
  const currentMaterialId = selectedVersion?.id ?? versions[0]?.id ?? null;
  const currentMaterialFrameComments = currentMaterialId
    ? frameComments.filter((comment) => comment.materialId === currentMaterialId)
    : [];
  const canvasFrameComments = focusedTask
    ? currentMaterialFrameComments.filter((comment) => comment.taskId === focusedTask.id)
    : currentMaterialFrameComments.filter((comment) => !comment.taskId);
  const discussionFrameComments = focusedTask
    ? frameComments.filter((comment) => comment.taskId === focusedTask.id)
    : frameComments;
  const selectedSubmissionIndex = selectedSubmission
    ? focusedTask?.submissions.findIndex((submission) => submission.id === selectedSubmission.id) ?? -1
    : -1;
  const discussionContextKey = selectedSubmission
    ? `submission:${selectedSubmission.id}`
    : focusedTask
      ? `task:${focusedTask.id}`
      : 'file';
  const discussionContextLabel = selectedSubmission
    ? `Review: Submission #${(focusedTask?.submissions.length ?? 0) - selectedSubmissionIndex}`
    : focusedTask
      ? `Task: ${focusedTask.title}`
      : `File: ${file?.title ?? 'Untitled file'}`;
  const assignedToName = tasks.find((t) => t.assignedTo && t.assignedTo !== 'Unassigned')?.assignedTo || 'Unassigned';

  return {
    annotationMode,
    assignedToName,
    canCreateTask,
    canReviewTask,
    canSubmitTask,
    canRestoreVersion,
    canDeleteVersion,
    canvasFrameComments,
    canvasRef,
    comparisonOpacity,
    currentMaterialId,
    currentVersionName,
    deletingVersionId,
    desktopSidebarOpen,
    discussionContextKey,
    discussionContextLabel,
    discussionFrameComments,
    displayedPreviewUrl,
    draftRegion,
    error,
    file,
    fileComments,
    taskComments,
    folder,
    focusFileTask,
    focusedTask,
    frameAnnotationMode,
    handleCanvasPointerDown,
    handleCanvasPointerMove,
    handleCanvasPointerUp,
    handleCreateAnnotatedTask,
    handleCreateDiscussionComment,
    handleCreateFrameComment,
    handleCreateReview,
    handleDeleteDiscussionComment,
    handleDeleteVersion,
    handleFocusedTaskChange,
    handleRestoreVersion,
    handleSubmitTaskWork,
    handleMarkReadyForReview: canSubmitTask ? handleMarkReadyForReview : undefined,
    handleUpdateDiscussionComment,
    isLoading,
    isInitialLoading,
    isTaskContextLoading,
    isRefreshing,
    isPanning,
    isSavingComment,
    isSubmittingReview,
    isViewingHistoricalVersion,
    loadFile,
    members,
    mobileTasksOpen,
    panOffset,
    pendingFrameRegion,
    pendingTaskRegion,
    projectId,
    resourceTab,
    rotation,
    selectedSubmission,
    selectedSubmissionId,
    selectedTaskId,
    selectedVersion,
    selectedVersionForDetails,
    setAnnotationMode,
    setAnnotationStart,
    setComparisonOpacity,
    setDesktopSidebarOpen,
    setDraftRegion,
    setError,
    setFrameAnnotationMode,
    setIsSubmittingReview,
    setMobileTasksOpen,
    setPanOffset,
    setPendingFrameRegion,
    setPendingTaskRegion,
    setResourceTab,
    setRotation,
    setSelectedSubmissionId,
    setSelectedTaskId,
    setSelectedVersion,
    setSelectedVersionForDetails,
    setTaskDialogOpen,
    setVersionHistoryOpen,
    setVersionTabMode,
    setZoom,
    startTaskFrameSelection,
    taskDialogOpen,
    tasks,
    versionHistoryOpen,
    versionTabMode,
    versions,
    zoom,
  };
}

export type FileDetailController = ReturnType<typeof useFileDetailController>;
