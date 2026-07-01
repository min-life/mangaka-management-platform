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
  ChevronLeft,
  ChevronRight,
  FileQuestion,
  FileText,
  History,
  Layers3,
  Maximize2,
  MessageCircle,
  MessageSquare,
  Minus,
  Plus,
  ScanLine,
  RotateCw,
  X,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { createProjectApplication, type ApplicationType } from '@/services/application.service';
import { getFileById, getFileMaterialVersions, createMaterial, getFileTasks, getFileComments, createFileTask, createFileComment } from '@/services/file.service';
import { getProjectFolders, getProjectMembers, type ProjectFolderResponse } from '@/services/project.service';
import { updateTask, createTaskFrame, getTaskFrames } from '@/services/task.service';

import { CreateFileReviewDialog } from '../CreateFileReviewDialog';
import {
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
  type TaskWorkspaceItem,
} from '../../tasks/task-ui';

type ResourceTab = 'overview' | 'discussion' | 'versions' | 'activity';
type NormalizedPoint = { x: number; y: number };

type FileMaterialVersionRecord = {
  createdAt: string;
  createdByUser?: {
    displayName?: string | null;
    email?: string | null;
  } | null;
  id: number | string;
  materials: Array<{
    isThumbnail?: boolean;
    url?: string;
  }>;
};

function buildStableMaterialVersions(rawVersions: FileMaterialVersionRecord[]) {
  const versionsByAge = [...rawVersions].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
  const newestId = versionsByAge.at(-1)?.id;

  return versionsByAge
    .map((versionRecord, index) => {
      const versionNumber = index + 1;
      const thumbnailMaterial =
        versionRecord.materials.find((material) => material.isThumbnail) ||
        versionRecord.materials[0];

      return {
        author:
          versionRecord.createdByUser?.displayName ||
          versionRecord.createdByUser?.email ||
          'Unknown',
        createdAt: formatFileDate(versionRecord.createdAt),
        id: String(versionRecord.id),
        isCurrent: versionRecord.id === newestId,
        materials: versionRecord.materials,
        note: `Version ${versionNumber}`,
        previewUrl: thumbnailMaterial?.url,
        version: versionNumber,
      } as FileVersionItem;
    })
    .reverse();
}

type FileDetailClientProps = {
  fileId: number;
  focusedTaskId: string | null;
  projectId: number;
};

export function FileDetailClient({ fileId, focusedTaskId, projectId }: FileDetailClientProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const lastProcessedTaskIdRef = useRef<string | null | undefined>(undefined);
  const [file, setFile] = useState<FileExplorerItem | null>(null);
  const [folders, setFolders] = useState<ProjectFolderResponse[]>([]);
  const [tasks, setTasks] = useState<FileTaskItem[]>([]);
  const [resourceTab, setResourceTab] = useState<ResourceTab>('versions');
  const [selectedVersion, setSelectedVersion] = useState<FileVersionItem | null>(null);
  const [versions, setVersions] = useState<FileVersionItem[]>([]);
  const [versionHistoryOpen, setVersionHistoryOpen] = useState(false);
  const [annotationMode, setAnnotationMode] = useState(false);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [frameAnnotationMode, setFrameAnnotationMode] = useState(false);
  const [annotationStart, setAnnotationStart] = useState<NormalizedPoint | null>(null);
  const [draftRegion, setDraftRegion] = useState<FileTaskRegion | null>(null);
  const [pendingTaskRegion, setPendingTaskRegion] = useState<FileTaskRegion | null>(null);
  const [pendingFrameRegion, setPendingFrameRegion] = useState<FileTaskRegion | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [focusedTask, setFocusedTask] = useState<TaskWorkspaceItem | null>(null);
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null);
  const [frameComments, setFrameComments] = useState<SubmissionFrameComment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [versionTabMode, setVersionTabMode] = useState<'browse' | 'materials'>('browse');
  const [selectedVersionForMaterials, setSelectedVersionForMaterials] = useState<FileVersionItem | null>(null);
  const [mobileTasksOpen, setMobileTasksOpen] = useState(false);
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true);
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [comparisonOpacity, setComparisonOpacity] = useState(50);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [members, setMembers] = useState<{ id: number; name: string }[]>([]);

  const loadFile = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const folderResult = await getProjectFolders(projectId);
      const productionFolders = folderResult.folders;
      setFolders(productionFolders);

      try {
        const membersRes = await getProjectMembers(projectId);
        setMembers(
          (membersRes.members || []).map((m) => ({
            id: m.id,
            name: m.displayName || m.email,
          })),
        );
      } catch (err) {
        console.error('Failed to load project members:', err);
      }

      if (isNaN(Number(fileId)) || fileId < 0) {
        setError('File was not found in the current project workspace.');
        setIsLoading(false);
        return;
      }

      const response = await getFileById(fileId);
      const createdByLabel =
        response.createdByUser?.displayName ||
        response.createdByUser?.email ||
        (response.createdBy ? `User #${response.createdBy}` : 'Unknown user');

      let dbVersions: FileVersionItem[] = [];
      try {
        const versionsRes = await getFileMaterialVersions(fileId);
        const versionsArray = ((versionsRes as { data?: FileMaterialVersionRecord[] }).data ||
          versionsRes.versions ||
          []) as FileMaterialVersionRecord[];
        dbVersions = buildStableMaterialVersions(versionsArray);
      } catch (err) {
        console.error('Failed to load version history:', err);
      }

      setVersions(dbVersions);

      let dbTasks: FileTaskItem[] = [];
      try {
        const tasksRes = await getFileTasks(fileId);
        const tasksWithFramesPromises = (tasksRes || []).map(async (t: any) => {
          let region: FileTaskRegion | undefined = undefined;
          try {
            const frames = await getTaskFrames(t.id);
            const frame = frames[0];
            if (frame) {
              region = {
                endX: Number(frame.endX),
                endY: Number(frame.endY),
                startX: Number(frame.startX),
                startY: Number(frame.startY),
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

          // Parse submissions and clean description
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
            // Sort newest first so that the latest submission is auto-selected
            submissions.reverse();
          }

          const cleanDesc = rawDesc
            .replace(/\[Note:\s*([\s\S]*?)\]/g, '')
            .replace(/\[version:(v\d+)\]/g, '')
            .trim();

          return {
            assignedTo: t.assignedByUser?.displayName || t.assignedByUser?.email || 'Unassigned',
            description: cleanDesc,
            id: String(t.id),
            region,
            status: t.status,
            title: t.title,
            targetVersion: taskVersion,
            submissions,
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

      setTasks(dbTasks);

      let dbComments: SubmissionFrameComment[] = [];
      try {
        const commentsRes = await getFileComments(fileId);
        dbComments = (commentsRes || []).map((c: any) => {
          let text = '';
          let region = c.frame
            ? {
              endX: Number(c.frame.endX),
              endY: Number(c.frame.endY),
              startX: Number(c.frame.startX),
              startY: Number(c.frame.startY),
            }
            : undefined;
          let submissionId = String(c.applicationId || '');

          if (c.content && typeof c.content === 'object') {
            text = (c.content as any).text || '';
            if ((c.content as any).region) {
              region = (c.content as any).region;
            }
            if ((c.content as any).submissionId) {
              submissionId = String((c.content as any).submissionId);
            }
          } else {
            text = typeof c.content === 'string' ? c.content : JSON.stringify(c.content);
          }

          let commentVersion = (c.content as any)?.version;
          if (!commentVersion && dbVersions.length > 0 && c.createdAt) {
            const sorted = [...dbVersions].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
            const commentTime = new Date(c.createdAt).getTime();
            let matchedVer = sorted[0];
            for (const v of sorted) {
              if (new Date(v.createdAt).getTime() <= commentTime) {
                matchedVer = v;
              } else {
                break;
              }
            }
            if (matchedVer) {
              commentVersion = `v${matchedVer.version}`;
            }
          }

          return {
            author: c.createdByUser?.displayName || c.createdByUser?.email || 'Unknown User',
            content: text,
            id: String(c.id),
            region: region || { endX: 0, endY: 0, startX: 0, startY: 0 },
            submissionId: submissionId,
            taskId: String(c.taskId || (c.content as any)?.taskId || ''),
            version: String(commentVersion || ''),
            time: formatFileDate(c.createdAt),
          };
        });
      } catch (err) {
        console.error('Failed to load comments:', err);
      }

      setFrameComments(dbComments);

      // Default the main file preview to the current version's thumbnail or file's default preview url
      const currentVersionPreview = dbVersions.find((v) => v.isCurrent)?.previewUrl;

      let fileStatus: 'PENDING' | 'INPROGRESS' | 'REVIEW' | 'DONE' = 'PENDING';
      if (dbTasks.some((t: any) => t.status === 'REVIEW')) {
        fileStatus = 'REVIEW';
      } else if (dbTasks.some((t: any) => t.status === 'INPROGRESS')) {
        fileStatus = 'INPROGRESS';
      } else if (dbTasks.length > 0 && dbTasks.every((t: any) => t.status === 'DONE')) {
        fileStatus = 'DONE';
      }

      setFile({
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
        isMine: /current|sarah/i.test(dbTask.assignedTo),
        updatedAt: 'Just now',
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
  const canReviewTask = true;
  const canSubmitTask = true;
  const canCreateTask = true;

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
              folderId: file.folderId,
              title: file.title.replace(/ \*$/, ''),
              fileId: file.id,
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
      setIsPanning(true);
      setPanStart({ x: event.clientX - panOffset.x, y: event.clientY - panOffset.y });
      event.currentTarget.setPointerCapture(event.pointerId);
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
    if (isPanning) {
      setPanOffset({
        x: event.clientX - panStart.x,
        y: event.clientY - panStart.y,
      });
      return;
    }

    if ((!annotationMode && !frameAnnotationMode) || !annotationStart) {
      return;
    }

    setDraftRegion(buildRegion(annotationStart, getCanvasPoint(event)));
  };

  const handleCanvasPointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (isPanning) {
      setIsPanning(false);
      event.currentTarget.releasePointerCapture(event.pointerId);
      return;
    }

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
      setTaskDialogOpen(true);
    }
  };

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

  const handleCreateAnnotatedTask = async (
    task: FileTaskItem,
    options?: { assignedBy?: number; parentId?: number },
  ) => {
    try {
      const statusValue = task.status;
      let deadline: string | undefined = undefined;
      if (task.dueDate) {
        const cleanedDate = task.dueDate.replace(/\s*\*$/, '');
        const dateObj = new Date(cleanedDate);
        if (!isNaN(dateObj.getTime())) {
          deadline = dateObj.toISOString();
        }
      }

      const targetVersionTag = selectedVersion
        ? `v${selectedVersion.version}`
        : versions[0]
          ? `v${versions[0].version}`
          : 'v1';

      const createdTaskRes = await createFileTask(fileId, {
        title: task.title.replace(/\s*\*$/, ''),
        description: `${task.description.replace(/\s*\*$/, '')} [version:${targetVersionTag}]`,
        status: statusValue,
        deadline: deadline,
        assignedBy: options?.assignedBy,
        parentId: options?.parentId,
      });

      const newTaskId = createdTaskRes?.id;

      if (task.region && newTaskId) {
        await createTaskFrame(newTaskId, {
          startX: task.region.startX,
          startY: task.region.startY,
          endX: task.region.endX,
          endY: task.region.endY,
        });
      }

      await loadFile();
    } catch (err) {
      console.error('Failed to create task:', err);
      setError('Failed to create task on the server.');
    }
    setPendingTaskRegion(null);
    setDraftRegion(null);
    setTaskDialogOpen(false);
  };

  const focusFileTask = (task: FileTaskItem | null) => {
    setSelectedTaskId(task?.id ?? null);
    setSelectedSubmissionId(null);
    setFrameAnnotationMode(false);

    if (!task) {
      setFocusedTask(null);
      setSelectedVersion(null);
      return;
    }

    if (task.targetVersion) {
      const matchVersionItem = versions.find(
        (v) => `v${v.version}` === task.targetVersion
      );
      if (matchVersionItem) {
        setSelectedVersion(matchVersionItem);
      } else {
        setSelectedVersion(null);
      }
    } else {
      setSelectedVersion(null);
    }

    const workspaceTask: TaskWorkspaceItem = {
      assignee: task.assignedTo,
      description: task.description,
      dueDate: task.dueDate ?? 'No due date',
      fileId,
      fileTitle: file?.title ?? `File #${fileId}`,
      id: task.id,
      isMine: /current|sarah/i.test(task.assignedTo),
      previewUrl: file?.previewUrl ?? '',
      priority: 'MEDIUM',
      region: task.region,
      status: task.status,
      submissions: task.submissions || [],
      title: task.title,
      updatedAt: 'Just now',
      targetVersion: task.targetVersion,
      parent: task.parent ? {
        id: task.parent.id,
        title: task.parent.title,
        description: task.parent.description,
        status: task.parent.status,
      } : null,
    };

    setFocusedTask(workspaceTask);
    if (workspaceTask.submissions.length > 0 && workspaceTask.submissions[0].status === 'PENDING_REVIEW') {
      setSelectedSubmissionId(workspaceTask.submissions[0].id);
    } else {
      setSelectedSubmissionId(null);
    }
  };

  const handleFocusedTaskChange = async (nextTask: TaskWorkspaceItem) => {
    const addedSubmission = nextTask.submissions.find(
      (submission) => !focusedTask?.submissions.some((current) => current.id === submission.id),
    );
    const newlyApprovedSubmission = nextTask.submissions.find(
      (submission) =>
        submission.status === 'APPROVED' &&
        focusedTask?.submissions.find((current) => current.id === submission.id)?.status !== 'APPROVED',
    );

    setFocusedTask(nextTask);
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
      setSuccessMessage('Submission approved. It is now displayed as the current file in UI preview mode.');
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

    try {
      await updateTask(nextTask.id, {
        status: nextTask.status,
      });
    } catch (err) {
      console.error('Failed to update task status:', err);
    }
  };

  const handleSubmitTaskWork = async (input: { file: File; note: string }) => {
    if (!focusedTask) return;
    setIsLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('files', input.file);
      await createMaterial(fileId, formData);

      const versionsRes = await getFileMaterialVersions(fileId);
      const rawArray = ((versionsRes as { data?: FileMaterialVersionRecord[] }).data ||
        versionsRes.versions ||
        []) as FileMaterialVersionRecord[];
      const currentVersion = buildStableMaterialVersions(rawArray).find((version) => version.isCurrent);
      const targetVersionTag = `v${currentVersion?.version ?? rawArray.length}`;

      await updateTask(focusedTask.id, {
        status: 'REVIEW',
        description: `${focusedTask.description}\n[Note: ${input.note.trim()}] [version:${targetVersionTag}]`,
      });

      setSuccessMessage('Work submitted for review successfully. Created a new file material version.');
      await loadFile();
      setSelectedSubmissionId(null);
    } catch (err: any) {
      console.error('Failed to submit task work:', err);
      if (err.response?.status === 401) {
        setError('Your session has expired. Please log in again.');
      } else {
        setError('Failed to upload submission work.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateFrameComment = async (comment: SubmissionFrameComment) => {
    try {
      if (file) {
        await createFileComment(file.id, {
          text: comment.content,
          region: comment.region,
          submissionId: comment.submissionId || undefined,
          taskId: selectedTaskId || undefined,
          version: selectedVersion ? `v${selectedVersion.version}` : versions[0] ? `v${versions[0].version}` : 'v1',
        });
        await loadFile();
      }
    } catch (err) {
      console.error('Failed to create frame comment:', err);
      setError('Failed to save frame comment to server.');
    }
    setPendingFrameRegion(null);
    setDraftRegion(null);
    setFrameAnnotationMode(false);
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
  const currentVersionName = selectedVersion
    ? `v${selectedVersion.version}`
    : versions[0]
      ? `v${versions[0].version}`
      : 'v1';
  const visibleFrameComments = selectedSubmissionId
    ? frameComments.filter((comment) => comment.submissionId === selectedSubmissionId)
    : focusedTask
      ? frameComments.filter((comment) => comment.taskId === focusedTask.id && !comment.submissionId)
      : frameComments.filter((comment) => comment.version === currentVersionName && !comment.taskId && !comment.submissionId);
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
  const assignedToName = tasks.find((t) => t.assignedTo && t.assignedTo !== 'Unassigned')?.assignedTo || 'Unassigned';

  return (
    <section className="h-full flex flex-col overflow-hidden bg-[#101820]">

      {/* 2. File Header */}
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-[#26303b] bg-[#151c25] px-5 py-3 gap-4">
        <div className="flex items-center gap-3">
          <Link
            href={`/studio/projects/${projectId}/files`}
            className="flex items-center gap-1.5 text-xs font-black text-[#8b94a1] hover:text-white transition-colors mr-2 border border-[#39424f] px-2.5 py-1.5 rounded-[4px] bg-[#0d151e]/50 hover:bg-[#303842]"
          >
            <ArrowLeft className="size-3.5" />
            <span>Back</span>
          </Link>
          <FileText className="size-5 text-[#FFD369]" />
          <h1 className="text-base font-black text-white">{file.title}</h1>
        </div>

        <div className="flex items-center gap-3">
          <span className="rounded-[4px] border border-[#315846] bg-[#14291f] px-3 py-1.5 text-xs font-black text-[#9df2c7]">
            Current v{versions[0]?.version || 1}
          </span>

          <details className="group relative">
            <summary className="grid size-9 cursor-pointer list-none place-items-center border border-[#39424f] text-[16px] font-black text-[#FFD369] hover:bg-[#303842] select-none rounded-[4px] transition-colors">
              ···
            </summary>
            <div className="absolute right-0 top-11 z-50 w-64 border border-[#39424f] bg-[#101820] p-4 shadow-2xl rounded-[4px]">
              <p className="text-[10px] font-black uppercase tracking-[0.08em] text-white">File Information</p>
              <dl className="mt-3 grid grid-cols-2 gap-3 border-b border-[#303842] pb-3 mb-3">
                {[
                  ['Type', file.category],
                  ['Version', versions[0] ? `v${versions[0].version}` : 'v1'],
                  ['Assigned', assignedToName],
                  ['Folder', folder?.title ?? 'Unknown'],
                  ['Review', fileStatusLabels[file.status]],
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-[8px] font-black uppercase text-[#8b94a1]">{label}</dt>
                    <dd className="mt-1 truncate text-[10px] font-bold text-white">{value}</dd>
                  </div>
                ))}
              </dl>
              <div className="mt-2 text-left">
                <dt className="text-[8px] font-black uppercase text-[#8b94a1]">Description</dt>
                <dd className="mt-1 text-[10px] font-bold text-white max-h-16 overflow-y-auto leading-relaxed">
                  {file.description || 'No description provided.'}
                </dd>
              </div>
              <div className="mt-4 border-t border-[#303842] pt-3">
                <CreateFileReviewDialog
                  file={file}
                  isSubmitting={isSubmittingReview}
                  onSubmit={handleCreateReview}
                />
              </div>
            </div>
          </details>

          <Button
            className="h-9 bg-[#FFD369] text-[#222831] hover:bg-[#eac04f] text-xs font-black rounded-[4px] px-4 lg:hidden"
            onClick={() => {
              setMobileTasksOpen(true);
            }}
          >
            Tasks ({tasks.length})
          </Button>
        </div>
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

      <div className="flex flex-1 min-h-0 overflow-hidden relative">
        <main className="min-w-0 bg-[#091018] h-full overflow-y-auto relative flex-1">
          <div className="p-5 lg:p-8">
            <div className="mx-auto max-w-6xl">




              {/* Status & Review Banners */}
              {focusedTask && selectedSubmissionId ? (
                <div className="mb-3 flex items-center justify-between gap-3 rounded-[4px] border border-[#303842] bg-[#151c25] px-4 py-2.5">
                  <div>
                    <p className="text-xs font-black text-[#FFD369]">
                      Review Mode: Previewing Submission for &ldquo;{focusedTask.title}&rdquo;
                    </p>
                    <p className="mt-1 text-[10px] font-bold text-[#8b94a1]">
                      Submitted by {focusedTask.submissions.find(s => s.id === selectedSubmissionId)?.submittedBy || 'Assignee'}
                    </p>
                  </div>
                  <Badge className="rounded-[3px] border border-[#FFD369]/30 bg-[#2b2413] text-[9px] text-[#FFD369] font-black uppercase tracking-wider">
                    Reviewing Submission
                  </Badge>
                </div>
              ) : isViewingHistoricalVersion ? (
                <div className="mb-3 flex items-center justify-between gap-3 rounded-[4px] border border-[#6c5516] bg-[#30270d] px-4 py-3">
                  <div>
                    <p className="text-xs font-black text-[#ffd35b]">
                      Viewing v{selectedVersion.version} · Read only *
                    </p>
                    <p className="mt-1 text-[10px] font-bold text-[#d9bd70]">{selectedVersion.note}</p>
                  </div>
                  <Button
                    className="h-8 rounded-[4px] border-[#806719] bg-[#101820] px-3 text-[10px] font-black text-white hover:bg-[#303842]"
                    onClick={() => {
                      setSelectedVersion(null);
                      setSelectedSubmissionId(null);
                    }}
                    variant="outline"
                  >
                    Back to Current
                  </Button>
                </div>
              ) : tasks.some(t => t.status === 'REVIEW') ? (
                <div className="mb-3 flex items-center justify-between gap-3 rounded-[4px] border border-[#6c5516] bg-[#30270d]/60 px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <span className="size-2 rounded-full bg-[#FFD369] animate-pulse shrink-0" />
                    <span className="text-[10px] font-black text-white uppercase tracking-wider">
                      Task(s) pending review
                    </span>
                  </div>
                  <Button
                    className="h-7 rounded-[4px] border-[#806719] bg-[#FFD369] px-3 text-[9px] font-black text-[#222831] hover:bg-[#eac04f]"
                    onClick={() => {
                      const reviewTask = tasks.find(t => t.status === 'REVIEW');
                      if (reviewTask) {
                        focusFileTask(reviewTask);
                        canvasRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      }
                    }}
                  >
                    Review Now →
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
                  <ToolbarButton
                    label="Zoom out"
                    onClick={() => {
                      setZoom((prev) => {
                        const next = Math.max(50, prev - 25);
                        if (next === 100) setPanOffset({ x: 0, y: 0 });
                        return next;
                      });
                    }}
                  >
                    <Minus className="size-4" />
                  </ToolbarButton>
                  <span className="grid h-7 min-w-14 place-items-center rounded-[3px] bg-[#151c25] px-2 text-[10px] font-black text-[#dce7f3] select-none">
                    {zoom}%
                  </span>
                  <ToolbarButton
                    label="Zoom in"
                    onClick={() => setZoom((prev) => Math.min(300, prev + 25))}
                  >
                    <Plus className="size-4" />
                  </ToolbarButton>
                  <ToolbarButton
                    label="Fit Width"
                    onClick={() => {
                      setZoom((current) => (current === 200 ? 100 : 200));
                      setRotation(0);
                      setPanOffset({ x: 0, y: 0 });
                    }}
                  >
                    <Maximize2 className="size-4" />
                  </ToolbarButton>
                  <ToolbarButton
                    label="Rotate"
                    onClick={() => setRotation((prev) => (prev + 90) % 360)}
                  >
                    <RotateCw className="size-4" />
                  </ToolbarButton>

                  {isViewingHistoricalVersion && versions[0]?.previewUrl && (
                    <div className="flex items-center gap-2 border-l border-[#26303b] pl-3 ml-2">
                      <span className="text-[9px] font-black text-[#8b94a1] uppercase select-none">Compare Opacity:</span>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={comparisonOpacity}
                        onChange={(e) => setComparisonOpacity(Number(e.target.value))}
                        className="w-16 accent-[#FFD369] h-1 bg-[#26303b] rounded-lg appearance-none cursor-pointer"
                      />
                      <span className="text-[9px] font-black text-white w-7 text-right select-none">
                        {comparisonOpacity}%
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <ToolbarButton
                    label="Comment"
                    onClick={() => {
                      setResourceTab('discussion');
                      setTimeout(() => {
                        document.getElementById('discussion-section')?.scrollIntoView({ behavior: 'smooth' });
                      }, 100);
                    }}
                  >
                    <MessageCircle className="size-4" />
                  </ToolbarButton>
                  <ToolbarButton
                    active={frameAnnotationMode}
                    label="Frame Comment"
                    onClick={() => {
                      setPendingTaskRegion(null);
                      setPendingFrameRegion(null);
                      setDraftRegion(null);
                      setAnnotationStart(null);

                      if (!focusedTask) {
                        const reviewTask = tasks.find((t) => t.status === 'REVIEW');
                        if (reviewTask) {
                          focusFileTask(reviewTask);
                          setAnnotationMode(false);
                          setFrameAnnotationMode(true);
                        } else if (tasks.length > 0) {
                          const activeTask = tasks.find((t) => t.status !== 'DONE') || tasks[0];
                          focusFileTask(activeTask);
                          setAnnotationMode(false);
                          setFrameAnnotationMode(true);
                        } else {
                          setAnnotationMode(true);
                          setFrameAnnotationMode(false);
                          setSuccessMessage("To place a frame comment, please draw a region to create a task first.");
                        }
                      } else {
                        setAnnotationMode(false);
                        setFrameAnnotationMode((current) => !current);
                      }
                    }}
                  >
                    <MessageSquare className="size-4 text-[#FFD369]" />
                  </ToolbarButton>
                  <ToolbarButton
                    active={annotationMode}
                    label="Annotate"
                    onClick={() => {
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
                className={`relative grid aspect-[16/10] max-h-[680px] w-full touch-none place-items-center overflow-hidden rounded-[4px] border bg-[#111923] shadow-[0_20px_60px_rgba(0,0,0,0.35)] ${annotationMode || frameAnnotationMode
                    ? 'cursor-crosshair border-[#FFD369]'
                    : isPanning
                      ? 'cursor-grabbing border-[#303842]'
                      : 'cursor-grab border-[#303842]'
                  }`}
                onPointerDown={handleCanvasPointerDown}
                onPointerMove={handleCanvasPointerMove}
                onPointerUp={handleCanvasPointerUp}
                ref={canvasRef}
              >
                <div
                  className="w-full h-full absolute inset-0 origin-center"
                  style={{
                    transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom / 100}) rotate(${rotation}deg)`,
                    transition: isPanning ? 'none' : 'transform 0.15s ease-out',
                  }}
                >
                  {/* Layer 1: Underlay Current Version (displayed only during comparison of a historical version) */}
                  {isViewingHistoricalVersion && versions[0]?.previewUrl && (
                    <div
                      className="w-full h-full absolute inset-0 pointer-events-none"
                      style={{
                        backgroundImage: `url(${versions[0].previewUrl})`,
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat',
                        backgroundSize: 'contain',
                        opacity: 1,
                      }}
                    />
                  )}

                  {/* Layer 2: Main Image (Active Preview or Selected Version with custom comparison opacity) */}
                  {displayedPreviewUrl && (
                    <div
                      className="w-full h-full absolute inset-0 transition-opacity duration-150"
                      style={{
                        backgroundImage: `url(${displayedPreviewUrl})`,
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat',
                        backgroundSize: 'contain',
                        opacity: isViewingHistoricalVersion ? comparisonOpacity / 100 : 1,
                      }}
                    />
                  )}
                  {!displayedPreviewUrl ? (
                    <div className="absolute inset-0 grid place-items-center px-6 text-center">
                      <div>
                        <FileQuestion className="mx-auto size-10 text-[#5b626d]" />
                        <p className="mt-3 text-sm font-black text-white">Preview unavailable</p>
                        <p className="mt-1 text-xs font-bold text-[#8b94a1]">
                          FileMaterial does not currently provide a reachable media URL.
                        </p>
                      </div>
                    </div>
                  ) : null}

                  {tasks.map((task, taskIndex) => {
                    const canvasVersion = selectedVersion
                      ? `v${selectedVersion.version}`
                      : versions[0]
                        ? `v${versions[0].version}`
                        : 'v1';

                    if (task.region) {
                      if (task.targetVersion && task.targetVersion !== canvasVersion) {
                        return null;
                      }

                      return (
                        <button
                          aria-label={`Open task ${task.title}`}
                          className={`absolute border-2 bg-[#FFD369]/10 text-left transition-all ${selectedTaskId === task.id
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
                      );
                    }
                    return null;
                  })}

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
          </div>

          <section className="border-t border-[#26303b] bg-[#0d151e]" id="discussion-section">
            <div className="border-b border-[#26303b] px-5 lg:px-8">
              <div className="mx-auto flex h-11 max-w-6xl items-center gap-1">
                {(['overview', 'discussion', 'versions', 'activity'] as const).map((tab) => (
                  <button
                    className={`relative h-full px-4 text-xs font-black capitalize ${resourceTab === tab
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
              {resourceTab === 'overview' ? (
                <div className="text-white">
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="border border-[#303842] bg-[#151c25] p-5 rounded-[4px]">
                      <h3 className="text-xs font-black uppercase tracking-[0.08em] text-[#FFD369] mb-4">File Specification</h3>
                      <dl className="grid grid-cols-2 gap-4">
                        {[
                          ['File Type', file.category || 'Production File'],
                          ['Resolution', '3508 x 4960 px (B4 Page)'],
                          ['Color Mode', 'Grayscale (600 dpi)'],
                          ['Layers', '18 Layers'],
                          ['Uploaded By', file.createdByLabel],
                          ['Location', folder?.title ?? 'Production Folder'],
                        ].map(([label, value]) => (
                          <div key={label}>
                            <dt className="text-[8px] font-black uppercase text-[#8b94a1]">{label}</dt>
                            <dd className="mt-1 text-xs font-bold text-white">{value}</dd>
                          </div>
                        ))}
                      </dl>
                    </div>

                    <div className="border border-[#303842] bg-[#151c25] p-5 rounded-[4px]">
                      <h3 className="text-xs font-black uppercase tracking-[0.08em] text-[#FFD369] mb-4">Linked Tasks</h3>
                      {tasks.length > 0 ? (
                        <div className="space-y-3">
                          {tasks.map((task) => (
                            <div key={task.id} className="flex items-center justify-between border-b border-[#26303b] pb-2 last:border-0 last:pb-0">
                              <div>
                                <p className="text-xs font-black text-white">{task.title}</p>
                                <p className="text-[9px] text-[#8b94a1] mt-0.5">Assignee: {task.assignedTo}</p>
                              </div>
                              <Badge className={`rounded-[3px] border text-[8px] ${fileStatusClassName[task.status]}`}>
                                {fileStatusLabels[task.status]}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-[#8b94a1] italic">No tasks currently linked to this file.</p>
                      )}
                    </div>
                  </div>

                  {file.description && (
                    <div className="mt-6 border border-[#303842] bg-[#151c25] p-5 rounded-[4px]">
                      <h3 className="text-xs font-black uppercase tracking-[0.08em] text-[#FFD369] mb-2">Description</h3>
                      <p className="text-xs font-medium leading-5 text-[#dce7f3]">{file.description}</p>
                    </div>
                  )}
                </div>
              ) : resourceTab === 'discussion' ? (
                <div className="text-white max-w-4xl mx-auto">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-4 border-b border-[#26303b] pb-3">
                    <div>
                      <h3 className="text-sm font-black text-white">Task Discussion</h3>
                      <p className="text-[10px] text-[#8b94a1] mt-0.5">Select a task context below to discuss or view regional frame comments.</p>
                    </div>
                    <select
                      className="h-9 rounded-[4px] border border-[#39424f] bg-[#151c25] px-3 text-xs font-bold text-white outline-none"
                      value={discussionContextKey}
                      onChange={(e) => {
                        const key = e.target.value;
                        if (key === 'file') {
                          setSelectedTaskId(null);
                          setSelectedSubmissionId(null);
                        } else if (key.startsWith('task:')) {
                          const tid = key.split(':')[1];
                          const matchedTask = tasks.find(t => t.id === tid);
                          if (matchedTask) {
                            focusFileTask(matchedTask);
                          }
                        } else if (key.startsWith('submission:')) {
                          const sid = key.split(':')[1];
                          setSelectedSubmissionId(sid);
                        }
                      }}
                    >
                      <option value="file">Overall File Discussion</option>
                      {tasks.map((task) => (
                        <option key={task.id} value={`task:${task.id}`}>
                          Task: {task.title}
                        </option>
                      ))}
                      {focusedTask?.submissions.map((sub, idx) => (
                        <option key={sub.id} value={`submission:${sub.id}`}>
                          Submission #{focusedTask.submissions.length - idx} (Review)
                        </option>
                      ))}
                    </select>
                  </div>

                  <FileCommentsPanel
                    fileId={file.id}
                    taskId={focusedTask?.id ? Number(focusedTask.id) : null}
                    contextKey={discussionContextKey}
                    contextLabel={discussionContextLabel}
                    frameComments={visibleFrameComments}
                    onSelectFrame={(comment) => {
                      if (comment.submissionId) {
                        setSelectedSubmissionId(comment.submissionId);
                      } else {
                        setSelectedSubmissionId(null);
                      }
                      if (comment.taskId) {
                        const matchedTask = tasks.find(t => t.id === comment.taskId);
                        if (matchedTask) {
                          focusFileTask(matchedTask);
                        }
                      }
                      if (comment.version) {
                        const matchVersionItem = versions.find(
                          (v) => `v${v.version}` === comment.version
                        );
                        if (matchVersionItem) {
                          setSelectedVersion(matchVersionItem);
                        }
                      }
                      canvasRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }}
                  />
                </div>
              ) : resourceTab === 'versions' ? (
                <div>
                  {versionTabMode === 'browse' ? (
                    <div>
                      <div className="flex items-center justify-between gap-3 mb-4">
                        <div className="flex items-center gap-2 text-sm font-black text-white">
                          <History className="size-4 text-[#FFD369]" /> Version History
                        </div>
                        <Button
                          className="h-8 text-[10px] font-black text-[#FFD369]"
                          onClick={() => setVersionHistoryOpen(true)}
                          variant="ghost"
                        >
                          View All History
                        </Button>
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {versions.map((version) => {
                          const isViewingThis = selectedVersion
                            ? String(selectedVersion.id) === String(version.id)
                            : version.isCurrent;

                          return (
                            <div
                              className={`border p-4 flex flex-col justify-between rounded-[4px] cursor-pointer transition-all duration-150 ${isViewingThis
                                  ? 'border-[#FFD369] bg-[#1d2835]'
                                  : 'border-[#303842] bg-[#151c25] hover:border-[#FFD369]/50'
                                }`}
                              key={version.id}
                              onClick={() => {
                                setSelectedSubmissionId(null);
                                if (version.isCurrent) {
                                  setSelectedVersion(null);
                                } else {
                                  setSelectedVersion(version);
                                }
                              }}
                            >
                              <div>
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-sm font-black text-white">v{version.version}</span>
                                  {isViewingThis && (
                                    <Badge className="border-[#6c5516] bg-[#30270d] text-[#ffd35b] font-black text-[9px]">
                                      Viewing
                                    </Badge>
                                  )}
                                </div>
                                <span className="mt-2 block truncate text-[10px] font-bold text-[#aeb7c2]">
                                  {version.note}
                                </span>
                                <span className="mt-1 block text-[9px] text-[#8b94a1]">{version.createdAt}</span>
                              </div>
                              <div className="mt-4 flex gap-2">
                                <Button
                                  className="h-8 flex-1 text-[10px] font-black text-[#aeb7c2] border-[#39424f] hover:bg-[#303842] hover:text-white rounded-[4px] transition-colors"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedVersionForMaterials(version);
                                    setVersionTabMode('materials');
                                  }}
                                  variant="outline"
                                >
                                  Materials
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center justify-between gap-3 border-b border-[#26303b] pb-3 mb-4">
                        <Button
                          className="h-8 text-xs font-black text-[#aeb7c2] hover:text-white rounded-[4px]"
                          onClick={() => {
                            setVersionTabMode('browse');
                            setSelectedVersionForMaterials(null);
                          }}
                          variant="ghost"
                        >
                          ← Back to Versions
                        </Button>
                        <div className="text-right">
                          <span className="text-xs font-black text-white">Version v{selectedVersionForMaterials?.version}</span>
                          <p className="text-[9px] text-[#8b94a1] mt-0.5">{selectedVersionForMaterials?.createdAt}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-3 mb-4">
                        <div className="text-xs font-black text-white">Materials & Assets</div>
                        <div className="flex items-center gap-2">
                          <input
                            type="file"
                            id="material-upload-input"
                            className="hidden"
                            multiple
                            onChange={async (e) => {
                              const files = e.target.files;
                              if (!files || files.length === 0 || !selectedVersionForMaterials) return;
                              setIsSubmittingReview(true);
                              try {
                                const formData = new FormData();
                                for (let i = 0; i < files.length; i++) {
                                  formData.append('files', files[i]);
                                }
                                await createMaterial(file.id, formData);
                                setSuccessMessage('Material uploaded successfully.');
                                await loadFile();
                                setVersionTabMode('browse');
                                setSelectedVersionForMaterials(null);
                              } catch {
                                setError('Failed to upload material.');
                              } finally {
                                setIsSubmittingReview(false);
                              }
                            }}
                          />
                          <Button
                            className="h-8 bg-[#FFD369] text-[#222831] hover:bg-[#eac04f] text-[10px] font-black rounded-[4px]"
                            onClick={() => document.getElementById('material-upload-input')?.click()}
                            disabled={isSubmittingReview}
                          >
                            Attach Material
                          </Button>
                        </div>
                      </div>

                      {(() => {
                        const mats = (selectedVersionForMaterials as any)?.materials || [];
                        const psds = mats.filter((m: any) => (m.originalName || m.name || '').toLowerCase().endsWith('.psd'));
                        const pngs = mats.filter((m: any) => (m.originalName || m.name || '').toLowerCase().endsWith('.png') || (m.originalName || m.name || '').toLowerCase().endsWith('.jpg') || (m.originalName || m.name || '').toLowerCase().endsWith('.jpeg'));
                        const fontFiles = mats.filter((m: any) => /\.(ttf|otf|woff|woff2)$/i.test(m.originalName || m.name || ''));
                        const pdfs = mats.filter((m: any) => (m.originalName || m.name || '').toLowerCase().endsWith('.pdf'));
                        const others = mats.filter((m: any) => !psds.includes(m) && !pngs.includes(m) && !fontFiles.includes(m) && !pdfs.includes(m));

                        const renderGroup = (title: string, groupFiles: any[]) => {
                          if (groupFiles.length === 0) return null;
                          return (
                            <div className="mb-4">
                              <h4 className="text-[10px] font-black uppercase text-[#FFD369] tracking-wider mb-2">{title}</h4>
                              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                                {groupFiles.map((material, idx) => {
                                  const name = material.originalName || material.name;
                                  const sizeLabel = material.size ? `${(material.size / 1024 / 1024).toFixed(2)} MB` : 'Asset';
                                  const url = material.downloadUrl || material.url;
                                  return (
                                    <a
                                      key={material.id || idx}
                                      href={url}
                                      download={name}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-3 border border-[#303842] bg-[#151c25] p-3 hover:border-[#FFD369]/60 transition-colors rounded-[4px]"
                                    >
                                      <span className="grid size-9 shrink-0 place-items-center border border-[#39424f] bg-[#202832] text-[10px] font-black text-[#FFD369] rounded-[4px]">
                                        {idx + 1}
                                      </span>
                                      <div className="min-w-0">
                                        <p className="truncate text-xs font-black text-white">{name}</p>
                                        <p className="mt-1 text-[8px] font-black uppercase text-[#8b94a1]">{sizeLabel}</p>
                                      </div>
                                    </a>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        };

                        if (mats.length === 0) {
                          return <p className="text-xs text-[#8b94a1] italic text-center py-6">No materials attached to this version.</p>;
                        }

                        return (
                          <div className="space-y-6">
                            {renderGroup('PSD Files', psds)}
                            {renderGroup('PNG / Images', pngs)}
                            {renderGroup('Fonts', fontFiles)}
                            {renderGroup('PDF Documents', pdfs)}
                            {renderGroup('Other Materials', others)}
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
              ) : resourceTab === 'activity' ? (
                <FileActivityPanel fileId={file.id} />
              ) : null}
            </div>
          </section>
          {!desktopSidebarOpen && (
            <button
              onClick={() => setDesktopSidebarOpen(true)}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-40 hidden lg:grid place-items-center size-8 rounded-full border border-[#FFD369] bg-[#FFD369] text-[#222831] hover:bg-[#eac04f] transition-all shadow-[0_4px_12px_rgba(0,0,0,0.6)] group"
              title="Expand Sidebar"
            >
              <ChevronLeft className="size-4 transition-transform group-hover:-translate-x-0.5" />
            </button>
          )}
        </main>

        <aside className={`relative h-full overflow-visible flex flex-col border-l border-[#26303b] bg-[#0d151e] w-[320px] shrink-0 ${desktopSidebarOpen ? 'hidden lg:flex' : 'hidden'}`}>
          {/* Collapse Button */}
          <button
            onClick={() => setDesktopSidebarOpen(false)}
            className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 hidden lg:grid place-items-center size-8 rounded-full border border-[#FFD369] bg-[#FFD369] text-[#222831] hover:bg-[#eac04f] transition-all shadow-[0_4px_12px_rgba(0,0,0,0.6)] group"
            title="Collapse Sidebar"
          >
            <ChevronRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </button>

          <div className="flex-1 overflow-y-auto flex flex-col min-h-0">
            <section className="relative shrink-0 border-b border-[#26303b] px-4 py-3 bg-[#151c25]/30">
              <div className="flex items-center justify-between gap-3">
                <p className="truncate text-xs font-black uppercase tracking-[0.08em] text-white">Task Summary</p>
                <Badge className={`rounded-[3px] border text-[9px] ${fileStatusClassName[file.status]}`}>
                  {fileStatusLabels[file.status]}
                </Badge>
              </div>
            </section>

            <section className="shrink-0 border-b border-[#26303b] p-4">
              <FileTasksPanel
                annotationMode={annotationMode}
                canCreateTask={canCreateTask}
                onCreateTask={() => {
                  setPendingTaskRegion(null);
                  setDraftRegion(null);
                  setAnnotationMode(false);
                  setTaskDialogOpen(true);
                }}
                onSelectTask={(taskId) => {
                  focusFileTask(tasks.find((task) => task.id === taskId) ?? null);
                  canvasRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }}
                selectedTaskId={selectedTaskId}
                tasks={tasks}
              />
            </section>

            {focusedTask ? (
              <section className="bg-[#101820] p-4">
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
                  onSubmitWork={handleSubmitTaskWork}
                  selectedSubmissionId={selectedSubmissionId}
                  task={focusedTask}
                  targetVersion={focusedTask.targetVersion || (versions[0] ? `v${versions[0].version}` : 'v1')}
                  onClose={() => focusFileTask(null)}
                />
              </section>
            ) : (
              <section className="grid place-items-center bg-[#101820]/30 p-4 text-center min-h-[200px]">
                <p className="text-xs font-bold text-[#8b94a1]">Select a task from the list above to view details, submit updates, or review actions.</p>
              </section>
            )}
          </div>

          <div className="mt-auto py-3 border-t border-[#26303b] text-center bg-[#151c25]/10 shrink-0">
            <p className="text-[10px] text-[#8b94a1] font-bold">
              {selectedVersion ? `v${selectedVersion.version}` : versions[0] ? `v${versions[0].version}` : 'v1'} · {selectedVersion ? selectedVersion.createdAt : versions[0] ? versions[0].createdAt : 'Today'}
            </p>
          </div>
        </aside>

        {/* Mobile Tasks Drawer */}
        {mobileTasksOpen && (
          <div className="fixed inset-0 z-50 flex justify-end bg-black/60 lg:hidden">
            <div className="w-full max-w-md h-full bg-[#0d151e] border-l border-[#26303b] flex flex-col p-4 overflow-y-auto">
              <div className="flex items-center justify-between border-b border-[#26303b] pb-3 mb-4">
                <span className="text-xs font-black uppercase text-white">Tasks</span>
                <Button
                  className="size-8"
                  onClick={() => setMobileTasksOpen(false)}
                  size="icon"
                  variant="ghost"
                >
                  <X className="size-4 text-[#8b94a1]" />
                </Button>
              </div>
              <div className="space-y-6 flex-1 flex flex-col min-h-0">
                <FileTasksPanel
                  annotationMode={annotationMode}
                  canCreateTask={canCreateTask}
                  onCreateTask={() => {
                    setPendingTaskRegion(null);
                    setDraftRegion(null);
                    setAnnotationMode(false);
                    setTaskDialogOpen(true);
                    setMobileTasksOpen(false);
                  }}
                  onSelectTask={(taskId) => {
                    focusFileTask(tasks.find((task) => task.id === taskId) ?? null);
                  }}
                  selectedTaskId={selectedTaskId}
                  tasks={tasks}
                />

                {focusedTask ? (
                  <div className="border-t border-[#26303b] pt-4 flex-1 overflow-y-auto">
                    <FocusedTaskWorkspace
                      canReview={canReviewTask}
                      canSubmit={canSubmitTask}
                      onStartFrameComment={() => {
                        setAnnotationMode(false);
                        setPendingTaskRegion(null);
                        setDraftRegion(null);
                        setAnnotationStart(null);
                        setFrameAnnotationMode(true);
                        setMobileTasksOpen(false); // Close drawer to annotate comment
                      }}
                      onTaskChange={handleFocusedTaskChange}
                      onSubmitWork={handleSubmitTaskWork}
                      selectedSubmissionId={selectedSubmissionId}
                      task={focusedTask}
                      targetVersion={focusedTask.targetVersion || (versions[0] ? `v${versions[0].version}` : 'v1')}
                      onClose={() => focusFileTask(null)}
                    />
                  </div>
                ) : (
                  <div className="flex-1 grid place-items-center text-center p-4">
                    <p className="text-xs font-bold text-[#8b94a1]">Select a task from the list above to view details, submit updates, or review actions.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <VersionHistoryDrawer
        onOpenChange={setVersionHistoryOpen}
        onViewVersion={setSelectedVersion}
        open={versionHistoryOpen}
        versions={versions}
      />
      <CreateAnnotatedTaskDialog
        members={members}
        onCancel={() => {
          setPendingTaskRegion(null);
          setDraftRegion(null);
          setAnnotationMode(false);
          setTaskDialogOpen(false);
        }}
        onCreate={handleCreateAnnotatedTask}
        onRequestFrame={startTaskFrameSelection}
        open={taskDialogOpen}
        region={pendingTaskRegion}
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
      className={`size-7 rounded-[3px] ${active ? 'bg-[#303842] text-[#FFD369]' : 'text-[#aeb7c2] hover:bg-[#17202b] hover:text-white'
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
