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
import {
  getContainedImageRect,
  mapImageRegionToCanvas,
  type CanvasImageMetrics,
} from '../canvas-image-geometry';

import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/use-permissions';
import { toast } from '@/lib/toast';

import { useFileDetailDataFetcher } from './useFileDetailDataFetcher';
import { useTaskVersionResolver } from './useTaskVersionResolver';

import { useFileDetailVersionActions } from './useFileDetailVersionActions';
import { useFileDetailTaskActions } from './useFileDetailTaskActions';
import { useFileDetailCommentActions } from './useFileDetailCommentActions';

import {
  type FileExplorerItem,
  type FileTaskItem,
  type FileVersionItem,
  type SubmissionFrameComment,
} from '../../file-ui';
import type { TaskWorkspaceItem } from '../../../tasks/task-ui';

import { type FileDiscussionComment, type ResourceTab } from '../file-detail-types';
import type { AiFrameDetectResponse } from '@/types/ai-frame';

type StateUpdate<T> = T | ((current: T) => T);
type FileDiscussionCommentWithContext = FileDiscussionComment & {
  context?: string | null;
};

function resolveStateUpdate<T>(update: StateUpdate<T>, current: T) {
  return typeof update === 'function' ? (update as (value: T) => T)(current) : update;
}

type UseFileDetailControllerProps = {
  fileId: number;
  focusedTaskId: string | null;
  projectId: number;
};

export function useFileDetailController({ fileId, focusedTaskId, projectId }: UseFileDetailControllerProps) {

  const canvasRef = useRef<HTMLDivElement>(null);
  const [resourceTab, setResourceTab] = useState<ResourceTab>('versions');

  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [commentFilterMode, setCommentFilterMode] = useState<string>('all');
  const [isSavingComment, setIsSavingComment] = useState(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [replyingFrameId, setReplyingFrameId] = useState<string | null>(null);

  const [selectedVersionForDetails, setSelectedVersionForDetails] = useState<FileVersionItem | null>(null);
  const [deletingVersionId, setDeletingVersionId] = useState<string | null>(null);
  const [mobileTasksOpen, setMobileTasksOpen] = useState(false);
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(focusedTaskId);
  const [focusedTask, setFocusedTask] = useState<TaskWorkspaceItem | null>(null); const viewport = useCanvasViewport();
  const [aiFrameDialogOpen, setAiFrameDialogOpen] = useState(false);
  const [isDetectingAiFrame, setIsDetectingAiFrame] = useState(false);
  const [isAiFrameReviewing, setIsAiFrameReviewing] = useState(false);
  const [canvasImageMetrics, setCanvasImageMetrics] = useState<CanvasImageMetrics | null>(null);

  const { user } = useAuth();
  const { can: canProject } = usePermissions({ resource: 'PROJECT', resourceId: projectId });

  const { data, error, isInitialLoading, isRefreshing, reload, quietReload, refreshFrameComments, setData, setError } = useFileDetailDataFetcher({
    projectId,
    fileId,
    selectedTaskId,
  });

  const file = data?.file ?? null;
  const project = data?.project ?? null;
  const folders = data?.folders ?? [];
  const tasks = data?.tasks ?? [];

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
    getCanvasPointFromClient,
    handleCanvasPointerDown,
    handleCanvasPointerMove,
    handleCanvasPointerUp,
  } = annotations;

  const versions = useMemo(() => {
    const rawVersions = data?.versions ?? [];
    return rawVersions.filter((v: FileVersionItem) => {
      if (!focusedTask) {
        return v.taskId === null || v.taskId === undefined;
      }
      return v.taskId === Number(focusedTask.id);
    });
  }, [data?.versions, focusedTask]);
  const frameComments = data?.frameComments ?? [];
  const fileComments = ((data?.comments ?? []) as FileDiscussionCommentWithContext[]).filter(
    (comment) => !comment.context,
  );
  const taskComments = ((data?.comments ?? []) as FileDiscussionCommentWithContext[]).filter(
    (comment) => comment.context?.startsWith('task:'),
  );
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

  const setFileCustom = useCallback((update: StateUpdate<FileExplorerItem | null>) => {
    setData((currentData) => {
      if (!currentData) return null;
      const nextFile = resolveStateUpdate(update, currentData.file);
      return {
        ...currentData,
        file: nextFile,
      };
    });
  }, [setData]);

  const setTasksCustom = useCallback((update: StateUpdate<FileTaskItem[]>) => {
    setData((currentData) => {
      if (!currentData) return null;
      const nextTasks = resolveStateUpdate(update, currentData.tasks);
      return {
        ...currentData,
        tasks: nextTasks,
      };
    });
  }, [setData]);

  const setVersionsCustom = useCallback((nextVersions: FileVersionItem[]) => {
    setData((currentData) => {
      if (!currentData) return null;
      return {
        ...currentData,
        versions: nextVersions,
      };
    });
  }, [setData]);

  const setFrameCommentsCustom = useCallback((update: StateUpdate<SubmissionFrameComment[]>) => {
    setData((currentData) => {
      if (!currentData) return null;
      const nextComments = resolveStateUpdate(update, currentData.frameComments);
      return {
        ...currentData,
        frameComments: nextComments,
      };
    });
  }, [setData]);

  const setCommentsCustom = useCallback(
    (update: StateUpdate<FileDiscussionCommentWithContext[]>) => {
    setData((currentData) => {
      if (!currentData) return null;
      const nextComments = resolveStateUpdate(
        update,
        currentData.comments as FileDiscussionCommentWithContext[],
      );
      return {
        ...currentData,
        comments: nextComments,
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
  const displayedPreviewUrl = focusedTask
    ? (currentVersion?.previewUrl || '')
    : (selectedVersion?.previewUrl || currentVersion?.previewUrl || file?.previewUrl || '');

  const handleOpenAiFrameDialog = useCallback(() => {
    if (!displayedPreviewUrl) {
      toast.error('Preview image is not available for AI detection.');
      return;
    }

    setPendingTaskRegion(null);
    setPendingFrameRegion(null);
    setDraftRegion(null);
    setAnnotationStart(null);
    setAnnotationMode(false);
    setFrameAnnotationMode(false);
    setIsAiFrameReviewing(false);
    setAiFrameDialogOpen(true);
  }, [
    displayedPreviewUrl,
    setAnnotationMode,
    setAnnotationStart,
    setDraftRegion,
    setFrameAnnotationMode,
    setPendingFrameRegion,
    setPendingTaskRegion,
  ]);

  const handleCancelAiFrame = useCallback(() => {
    setAiFrameDialogOpen(false);
    setIsDetectingAiFrame(false);
    setIsAiFrameReviewing(false);
    setPendingFrameRegion(null);
    setDraftRegion(null);
  }, [setDraftRegion, setPendingFrameRegion]);

  const handleDetectAiFrame = useCallback(
    async (objectName: string) => {
      if (!displayedPreviewUrl) {
        toast.error('Preview image is not available for AI detection.');
        return;
      }

      setIsDetectingAiFrame(true);
      setError(null);

      try {
        const response = await fetch('/api/ai/frame-detect', {
          body: JSON.stringify({
            imageUrl: displayedPreviewUrl,
            objectName,
          }),
          headers: {
            'Content-Type': 'application/json',
          },
          method: 'POST',
        });
        const result = (await response.json()) as AiFrameDetectResponse;

        if (!response.ok || !result.found || !result.region) {
          toast.error(result.message || 'AI could not locate that object.');
          return;
        }

        const canvasBounds = canvasRef.current?.getBoundingClientRect();
        if (
          !canvasBounds ||
          !canvasImageMetrics ||
          canvasImageMetrics.imageUrl !== displayedPreviewUrl
        ) {
          toast.error('Image preview is still loading. Please try AI detection again shortly.');
          return;
        }

        const region = mapImageRegionToCanvas(
          result.region,
          getContainedImageRect(canvasBounds, canvasImageMetrics),
          canvasBounds,
        );

        setPendingFrameRegion(region);
        setDraftRegion(region);
        setIsAiFrameReviewing(true);
        setAiFrameDialogOpen(false);
        setResourceTab('discussion');
        toast.success('AI created a draft frame. Adjust it, then confirm.');
        requestAnimationFrame(() =>
          canvasRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }),
        );
      } catch (error) {
        console.error('AI frame detection failed:', error);
        toast.error('AI frame detection failed. Please try again.');
      } finally {
        setIsDetectingAiFrame(false);
      }
    },
    [canvasImageMetrics, displayedPreviewUrl, setDraftRegion, setError, setPendingFrameRegion],
  );

  const handleConfirmAiFrame = useCallback(() => {
    if (!pendingFrameRegion) {
      return;
    }

    setDraftRegion(pendingFrameRegion);
    setIsAiFrameReviewing(false);
  }, [pendingFrameRegion, setDraftRegion]);

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
  const canvasFrameComments = currentMaterialFrameComments;
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
    aiFrameDialogOpen,
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
    getCanvasPointFromClient,
    handleCanvasPointerDown,
    handleCanvasPointerMove,
    handleCanvasPointerUp,
    handleCancelAiFrame,
    handleCreateAnnotatedTask,
    handleCreateDiscussionComment,
    handleCreateFrameComment,
    handleReplyToFrame,
    handleCreateReview,
    handleDetectAiFrame,
    handleDeleteDiscussionComment,
    handleFocusedTaskChange,
    handleSubmitTaskWork,
    handleMarkReadyForReview: canSubmitTask ? handleMarkReadyForReview : undefined,
    handleConfirmAiFrame,
    handleOpenAiFrameDialog,
    handleUpdateDiscussionComment,
    isLoading,
    isAiFrameReviewing,
    isDetectingAiFrame,
    isInitialLoading,
    isTaskContextLoading,
    isRefreshing,
    isPanning,
    isSavingComment,
    isSubmittingReview,
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
    setCanvasImageMetrics,
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


    versions,
    zoom,
  };
}

export type FileDetailController = ReturnType<typeof useFileDetailController>;
