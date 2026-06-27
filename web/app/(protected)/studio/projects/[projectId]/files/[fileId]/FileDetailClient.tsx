'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  FileQuestion,
  FileText,
  History,
  Layers3,
  Maximize2,
  MessageSquare,
  Minus,
  Plus,
  ScanLine,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { createProjectApplication, type ApplicationType } from '@/services/application.service';
import { getFileById } from '@/services/file.service';
import { getProjectFolders, type ProjectFolderResponse } from '@/services/project.service';

import { CreateFileReviewDialog } from '../CreateFileReviewDialog';
import {
  buildDemoProductionFolders,
  buildFallbackFiles,
  fallbackFileWorkspaceMeta,
  fallbackFileVersions,
  fallbackMaterials,
  FILE_UI_PREVIEW_ALL_ACTIONS,
  FILES_LOCAL_STORAGE_KEY,
  fileStatusClassName,
  fileStatusLabels,
  formatFileDate,
  type FileExplorerItem,
  type FileTaskItem,
  type FileTaskRegion,
  type FileVersionItem,
  type SubmissionFrameComment,
} from '../file-ui';
import { CreateAnnotatedTaskDialog } from './CreateAnnotatedTaskDialog';
import { CreateFrameCommentDialog } from './CreateFrameCommentDialog';
import { FileActivityPanel } from './FileActivityPanel';
import { FileCommentsPanel } from './FileCommentsPanel';
import { FileTasksPanel } from './FileTasksPanel';
import { FocusedTaskWorkspace } from './FocusedTaskWorkspace';
import { VersionHistoryDrawer } from './VersionHistoryDrawer';
import {
  fallbackProjectTasks,
  readStoredTasks,
  readTaskOverrides,
  writeTaskOverride,
  type TaskWorkspaceItem,
} from '../../tasks/task-ui';

type ResourceTab = 'activity' | 'materials' | 'versions';
type NormalizedPoint = { x: number; y: number };

type FileDetailClientProps = {
  fileId: number;
  focusedTaskId: string | null;
  projectId: number;
};

export function FileDetailClient({ fileId, focusedTaskId, projectId }: FileDetailClientProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [file, setFile] = useState<FileExplorerItem | null>(null);
  const [folders, setFolders] = useState<ProjectFolderResponse[]>([]);
  const [tasks, setTasks] = useState<FileTaskItem[]>(() =>
    fallbackProjectTasks
      .filter((task) => task.fileId === fileId)
      .map((task) => ({
        assignedTo: task.assignee,
        description: task.description,
        id: task.id,
        region: task.region,
        status: task.status,
        title: task.title,
      })),
  );
  const [resourceTab, setResourceTab] = useState<ResourceTab>('versions');
  const [selectedVersion, setSelectedVersion] = useState<FileVersionItem | null>(null);
  const [versionHistoryOpen, setVersionHistoryOpen] = useState(false);
  const [annotationMode, setAnnotationMode] = useState(false);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [taskCreationScope, setTaskCreationScope] = useState<'REGION' | 'WHOLE_FILE'>('REGION');
  const [frameAnnotationMode, setFrameAnnotationMode] = useState(false);
  const [annotationStart, setAnnotationStart] = useState<NormalizedPoint | null>(null);
  const [draftRegion, setDraftRegion] = useState<FileTaskRegion | null>(null);
  const [pendingTaskRegion, setPendingTaskRegion] = useState<FileTaskRegion | null>(null);
  const [pendingFrameRegion, setPendingFrameRegion] = useState<FileTaskRegion | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [focusedTask, setFocusedTask] = useState<TaskWorkspaceItem | null>(null);
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null);
  const [frameComments, setFrameComments] = useState<SubmissionFrameComment[]>([
    {
      author: 'Lead Mangaka *',
      content: 'Reduce the dialogue density inside this bubble and preserve the eye line. *',
      id: 'frame-comment-fallback-1',
      region: { endX: 0.58, endY: 0.48, startX: 0.36, startY: 0.27 },
      submissionId: 'submission-102',
      time: '20m ago *',
    },
  ]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadFile = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const folderResult = await getProjectFolders(projectId);
      const productionFolders = buildDemoProductionFolders(projectId, folderResult.folders);
      setFolders(productionFolders);

      if (fileId < 0) {
        let localFiles: FileExplorerItem[] = [];
        const storedFiles = window.sessionStorage.getItem(FILES_LOCAL_STORAGE_KEY);

        if (storedFiles) {
          try {
            localFiles = JSON.parse(storedFiles) as FileExplorerItem[];
          } catch {
            localFiles = [];
          }
        }

        const fallbackFile = [...buildFallbackFiles(productionFolders), ...localFiles].find(
          (candidate) => candidate.id === fileId,
        );

        if (!fallbackFile) {
          throw new Error('Fallback file not found');
        }

        setFile(fallbackFile);
        return;
      }

      const response = await getFileById(fileId);
      setFile({
        category: 'Production File',
        createdAt: response.createdAt,
        createdByLabel: response.createdBy ? `User #${response.createdBy}` : 'Unknown user',
        description: response.description,
        folderId: response.folderId,
        id: response.id,
        isFallback: false,
        previewUrl: undefined,
        status: 'PENDING',
        taskCount: 0,
        title: response.title,
        updatedAt: response.updatedAt,
      });
    } catch {
      setFile(null);
      setError('Unable to load file details.');
    } finally {
      setIsLoading(false);
    }
  }, [fileId, projectId]);

  useEffect(() => {
    queueMicrotask(() => {
      void loadFile();
    });
  }, [loadFile]);

  useEffect(() => {
    if (!focusedTaskId) {
      return;
    }

    let isMounted = true;

    queueMicrotask(() => {
      if (!isMounted) return;
      const overrides = readTaskOverrides();
      const workspaceTask =
        overrides[focusedTaskId] ??
        readStoredTasks().find((task) => task.id === focusedTaskId) ??
        fallbackProjectTasks.find((task) => task.id === focusedTaskId);

      if (!workspaceTask) return;
      setFocusedTask(workspaceTask);
      setSelectedSubmissionId(null);
      setSelectedTaskId(workspaceTask.id);
      setTasks((currentTasks) => {
        const linkedTask: FileTaskItem = {
          assignedTo: workspaceTask.assignee,
        description: workspaceTask.description,
        dueDate: workspaceTask.dueDate,
          id: workspaceTask.id,
          region: workspaceTask.region,
          status: workspaceTask.status,
          title: workspaceTask.title,
        };

        return currentTasks.some((task) => task.id === workspaceTask.id)
          ? currentTasks.map((task) => (task.id === workspaceTask.id ? linkedTask : task))
          : [linkedTask, ...currentTasks];
      });
    });

    return () => {
      isMounted = false;
    };
  }, [focusedTaskId]);

  const canReviewTask = FILE_UI_PREVIEW_ALL_ACTIONS;
  const canSubmitTask = FILE_UI_PREVIEW_ALL_ACTIONS;
  const canCreateTask = FILE_UI_PREVIEW_ALL_ACTIONS;

  const handleCreateReview = async (input: {
    description?: string;
    title: string;
    type: ApplicationType;
  }) => {
    if (!file) {
      return;
    }

    setIsSubmittingReview(true);
    setError(null);

    try {
      await createProjectApplication(projectId, {
        ...input,
        materials: {
          files: [
            {
              fallback: file.isFallback,
              folderId: file.folderId,
              title: file.title.replace(/ \*$/, ''),
              ...(file.isFallback ? {} : { fileId: file.id }),
            },
          ],
        },
      });
      setSuccessMessage('Review request submitted to Applications.');
    } catch {
      setError('Unable to create review request.');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const getCanvasPoint = (event: ReactPointerEvent<HTMLDivElement>): NormalizedPoint => {
    const bounds = event.currentTarget.getBoundingClientRect();

    return {
      x: Math.min(1, Math.max(0, (event.clientX - bounds.left) / bounds.width)),
      y: Math.min(1, Math.max(0, (event.clientY - bounds.top) / bounds.height)),
    };
  };

  const buildRegion = (start: NormalizedPoint, end: NormalizedPoint): FileTaskRegion => ({
    endX: Math.max(start.x, end.x),
    endY: Math.max(start.y, end.y),
    startX: Math.min(start.x, end.x),
    startY: Math.min(start.y, end.y),
  });

  const handleCanvasPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!annotationMode && !frameAnnotationMode) {
      return;
    }

    event.currentTarget.setPointerCapture(event.pointerId);
    const point = getCanvasPoint(event);
    setAnnotationStart(point);
    setDraftRegion(buildRegion(point, point));
    if (annotationMode) {
      setSelectedTaskId(null);
    }
  };

  const handleCanvasPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if ((!annotationMode && !frameAnnotationMode) || !annotationStart) {
      return;
    }

    setDraftRegion(buildRegion(annotationStart, getCanvasPoint(event)));
  };

  const handleCanvasPointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    if ((!annotationMode && !frameAnnotationMode) || !annotationStart) {
      return;
    }

    const region = buildRegion(annotationStart, getCanvasPoint(event));
    setAnnotationStart(null);

    if (region.endX - region.startX < 0.02 || region.endY - region.startY < 0.02) {
      setDraftRegion(null);
      return;
    }

    setDraftRegion(region);
    if (frameAnnotationMode) {
      setPendingFrameRegion(region);
      setFrameAnnotationMode(false);
    } else {
      setPendingTaskRegion(region);
      setAnnotationMode(false);
      setTaskCreationScope('REGION');
      setTaskDialogOpen(true);
    }
  };

  const handleCreateAnnotatedTask = (task: FileTaskItem) => {
    setTasks((currentTasks) => [...currentTasks, task]);
    focusFileTask(task);
    setPendingTaskRegion(null);
    setDraftRegion(null);
    setTaskDialogOpen(false);
  };

  const focusFileTask = (task: FileTaskItem | null) => {
    setSelectedTaskId(task?.id ?? null);
    setSelectedSubmissionId(null);
    setSelectedVersion(null);
    setFrameAnnotationMode(false);

    if (!task) {
      setFocusedTask(null);
      return;
    }

    const overrides = readTaskOverrides();
    const existingWorkspaceTask =
      overrides[task.id] ??
      readStoredTasks().find((candidate) => candidate.id === task.id) ??
      fallbackProjectTasks.find((candidate) => candidate.id === task.id);

    setFocusedTask(
      existingWorkspaceTask ?? {
        assignee: task.assignedTo,
        description: task.description,
        dueDate: task.dueDate ?? 'No due date *',
        fileId,
        fileTitle: file?.title ?? `File #${fileId} *`,
        id: task.id,
        isFallback: true,
        isMine: /current|sarah/i.test(task.assignedTo),
        previewUrl: file?.previewUrl ?? '',
        priority: 'MEDIUM',
        region: task.region,
        status: task.status,
        submissions: [],
        title: task.title,
        updatedAt: 'Just now *',
      },
    );
  };

  const handleFocusedTaskChange = (nextTask: TaskWorkspaceItem) => {
    const addedSubmission = nextTask.submissions.find(
      (submission) => !focusedTask?.submissions.some((current) => current.id === submission.id),
    );
    const newlyApprovedSubmission = nextTask.submissions.find(
      (submission) =>
        submission.status === 'APPROVED' &&
        focusedTask?.submissions.find((current) => current.id === submission.id)?.status !== 'APPROVED',
    );

    setFocusedTask(nextTask);
    writeTaskOverride(nextTask);
    if (addedSubmission) {
      setSelectedSubmissionId(addedSubmission.id);
    }
    if (newlyApprovedSubmission) {
      setFile((currentFile) =>
        currentFile
          ? {
              ...currentFile,
              previewUrl: newlyApprovedSubmission.previewUrl ?? currentFile.previewUrl,
              status: 'DONE',
              updatedAt: new Date().toISOString(),
            }
          : currentFile,
      );
      setSelectedSubmissionId(null);
      setSuccessMessage('Submission approved. It is now displayed as the current file in UI preview mode. *');
    }
    setTasks((currentTasks) =>
      currentTasks.map((task) =>
        task.id === nextTask.id
          ? {
              ...task,
              assignedTo: nextTask.assignee,
              description: nextTask.description,
              region: nextTask.region,
              status: nextTask.status,
              title: nextTask.title,
            }
          : task,
      ),
    );
  };

  const handleCreateFrameComment = (comment: SubmissionFrameComment) => {
    setFrameComments((currentComments) => [...currentComments, comment]);
    setPendingFrameRegion(null);
    setDraftRegion(null);
  };

  if (isLoading) {
    return (
      <div className="grid min-h-[70vh] place-items-center text-sm font-bold text-[#aeb7c2]">
        Loading file workspace...
      </div>
    );
  }

  if (!file) {
    return (
      <div className="grid min-h-[70vh] place-items-center px-6 text-center">
        <div>
          <FileQuestion className="mx-auto size-10 text-[#5b626d]" />
          <p className="mt-4 text-base font-black text-white">File detail unavailable</p>
          <p className="mt-2 text-sm font-medium text-[#aeb7c2]">{error}</p>
          <Link
            className="mt-5 inline-flex h-9 items-center gap-2 rounded-[4px] border border-[#4b535f] px-4 text-xs font-black text-white hover:bg-[#303842]"
            href={`/studio/projects/${projectId}/files`}
          >
            <ArrowLeft className="size-4" />
            Back to Files
          </Link>
        </div>
      </div>
    );
  }

  const folder = folders.find((candidate) => candidate.id === file.folderId);
  const selectedSubmission =
    focusedTask?.submissions.find((submission) => submission.id === selectedSubmissionId) ?? null;
  const displayedPreviewUrl =
    selectedSubmission?.previewUrl ?? selectedVersion?.previewUrl ?? file.previewUrl;
  const isViewingHistoricalVersion = selectedVersion && !selectedVersion.isCurrent;
  const visibleFrameComments = selectedSubmissionId
    ? frameComments.filter((comment) => comment.submissionId === selectedSubmissionId)
    : [];
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
      : `File: ${file.title}`;

  return (
    <section className="min-h-full bg-[#101820]">
      <header className="flex min-h-12 flex-wrap items-center gap-2 border-b border-[#26303b] bg-[#151c25] px-5 py-2 text-xs font-bold text-[#8b94a1]">
        <Link
          className="flex items-center gap-2 text-[#dce7f3] hover:text-white"
          href={focusedTask ? `/studio/projects/${projectId}/tasks` : `/studio/projects/${projectId}/files`}
        >
          <ArrowLeft className="size-4" />
          {focusedTask ? 'Tasks' : 'Files'}
        </Link>
        <span>/</span>
        <span>{folder?.title ?? 'Unknown folder'}</span>
        <span>/</span>
        <span className="min-w-0 truncate text-[#FFD369]">{file.title}</span>
      </header>

      {error ? (
        <p className="mx-5 mt-4 rounded-[4px] border border-red-400/30 bg-red-950/20 px-4 py-3 text-xs font-bold text-red-300">
          {error}
        </p>
      ) : null}
      {successMessage ? (
        <button
          className="mx-5 mt-4 block rounded-[4px] border border-[#315846] bg-[#14291f] px-4 py-3 text-left text-xs font-bold text-[#9df2c7]"
          onClick={() => setSuccessMessage(null)}
          type="button"
        >
          {successMessage}
        </button>
      ) : null}

      <div className="grid min-h-[calc(100vh-7rem)] xl:grid-cols-[minmax(0,1fr)_360px]">
        <main className="min-w-0 bg-[#091018]">
          <div className="p-5 lg:p-8">
            <div className="mx-auto max-w-6xl">
              <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 text-base font-black text-white">
                    <FileText className="size-5 text-[#FFD369]" />
                    {file.title}
                  </div>
                  <p className="mt-1 max-w-3xl text-xs font-medium leading-5 text-[#aeb7c2]">
                    {file.description ?? 'No description provided.'}
                  </p>
                </div>
                {displayedPreviewUrl ? (
                  <Badge className="rounded-[3px] border border-[#6c5516] bg-[#30270d] text-[#ffd35b]">
                    {isViewingHistoricalVersion
                      ? `Viewing v${selectedVersion.version} *`
                      : 'Preview fallback *'}
                  </Badge>
                ) : null}
              </div>

              {focusedTask ? (
                <div className="mb-3 flex min-h-10 items-center gap-1 overflow-x-auto border border-[#303842] bg-[#0d151e] p-1">
                  <button
                    className={`h-8 shrink-0 px-3 text-[10px] font-black ${
                      !selectedSubmissionId && !isViewingHistoricalVersion
                        ? 'bg-[#303842] text-[#FFD369]'
                        : 'text-[#aeb7c2] hover:bg-[#17202b] hover:text-white'
                    }`}
                    onClick={() => {
                      setSelectedSubmissionId(null);
                      setSelectedVersion(null);
                      setFrameAnnotationMode(false);
                    }}
                    type="button"
                  >
                    Current · {fallbackFileWorkspaceMeta.version}
                  </button>
                  {focusedTask.submissions.map((submission, index) => (
                    <button
                      className={`h-8 shrink-0 px-3 text-[10px] font-black ${
                        selectedSubmissionId === submission.id
                          ? 'bg-[#30270d] text-[#FFD369]'
                          : 'text-[#aeb7c2] hover:bg-[#17202b] hover:text-white'
                      }`}
                      key={submission.id}
                      onClick={() => {
                        setSelectedSubmissionId(submission.id);
                        setSelectedVersion(null);
                        setFrameAnnotationMode(false);
                      }}
                      type="button"
                    >
                      Submission #{focusedTask.submissions.length - index}
                      {submission.status === 'PENDING_REVIEW' ? ' · Review' : ''}
                    </button>
                  ))}
                </div>
              ) : null}

              {isViewingHistoricalVersion ? (
                <div className="mb-3 flex items-center justify-between gap-3 rounded-[4px] border border-[#6c5516] bg-[#30270d] px-4 py-3">
                  <div>
                    <p className="text-xs font-black text-[#ffd35b]">
                      Viewing v{selectedVersion.version} · Read only *
                    </p>
                    <p className="mt-1 text-[10px] font-bold text-[#d9bd70]">{selectedVersion.note}</p>
                  </div>
                  <Button
                    className="h-8 rounded-[4px] border-[#806719] bg-[#101820] px-3 text-[10px] font-black text-white hover:bg-[#303842]"
                    onClick={() => setSelectedVersion(null)}
                    variant="outline"
                  >
                    Back to Current
                  </Button>
                </div>
              ) : null}

              {frameAnnotationMode ? (
                <p className="mb-3 border border-[#6c5516] bg-[#30270d] px-3 py-2 text-[10px] font-bold text-[#ffd35b]">
                  Drag a rectangle on the submission to place a review comment.
                </p>
              ) : null}

              <div className="mb-3 flex h-10 items-center justify-between gap-3 border border-[#26303b] bg-[#0d151e] px-3">
                <div className="flex items-center gap-1">
                  <ToolbarButton label="Zoom out">
                    <Minus className="size-4" />
                  </ToolbarButton>
                  <span className="grid h-7 min-w-14 place-items-center rounded-[3px] bg-[#151c25] px-2 text-[10px] font-black text-[#dce7f3]">
                    100%
                  </span>
                  <ToolbarButton label="Zoom in">
                    <Plus className="size-4" />
                  </ToolbarButton>
                  <ToolbarButton label="Fit canvas">
                    <Maximize2 className="size-4" />
                  </ToolbarButton>
                </div>
                <div className="flex items-center gap-1">
                  <ToolbarButton
                    label="Comment"
                    onClick={() =>
                      document.getElementById('sidebar-discussion')?.scrollIntoView({ behavior: 'smooth' })
                    }
                  >
                    <MessageSquare className="size-4" />
                  </ToolbarButton>
                  <ToolbarButton
                    active={annotationMode}
                    label="Region task"
                    onClick={() => {
                      setTaskCreationScope('REGION');
                      setSelectedVersion(null);
                      setSelectedSubmissionId(null);
                      setFrameAnnotationMode(false);
                      setPendingFrameRegion(null);
                      setPendingTaskRegion(null);
                      setDraftRegion(null);
                      setAnnotationStart(null);
                      setAnnotationMode((current) => !current);
                    }}
                  >
                    <ScanLine className="size-4" />
                  </ToolbarButton>
                </div>
              </div>

              <div
                className={`relative grid aspect-[16/10] max-h-[680px] w-full touch-none place-items-center overflow-hidden rounded-[4px] border bg-[#111923] shadow-[0_20px_60px_rgba(0,0,0,0.35)] ${
                  annotationMode || frameAnnotationMode
                    ? 'cursor-crosshair border-[#FFD369]'
                    : 'border-[#303842]'
                }`}
                onPointerDown={handleCanvasPointerDown}
                onPointerMove={handleCanvasPointerMove}
                onPointerUp={handleCanvasPointerUp}
                ref={canvasRef}
                style={
                  displayedPreviewUrl
                    ? {
                        backgroundImage: `url(${displayedPreviewUrl})`,
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat',
                        backgroundSize: 'contain',
                      }
                    : undefined
                }
              >
                {!displayedPreviewUrl ? (
                  <div className="px-6 text-center">
                    <FileQuestion className="mx-auto size-10 text-[#5b626d]" />
                    <p className="mt-3 text-sm font-black text-white">Preview unavailable</p>
                    <p className="mt-1 text-xs font-bold text-[#8b94a1]">
                      FileMaterial does not currently provide a reachable media URL.
                    </p>
                  </div>
                ) : null}

                {tasks.map((task, taskIndex) =>
                  task.region ? (
                    <button
                      aria-label={`Open task ${task.title}`}
                      className={`absolute border-2 bg-[#FFD369]/10 text-left transition-all ${
                        selectedTaskId === task.id
                          ? 'z-20 border-[#FFD369] bg-[#FFD369]/20'
                          : selectedTaskId
                            ? 'z-10 border-[#FFD369]/30 opacity-35 hover:opacity-75'
                            : 'z-10 border-[#FFD369]/70 hover:bg-[#FFD369]/20'
                      }`}
                      key={task.id}
                      onClick={(event) => {
                        event.stopPropagation();
                        focusFileTask(task);
                      }}
                      onPointerDown={(event) => event.stopPropagation()}
                      style={{
                        height: `${(task.region.endY - task.region.startY) * 100}%`,
                        left: `${task.region.startX * 100}%`,
                        top: `${task.region.startY * 100}%`,
                        width: `${(task.region.endX - task.region.startX) * 100}%`,
                      }}
                      type="button"
                    >
                      <span className="absolute -left-3 -top-3 grid size-6 place-items-center rounded-full border-2 border-[#101820] bg-[#FFD369] text-[10px] font-black text-[#222831]">
                        {taskIndex + 1}
                      </span>
                    </button>
                  ) : null,
                )}

                {visibleFrameComments.map((comment, index) => (
                  <button
                    aria-label={`Open frame comment ${index + 1}`}
                    className="absolute z-30 border-2 border-[#ff9ab3] bg-[#6b2637]/20 text-left hover:bg-[#6b2637]/35"
                    key={comment.id}
                    onClick={(event) => {
                      event.stopPropagation();
                      requestAnimationFrame(() =>
                        document.getElementById('sidebar-discussion')?.scrollIntoView({ behavior: 'smooth' }),
                      );
                    }}
                    onPointerDown={(event) => event.stopPropagation()}
                    style={{
                      height: `${(comment.region.endY - comment.region.startY) * 100}%`,
                      left: `${comment.region.startX * 100}%`,
                      top: `${comment.region.startY * 100}%`,
                      width: `${(comment.region.endX - comment.region.startX) * 100}%`,
                    }}
                    type="button"
                  >
                    <span className="absolute -left-3 -top-3 grid size-6 place-items-center rounded-full border-2 border-[#101820] bg-[#ff9ab3] text-[9px] font-black text-[#371522]">
                      F{index + 1}
                    </span>
                  </button>
                ))}

                {draftRegion ? (
                  <div
                    className="pointer-events-none absolute z-30 border-2 border-dashed border-[#FFD369] bg-[#FFD369]/15"
                    style={{
                      height: `${(draftRegion.endY - draftRegion.startY) * 100}%`,
                      left: `${draftRegion.startX * 100}%`,
                      top: `${draftRegion.startY * 100}%`,
                      width: `${(draftRegion.endX - draftRegion.startX) * 100}%`,
                    }}
                  />
                ) : null}
              </div>
            </div>
          </div>

          <section className="border-t border-[#26303b] bg-[#0d151e]">
            <div className="border-b border-[#26303b] px-5 lg:px-8">
              <div className="mx-auto flex h-11 max-w-6xl items-center gap-1">
                {(['versions', 'materials', 'activity'] as const).map((tab) => (
                  <button
                    className={`relative h-full px-4 text-xs font-black capitalize ${
                      resourceTab === tab
                        ? 'text-[#FFD369]'
                        : 'text-[#aeb7c2] hover:text-white'
                    }`}
                    key={tab}
                    onClick={() => setResourceTab(tab)}
                    type="button"
                  >
                    {tab}
                    {resourceTab === tab ? (
                      <span className="absolute inset-x-0 bottom-[-1px] h-[2px] bg-[#FFD369]" />
                    ) : null}
                  </button>
                ))}
              </div>
            </div>
            <div className="mx-auto max-w-6xl p-5 lg:p-8">
              {resourceTab === 'activity' ? (
                <FileActivityPanel />
              ) : resourceTab === 'materials' ? (
                <div>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-sm font-black text-white">
                      <Layers3 className="size-4 text-[#FFD369]" /> References & Materials
                    </div>
                    <span className="text-[10px] font-black text-[#8b94a1]">{fallbackMaterials.length} assets *</span>
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {fallbackMaterials.map((material, index) => (
                      <article className="flex min-h-24 items-center gap-3 border border-[#303842] bg-[#151c25] p-3" key={material.id}>
                        <span className="grid size-14 shrink-0 place-items-center border border-[#39424f] bg-[#202832] text-lg font-black text-[#FFD369]">{index + 1}</span>
                        <div className="min-w-0"><p className="truncate text-xs font-black text-white">{material.name}</p><p className="mt-2 text-[10px] font-black uppercase text-[#8b94a1]">{material.type}</p></div>
                      </article>
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-sm font-black text-white"><History className="size-4 text-[#FFD369]" /> Version History *</div>
                    <Button className="h-8 text-[10px] font-black text-[#FFD369]" onClick={() => setVersionHistoryOpen(true)} variant="ghost">View All</Button>
                  </div>
                  <div className="mt-4 grid gap-3 md:grid-cols-3">
                    {fallbackFileVersions.slice(0, 3).map((version) => (
                      <button className="border border-[#303842] bg-[#151c25] p-4 text-left hover:border-[#FFD369]/60" key={version.id} onClick={() => { setSelectedSubmissionId(null); setSelectedVersion(version); }} type="button">
                        <span className="text-sm font-black text-white">v{version.version}</span>
                        {version.isCurrent ? <Badge className="ml-2 border-[#315846] bg-[#14291f] text-[#9df2c7]">Current</Badge> : null}
                        <span className="mt-2 block truncate text-[10px] font-bold text-[#aeb7c2]">{version.note}</span>
                        <span className="mt-1 block text-[9px] text-[#8b94a1]">{version.createdAt}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        </main>

        <aside className="flex flex-col border-l border-[#26303b] bg-[#0d151e] xl:h-[calc(100vh-7rem)]">
          <section className="relative shrink-0 border-b border-[#26303b] px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-xs font-black text-white">{file.title}</p>
                <p className="mt-1 text-[9px] font-bold text-[#8b94a1]">
                  {fallbackFileWorkspaceMeta.version} · {formatFileDate(file.updatedAt)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={`rounded-[3px] border text-[9px] ${fileStatusClassName[file.status]}`}>
                  {fileStatusLabels[file.status]}
                </Badge>
                <details className="group relative">
                  <summary className="grid size-7 cursor-pointer list-none place-items-center border border-[#39424f] text-[11px] font-black text-[#FFD369] hover:bg-[#303842]">i</summary>
                  <div className="absolute right-0 top-9 z-50 w-64 border border-[#39424f] bg-[#101820] p-4 shadow-2xl">
                    <p className="text-[10px] font-black uppercase tracking-[0.08em] text-white">File Information</p>
                    <dl className="mt-3 grid grid-cols-2 gap-3">
                      {[
                        ['Type', file.category],
                        ['Version', fallbackFileWorkspaceMeta.version],
                        ['Assigned', fallbackFileWorkspaceMeta.assignedTo],
                        ['Due Date', fallbackFileWorkspaceMeta.dueDate],
                        ['Folder', folder?.title ?? 'Unknown'],
                        ['Review', fallbackFileWorkspaceMeta.reviewStatus],
                      ].map(([label, value]) => <div key={label}><dt className="text-[8px] font-black uppercase text-[#8b94a1]">{label}</dt><dd className="mt-1 truncate text-[10px] font-bold text-white">{value}</dd></div>)}
                    </dl>
                    <div className="mt-4 border-t border-[#303842] pt-3">
                      <CreateFileReviewDialog
                        file={file}
                        isSubmitting={isSubmittingReview}
                        onSubmit={handleCreateReview}
                      />
                    </div>
                  </div>
                </details>
              </div>
            </div>
          </section>

          <section className="shrink-0 border-b border-[#26303b] p-4">
            <FileTasksPanel
              annotationMode={annotationMode}
              canCreateTask={canCreateTask}
              onCreateWholeTask={() => {
                setTaskCreationScope('WHOLE_FILE');
                setPendingTaskRegion(null);
                setDraftRegion(null);
                setAnnotationMode(false);
                setTaskDialogOpen(true);
              }}
              onSelectTask={(taskId) => {
                focusFileTask(tasks.find((task) => task.id === taskId) ?? null);
                canvasRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }}
              onStartAnnotation={() => {
                setTaskCreationScope('REGION');
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
              }}
              selectedTaskId={selectedTaskId}
              tasks={tasks}
            />
          </section>

          {focusedTask ? (
            <section className="shrink-0 border-b border-[#26303b] bg-[#101820] p-4">
              <FocusedTaskWorkspace
                canReview={canReviewTask}
                canSubmit={canSubmitTask}
                onStartFrameComment={() => {
                  setAnnotationMode(false);
                  setPendingTaskRegion(null);
                  setDraftRegion(null);
                  setAnnotationStart(null);
                  setFrameAnnotationMode(true);
                }}
                onTaskChange={handleFocusedTaskChange}
                selectedSubmissionId={selectedSubmissionId}
                task={focusedTask}
              />
            </section>
          ) : null}

          <section className="min-h-[180px] flex-1 overflow-y-auto p-4" id="sidebar-discussion">
            {focusedTask ? (
              <FileCommentsPanel
                contextKey={discussionContextKey}
                contextLabel={discussionContextLabel}
                frameComments={visibleFrameComments}
                onSelectFrame={(comment) => {
                  setSelectedSubmissionId(comment.submissionId);
                  canvasRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }}
              />
            ) : (
              <div>
                <h2 className="text-xs font-black uppercase tracking-[0.08em] text-white">Discussion</h2>
                <p className="mt-3 border border-[#303842] bg-[#151c25] px-3 py-5 text-center text-[10px] font-bold leading-4 text-[#8b94a1]">
                  Select a task to open its discussion.
                </p>
              </div>
            )}
          </section>
        </aside>
      </div>

      <VersionHistoryDrawer
        onOpenChange={setVersionHistoryOpen}
        onViewVersion={setSelectedVersion}
        open={versionHistoryOpen}
        versions={fallbackFileVersions}
      />
      <CreateAnnotatedTaskDialog
        onCancel={() => {
          setPendingTaskRegion(null);
          setDraftRegion(null);
          setAnnotationMode(false);
          setTaskDialogOpen(false);
        }}
        onCreate={handleCreateAnnotatedTask}
        open={taskDialogOpen}
        region={pendingTaskRegion}
        scope={taskCreationScope}
      />
      <CreateFrameCommentDialog
        onCancel={() => {
          setPendingFrameRegion(null);
          setDraftRegion(null);
          setFrameAnnotationMode(false);
        }}
        onCreate={handleCreateFrameComment}
        region={pendingFrameRegion}
        submissionId={selectedSubmissionId}
      />
    </section>
  );
}

function ToolbarButton({
  active = false,
  children,
  label,
  onClick,
}: {
  active?: boolean;
  children: ReactNode;
  label: string;
  onClick?: () => void;
}) {
  return (
    <Button
      aria-label={label}
      className={`size-7 rounded-[3px] ${
        active ? 'bg-[#303842] text-[#FFD369]' : 'text-[#aeb7c2] hover:bg-[#17202b] hover:text-white'
      }`}
      onClick={onClick}
      size="icon"
      title={label}
      type="button"
      variant="ghost"
    >
      {children}
    </Button>
  );
}
