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

import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/use-permissions';
import { getFrameById } from '@/services/frame.service';
import { getMaterialById } from '@/services/material.service';
import { toast } from '@/lib/toast';
import { parseDecimal } from '@/lib/utils';

import { useFileDetailDataFetcher } from './useFileDetailDataFetcher';
import { useTaskVersionResolver } from './useTaskVersionResolver';

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
  getCommentText,
  type ResourceTab,
} from '../file-detail-types';

type UseFileDetailControllerProps = {
  fileId: number;
  focusedTaskId: string | null;
  projectId: number;
};

export function useFileDetailController({ fileId, focusedTaskId, projectId }: UseFileDetailControllerProps) {

  const canvasRef = useRef<HTMLDivElement>(null);
  const [resourceTab, setResourceTab] = useState<ResourceTab>('overview');

  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [isSavingComment, setIsSavingComment] = useState(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [replyingFrameId, setReplyingFrameId] = useState<string | null>(null);

  const [focusedFrameId, setFocusedFrameId] = useState<number | null>(null);
  const [focusedFrameMaterialId, setFocusedFrameMaterialId] = useState<string | null>(null);
  const [focusedFrameRegion, setFocusedFrameRegion] = useState<FileTaskRegion | null>(null);
  const [isFrameLoading, setIsFrameLoading] = useState(false);
  const [commentFilterMode, setCommentFilterMode] = useState<string>('all');
  const latestRequestedFrameIdRef = useRef<number | null>(null);

  const [selectedVersionForDetails, setSelectedVersionForDetails] = useState<FileVersionItem | null>(null);
  const [deletingVersionId, setDeletingVersionId] = useState<string | null>(null);
  const [mobileTasksOpen, setMobileTasksOpen] = useState(false);
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(focusedTaskId);
  const [focusedTask, setFocusedTask] = useState<TaskWorkspaceItem | null>(null); const viewport = useCanvasViewport();
  
  // Reset filter when switching task context
  useEffect(() => {
    setCommentFilterMode('all');
  }, [selectedTaskId]);

  // Cache for lazy loading material details
  const [detailedMaterialCache, setDetailedMaterialCache] = useState<Record<string, any[]>>({});
  const [isCanvasLoading, setIsCanvasLoading] = useState(false);

  const { user } = useAuth();
  const { can: canProject } = usePermissions({ resource: 'PROJECT', resourceId: projectId });

  const { data, error, isInitialLoading, isRefreshing, reload, quietReload, refreshFrameComments, setData, setError, hasMoreComments, isLoadingMoreComments, loadMoreComments, loadVersions, loadComments, versionsLoaded, commentsLoaded, isLoadingVersions, isLoadingComments } = useFileDetailDataFetcher({
    projectId,
    fileId,
    selectedTaskId,
  });

  const file = data?.file ?? null;
  const project = data?.project ?? null;
  const folders = data?.folders ?? [];
  const tasks = data?.tasks ?? [];
  const latestMaterialVersion = data?.latestMaterialVersion ?? null;

  // Auto-trigger deferred loads when tabs are first opened
  useEffect(() => {
    if ((resourceTab === 'versions') && !versionsLoaded && !isLoadingVersions) {
      void loadVersions();
    }
  }, [resourceTab, versionsLoaded, isLoadingVersions, loadVersions]);

  useEffect(() => {
    if (resourceTab === 'discussion' && !commentsLoaded && !isLoadingComments) {
      void loadComments();
    }
  }, [resourceTab, commentsLoaded, isLoadingComments, loadComments]);

  const {
    selectedVersion,
    setSelectedVersion,
  } = useTaskVersionResolver({
    focusedTaskId,
    selectedTaskId,
    setSelectedTaskId,
    focusedTask,
    setFocusedTask,
    tasks,
    file,
    fileId,
    data,
    isRefreshing,
    user,
  });



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
    zoom,
    rotation,
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

  const versions = useMemo(() => {
    const rawVersions = data?.versions ?? [];
    return rawVersions.filter((v: any) => {
      if (!focusedTask) {
        return v.taskId === null || v.taskId === undefined;
      }
      return v.taskId === Number(focusedTask.id);
    }).map((v: any) => {
      const cachedMaterials = detailedMaterialCache[v.id];
      return {
        ...v,
        materials: cachedMaterials && cachedMaterials.length > 0 ? cachedMaterials : v.materials,
      };
    });
  }, [data?.versions, focusedTask, detailedMaterialCache]);

  const activeVersionIdForCache = focusedTask
    ? (versions.find((v) => v.isCurrent)?.id ?? versions[0]?.id)
    : (selectedVersion?.id ?? versions.find((v) => v.isCurrent)?.id ?? versions[0]?.id);

  // Lazy load detailed material data when active version changes
  useEffect(() => {
    if (!activeVersionIdForCache) return;
    
    const versionId = activeVersionIdForCache;
    if (detailedMaterialCache[versionId]) {
      return; // Already cached
    }

    let isMounted = true;

    getMaterialById(versionId)
      .then((res: any) => {
        if (!isMounted) return;
        setDetailedMaterialCache(prev => ({
          ...prev,
          [versionId]: res.data?.materials || res.materials || []
        }));
      })
      .catch((err) => {
        console.error('Failed to load material details:', err);
      });

    return () => {
      isMounted = false;
    };
  }, [activeVersionIdForCache, detailedMaterialCache]);
  const frameComments = data?.frameComments ?? [];
  const fileComments = (data?.comments ?? []).filter((c: any) => !c.context);
  const taskComments = (data?.comments ?? []).filter((c: any) => c.context?.startsWith('task:'));
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
    setDeletingVersionId,
    setSelectedVersionForDetails,

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

  const setFrameCommentsCustom = useCallback((update: any) => {
    setData((currentData) => {
      if (!currentData) return null;
      const nextComments = typeof update === 'function' ? update(currentData.frameComments) : update;
      return {
        ...currentData,
        frameComments: nextComments,
      };
    });
  }, [setData]);

  const setCommentsCustom = useCallback((update: any) => {
    setData((currentData) => {
      if (!currentData) return null;
      const nextComments = typeof update === 'function' ? update(currentData.comments) : update;
      return {
        ...currentData,
        comments: nextComments,
      };
    });
  }, [setData]);

  const appendComment = useCallback((newestComment: any) => {
    setData((prev) => {
      if (!prev) return prev;
      const exists = prev.comments.some((c: any) => String(c.id) === String(newestComment.id));
      if (exists) return prev;
      return {
        ...prev,
        comments: [
          ...prev.comments,
          {
            id: String(newestComment.id),
            content: getCommentText(newestComment.content),
            author: newestComment.createdByUser?.displayName || newestComment.createdByUser?.email || `User #${newestComment.createdBy}`,
            time: newestComment.createdAt ? new Date(newestComment.createdAt).toISOString() : new Date().toISOString(),
            timestamp: newestComment.createdAt ? new Date(newestComment.createdAt).getTime() : Date.now(),
            context: newestComment.context ?? null,
          }
        ]
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
    setFrameAnnotationMode,
    setFocusedTask,
    setFile: setFileCustom,
    setTasks: setTasksCustom,
    setSelectedVersion,
    setVersions: setVersionsCustom,
  });

  const {
    handleCreateFrameComment,
    handleReplyToFrame,
    handleCreateDiscussionComment,
    handleUpdateDiscussionComment,
    handleDeleteDiscussionComment,
  } = useFileDetailCommentActions({
    fileId,
    selectedVersion,
    versions,
    selectedTaskId,
    file,
    user,
    setFrameComments: setFrameCommentsCustom,
    setComments: setCommentsCustom,
    loadFile,
    quietReload,
    setError,
    setIsSavingComment,
    setPendingFrameRegion,
    setDraftRegion,
    setFrameAnnotationMode,
    appendComment,
  });

  const startTaskFrameSelection = () => {
    setTaskDialogOpen(false);
    setSelectedVersion(null);
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
  const currentVersion = versions.find((v) => v.isCurrent) ?? versions[0] ?? null;
  const activeVersionId = focusedTask
    ? currentVersion?.id
    : (selectedVersion?.id || currentVersion?.id);

  const activeMaterialDetails = activeVersionId ? detailedMaterialCache[activeVersionId] : null;
  const activeThumbnail = activeMaterialDetails?.find((item: Record<string, any>) => item.isThumbnail) ||
    activeMaterialDetails?.find((item: Record<string, any>) => item.type === 'IMAGE' || item.originalName?.match(/\.(png|jpe?g)$/i) || item.name?.match(/\.(png|jpe?g)$/i));

  const displayedPreviewUrl = activeThumbnail?.downloadUrl || activeThumbnail?.url || file?.previewUrl || '';
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

  const handleFrameClick = useCallback(async (frameId: string, materialId: string) => {
    const fId = Number(frameId);
    latestRequestedFrameIdRef.current = fId;
    
    // Switch to the correct material
    const targetMaterial = versions.find(v => String(v.id) === String(materialId));
    if (targetMaterial) {
      setSelectedVersion(targetMaterial);
    }
    
    setIsFrameLoading(true);

    try {
      const frame = await getFrameById(fId);
      if (latestRequestedFrameIdRef.current !== fId) return;

      setFocusedFrameId(fId);
      setFocusedFrameMaterialId(String(materialId));
      const region = {
        startX: parseDecimal(frame.startX),
        startY: parseDecimal(frame.startY),
        endX: parseDecimal(frame.endX),
        endY: parseDecimal(frame.endY),
      };
      setFocusedFrameRegion(region);

      // Pan to region logic (Removed as per user request to not move the image)
      if (canvasRef.current) {
        requestAnimationFrame(() =>
          canvasRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        );
      }
    } catch (err) {
      if (latestRequestedFrameIdRef.current !== fId) return;
      console.error(`Failed to load frame ${frameId}`, err);
      toast.error('Failed to load frame position. Try again later.');
      setFocusedFrameId(null);
      setFocusedFrameMaterialId(null);
      setFocusedFrameRegion(null);
    } finally {
      if (latestRequestedFrameIdRef.current === fId) {
        setIsFrameLoading(false);
      }
    }
  }, [versions, setSelectedVersion, setPanOffset, zoom]);

  const canvasFrameComments = useMemo(() => {
    if (!focusedFrameId || !focusedFrameRegion || String(focusedFrameMaterialId) !== String(activeVersionIdForCache)) return [];
    return [{
      frameId: String(focusedFrameId),
      region: focusedFrameRegion,
    }];
  }, [focusedFrameId, focusedFrameRegion, focusedFrameMaterialId, activeVersionIdForCache]);

  const discussionListComments = useMemo(() => {
    const combined = [
      ...frameComments.map(c => ({ ...c, type: 'frame' as const })),
      ...(data?.comments ?? []).map(c => ({ ...c, type: 'general' as const })),
    ].sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));

    if (commentFilterMode === 'all') return combined;
    return combined.filter(c => c.type === commentFilterMode);
  }, [frameComments, data?.comments, commentFilterMode]);

  const discussionContextKey = focusedTask
    ? `task:${focusedTask.id}`
    : 'file';

  const discussionFrameComments = useMemo(() => {
    if (discussionContextKey === 'file') {
      return frameComments.filter((c) => !c.taskId);
    }
    if (discussionContextKey.startsWith('task:')) {
      const taskId = discussionContextKey.replace('task:', '');
      return frameComments.filter((c) => String(c.taskId) === taskId);
    }
    return frameComments;
  }, [frameComments, discussionContextKey]);
  const discussionContextLabel = focusedTask
      ? `Task: ${focusedTask.title}`
      : `File: ${file?.title ?? 'Untitled file'}`;
  const assignedToName = tasks.find((t) => t.assignedTo && t.assignedTo !== 'Unassigned')?.assignedTo || 'Unassigned';

  const setDiscussionContext = useCallback((key: string) => {
    if (key === 'file') {
      focusFileTask(null);
    } else if (key.startsWith('task:')) {
      const tid = key.split(':')[1];
      const matchedTask = tasks.find(t => String(t.id) === String(tid));
      if (matchedTask) {
        focusFileTask(matchedTask);
      }
    }
  }, [tasks, focusFileTask]);

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
    discussionListComments,
    focusedFrameId,
    isFrameLoading,
    handleFrameClick,
    commentFilterMode,
    setCommentFilterMode,
    displayedPreviewUrl,
    draftRegion,
    error,
    file,
    fileComments,
    taskComments,
    folder,
    folders,
    project,
    focusFileTask,
    focusedTask,
    frameAnnotationMode,
    handleCanvasPointerDown,
    handleCanvasPointerMove,
    handleCanvasPointerUp,
    handleCreateAnnotatedTask,
    handleCreateDiscussionComment,
    handleCreateFrameComment,
    handleReplyToFrame,
    handleCreateReview,
    handleDeleteDiscussionComment,
    handleFocusedTaskChange,
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
    isLoadingVersions,
    isLoadingComments,
    isViewingHistoricalVersion,
    loadFile,
    quietReload,
    refreshFrameComments,
    members,
    mobileTasksOpen,
    panOffset,
    pendingFrameRegion,
    pendingTaskRegion,
    projectId,
    replyingFrameId,
    resourceTab,
    rotation,
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
    setReplyingFrameId,
    setResourceTab,
    setRotation,
    setSelectedTaskId,
    setSelectedVersion,
    setSelectedVersionForDetails,
    setTaskDialogOpen,


    setZoom,
    setDiscussionContext,
    startTaskFrameSelection,
    taskDialogOpen,
    tasks,

    detailedMaterialCache,
    isCanvasLoading,
    versions,
    latestMaterialVersion,
    data,
    appendComment,
    zoom,
    hasMoreComments,
    isLoadingMoreComments,
    loadMoreComments,
  };
}

export type FileDetailController = ReturnType<typeof useFileDetailController>;
