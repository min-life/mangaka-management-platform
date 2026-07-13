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
    });
  }, [data?.versions, focusedTask]);
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


    versions,
    zoom,
  };
}

export type FileDetailController = ReturnType<typeof useFileDetailController>;
