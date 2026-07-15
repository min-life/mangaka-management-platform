import React, { useEffect, useRef, useState } from 'react';
import type { FileTaskItem, FileVersionItem, FileExplorerItem } from '../../file-ui';
import type { TaskWorkspaceItem } from '../../../tasks/task-ui';

type UseTaskVersionResolverProps = {
  focusedTaskId: string | null;
  selectedTaskId: string | null;
  setSelectedTaskId: React.Dispatch<React.SetStateAction<string | null>>;
  focusedTask: TaskWorkspaceItem | null;
  setFocusedTask: React.Dispatch<React.SetStateAction<TaskWorkspaceItem | null>>;
  tasks: FileTaskItem[];
  file: FileExplorerItem | null;
  fileId: number;
  data: any;
  isRefreshing: boolean;
  user: any;
};

export function useTaskVersionResolver({
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
}: UseTaskVersionResolverProps) {
  const lastProcessedTaskIdRef = useRef<string | null | undefined>(undefined);
  const explicitMaterialIdRef = useRef<string | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<FileVersionItem | null>(null);

  const setExplicitMaterialId = (id: string | null) => {
    explicitMaterialIdRef.current = id;
  };

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

    if (lastProcessedTaskIdRef.current !== focusedTaskId) {
      // Do not setSelectedVersion(null) here, as it would wipe out explicit selections made just before the task switch (e.g. clicking a frame).
      // The resolver below will handle switching to the correct material.
      lastProcessedTaskIdRef.current = focusedTaskId;
    }

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
        targetVersion: dbTask.targetVersion,
      };

      setFocusedTask((prev) => {
        // Prevent unnecessary state updates if task structure is identical
        if (prev && prev.id === workspaceTask.id && prev.updatedAt === workspaceTask.updatedAt && prev.status === workspaceTask.status) {
          return prev;
        }
        return workspaceTask;
      });
      setSelectedTaskId(workspaceTask.id);

      if (isRefreshing) return; // Wait for fresh data before auto-selecting

      const rawVersions = data?.versions ?? [];
      
      // Ensure task data actually belongs to the current task before auto-selecting
      // (prevents race condition where old data matches targetVersion)
      const taskMaterialVersions = rawVersions.filter((v: any) => v.taskId != null);
      const dataBelongsToCurrentTask = taskMaterialVersions.every((v: any) => v.taskId === Number(workspaceTask.id));
      if (!dataBelongsToCurrentTask && taskMaterialVersions.length > 0) {
        return; 
      }

      // Auto select version for task: prefer task's own latest material, fallback to targetVersion
      const currentTaskVersions = rawVersions.filter((v: any) => v.taskId === Number(workspaceTask.id));
      
      let matchVersionItem;
      if (currentTaskVersions.length > 0) {
        matchVersionItem = currentTaskVersions.find((v: any) => v.isCurrent) ?? currentTaskVersions[0];
      } else if (workspaceTask.targetVersion) {
        matchVersionItem = rawVersions.find(
          (v: any) => `v${v.version}` === workspaceTask.targetVersion && v.taskId == null
        );
      }

      if (matchVersionItem) {
        setSelectedVersion((prev) => prev?.id === matchVersionItem.id ? prev : matchVersionItem);
      } else {
        setSelectedVersion(null); // Clear if not found to avoid keeping stale selectedVersion
      }
    });

    return () => {
      isMounted = false;
    };
  }, [focusedTaskId, tasks, file, fileId, data, isRefreshing, user?.id]);

  return {
    selectedVersion,
    setSelectedVersion,
    setExplicitMaterialId,
  };
}
