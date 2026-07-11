'use client';

import { toast } from '@/lib/toast';
import { createFileTask, getFileMaterialVersions, createMaterial } from '@/services/file.service';
import { updateTask, getTaskMaterials, createTaskFrame } from '@/services/task.service';
import { updateMaterial } from '@/services/material.service';
import { buildStableMaterialVersions, type FileMaterialVersionRecord } from '../file-detail-types';
import type { FileExplorerItem, FileTaskItem, FileVersionItem } from '../../file-ui';
import type { TaskWorkspaceItem } from '../../../tasks/task-ui';

type TaskActionsProps = {
  fileId: number;
  projectId: number;
  user: any;
  file: FileExplorerItem | null;
  versions: FileVersionItem[];
  selectedVersion: FileVersionItem | null;
  focusedTask: TaskWorkspaceItem | null;
  selectedTaskId: string | null;
  loadFile: () => Promise<void>;
  setError: (err: string | null) => void;
  setIsLoading: (val: boolean) => void;
  setPendingTaskRegion: (val: any) => void;
  setDraftRegion: (val: any) => void;
  setTaskDialogOpen: (val: boolean) => void;
  setSelectedTaskId: (val: string | null) => void;
  setSelectedSubmissionId: (val: string | null) => void;
  setFrameAnnotationMode: (val: boolean) => void;
  setFocusedTask: (val: TaskWorkspaceItem | null) => void;
  setFile: React.Dispatch<React.SetStateAction<FileExplorerItem | null>>;
  setTasks: React.Dispatch<React.SetStateAction<FileTaskItem[]>>;
  setSelectedVersion: (val: FileVersionItem | null) => void;
  setVersions: (val: FileVersionItem[]) => void;
};

export function useFileDetailTaskActions({
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
  setFile,
  setTasks,
  setSelectedVersion,
  setVersions,
}: TaskActionsProps) {
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

      const description = `${task.description.replace(/\s*\*$/, '')}\n[version:${targetVersionTag}]`;

      const createdTaskRes = await createFileTask(fileId, {
        title: task.title.replace(/\s*\*$/, ''),
        description,
        status: statusValue,
        deadline: deadline,
        assignedBy: options?.assignedBy,
        parentId: options?.parentId,
        cloneBaseMaterial: !options?.parentId,
        cloneMaterialFromTaskId: options?.parentId,
      });

      await loadFile();
      toast.success('Task created successfully.');
    } catch (err) {
      console.error('Failed to create task:', err);
      toast.error('Failed to create task.');
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
    // Clear stale versions immediately so canvas shows blank/loading
    // instead of the previous task's (or file-level) materials while
    // the new fetch is in-flight.
    setVersions([]);

    if (!task) {
      setFocusedTask(null);
      setSelectedVersion(null);
      return;
    }

    if (task.targetVersion) {
      // Reset selectedVersion before reload — the stale version object would point to old
      // file-level material, causing a "wrong image flash". After reload, currentVersion
      // (newest task material) will be picked up automatically via displayedPreviewUrl.
      setSelectedVersion(null);
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
      isMine: user?.id != null && task.assignedToUserId === user.id,
      assignedByUserId: task.assignedByUserId,
      previewUrl: file?.previewUrl ?? '',
      priority: 'MEDIUM',
      region: task.region,
      status: task.status,
      submissions: task.submissions || [],
      title: task.title,
      updatedAt: task.updatedAt ?? new Date().toISOString(),
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
      toast.success('Submission approved.', {
        description: 'It is now displayed as the current file in UI preview mode.',
      });
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
      toast.error('Failed to sync task status to server.');
    }
  };

  const handleSubmitTaskWork = async (input: {
    image?: File;
    text?: File;
    source?: File;
    note: string;
  }) => {
    if (!focusedTask) return;
    setIsLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      if (input.image) formData.append('image', input.image);
      if (input.text) formData.append('text', input.text);
      if (input.source) formData.append('source', input.source);
      formData.append('taskId', focusedTask.id);
      formData.append('name', input.note.trim() || `${file?.title ?? `File ${fileId}`} submission`);
      await createMaterial(fileId, formData);

      const taskMaterials = await getTaskMaterials(focusedTask.id);
      const targetVersionTag = `v${(taskMaterials || []).length || 1}`;

      await updateTask(focusedTask.id, {
        description: `${focusedTask.description}\n[Note: ${input.note.trim()}] [version:${targetVersionTag}]`,
      });

      toast.success('Files uploaded.', {
        description: `Version ${targetVersionTag} saved. Mark as ready when you want to submit for review.`,
      });
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

  const handleMarkReadyForReview = async () => {
    if (!focusedTask) return;
    setIsLoading(true);
    try {
      await updateTask(focusedTask.id, { status: 'REVIEW' });
      await loadFile();
      toast.success('Task submitted for review.', {
        description: 'The task is now in the review queue.',
      });
    } catch (err) {
      console.error('Failed to mark task as ready for review:', err);
      toast.error('Failed to submit for review. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    handleCreateAnnotatedTask,
    focusFileTask,
    handleFocusedTaskChange,
    handleSubmitTaskWork,
    handleMarkReadyForReview,
  };
}
