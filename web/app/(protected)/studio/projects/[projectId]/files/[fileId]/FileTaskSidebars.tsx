'use client';

import { ChevronLeft, ChevronRight, X } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

import {
  fileStatusClassName,
  fileStatusLabels,
  type FileExplorerItem,
  type FileTaskItem,
  type FileVersionItem,
} from '../file-ui';
import type { TaskWorkspaceItem } from '../../tasks/task-ui';
import { FileTasksPanel } from './FileTasksPanel';
import { FocusedTaskWorkspace } from './FocusedTaskWorkspace';

type SubmitTaskWorkInput = {
  image?: File;
  note: string;
  source?: File;
  text?: File;
};

type FileTaskSidebarProps = {
  annotationMode: boolean;
  canCreateTask: boolean;
  canReviewTask: boolean;
  canSubmitTask: boolean;
  file: FileExplorerItem;
  focusedTask: TaskWorkspaceItem | null;
  onCloseFocusedTask: () => void;
  onCreateTask: () => void;
  onSelectTask: (taskId: string | null) => void;
  onStartFrameComment: () => void;
  onSubmitTaskWork: (input: SubmitTaskWorkInput) => void;
  onTaskChange: (task: TaskWorkspaceItem) => void;
  selectedSubmissionId: string | null;
  selectedTaskId: string | null;
  selectedVersion: FileVersionItem | null;
  tasks: FileTaskItem[];
  versions: FileVersionItem[];
  members?: Array<{ id: number; name: string }>;
  onRefresh?: () => void | Promise<void>;
};

type DesktopTaskSidebarProps = FileTaskSidebarProps & {
  isOpen: boolean;
  onClose: () => void;
};

type MobileTaskDrawerProps = FileTaskSidebarProps & {
  onClose: () => void;
  open: boolean;
};

function getTargetVersion(task: TaskWorkspaceItem, versions: FileVersionItem[]) {
  return task.targetVersion || (versions[0] ? `v${versions[0].version}` : 'v1');
}

function getVersionFooter(
  selectedVersion: FileVersionItem | null,
  versions: FileVersionItem[],
) {
  const versionLabel = selectedVersion
    ? `v${selectedVersion.version}`
    : versions[0]
      ? `v${versions[0].version}`
      : 'v1';
  const dateLabel = selectedVersion
    ? selectedVersion.createdAt
    : versions[0]
      ? versions[0].createdAt
      : 'Today';

  return `${versionLabel} - ${dateLabel}`;
}

function EmptyTaskDetail() {
  return (
    <section className="grid min-h-[200px] place-items-center bg-[#101820]/30 p-4 text-center">
      <p className="text-xs font-bold text-[#8b94a1]">
        Select a task from the list above to view details, submit updates, or review actions.
      </p>
    </section>
  );
}

function TaskDetailPanel({
  canReviewTask,
  canSubmitTask,
  focusedTask,
  onCloseFocusedTask,
  onStartFrameComment,
  onSubmitTaskWork,
  onTaskChange,
  selectedSubmissionId,
  versions,
  members,
  onRefresh,
}: Pick<
  FileTaskSidebarProps,
  | 'canReviewTask'
  | 'canSubmitTask'
  | 'focusedTask'
  | 'onCloseFocusedTask'
  | 'onStartFrameComment'
  | 'onSubmitTaskWork'
  | 'onTaskChange'
  | 'selectedSubmissionId'
  | 'versions'
  | 'members'
  | 'onRefresh'
>) {
  if (!focusedTask) {
    return <EmptyTaskDetail />;
  }

  return (
    <FocusedTaskWorkspace
      canReview={canReviewTask}
      canSubmit={canSubmitTask}
      onClose={onCloseFocusedTask}
      onStartFrameComment={onStartFrameComment}
      onSubmitWork={onSubmitTaskWork}
      onTaskChange={onTaskChange}
      selectedSubmissionId={selectedSubmissionId}
      task={focusedTask}
      targetVersion={getTargetVersion(focusedTask, versions)}
      members={members}
      onRefresh={onRefresh}
    />
  );
}

export function DesktopTaskSidebar({
  annotationMode,
  canCreateTask,
  canReviewTask,
  canSubmitTask,
  file,
  focusedTask,
  isOpen,
  onClose,
  onCloseFocusedTask,
  onCreateTask,
  onSelectTask,
  onStartFrameComment,
  onSubmitTaskWork,
  onTaskChange,
  selectedSubmissionId,
  selectedTaskId,
  selectedVersion,
  tasks,
  versions,
  members,
  onRefresh,
}: DesktopTaskSidebarProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <aside className="relative hidden h-full w-[320px] shrink-0 flex-col overflow-visible border-l border-[#26303b] bg-[#0d151e] lg:flex">
      <button
        className="absolute left-0 top-1/2 z-50 hidden size-8 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-[#FFD369] bg-[#FFD369] text-[#222831] shadow-[0_4px_12px_rgba(0,0,0,0.6)] transition-all hover:bg-[#eac04f] lg:grid"
        onClick={onClose}
        title="Collapse Sidebar"
        type="button"
      >
        <ChevronRight className="size-4" />
      </button>

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        <section className="relative shrink-0 border-b border-[#26303b] bg-[#151c25]/30 px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <p className="truncate text-xs font-black uppercase tracking-[0.08em] text-white">
              Task Summary
            </p>
            <Badge className={`rounded-[3px] border text-[9px] ${fileStatusClassName[file.status]}`}>
              {fileStatusLabels[file.status]}
            </Badge>
          </div>
        </section>

        <section className="shrink-0 border-b border-[#26303b] p-4">
          <FileTasksPanel
            annotationMode={annotationMode}
            canCreateTask={canCreateTask}
            onCreateTask={onCreateTask}
            onSelectTask={onSelectTask}
            selectedTaskId={selectedTaskId}
            tasks={tasks}
          />
        </section>

        <section className="bg-[#101820] p-4">
          <TaskDetailPanel
            canReviewTask={canReviewTask}
            canSubmitTask={canSubmitTask}
            focusedTask={focusedTask}
            onCloseFocusedTask={onCloseFocusedTask}
            onStartFrameComment={onStartFrameComment}
            onSubmitTaskWork={onSubmitTaskWork}
            onTaskChange={onTaskChange}
            selectedSubmissionId={selectedSubmissionId}
            versions={versions}
            members={members}
            onRefresh={onRefresh}
          />
        </section>
      </div>

      <div className="mt-auto shrink-0 border-t border-[#26303b] bg-[#151c25]/10 py-3 text-center">
        <p className="text-[10px] font-bold text-[#8b94a1]">
          {getVersionFooter(selectedVersion, versions)}
        </p>
      </div>
    </aside>
  );
}

export function MobileTaskDrawer({
  annotationMode,
  canCreateTask,
  canReviewTask,
  canSubmitTask,
  focusedTask,
  onClose,
  onCloseFocusedTask,
  onCreateTask,
  onSelectTask,
  onStartFrameComment,
  onSubmitTaskWork,
  onTaskChange,
  open,
  selectedSubmissionId,
  selectedTaskId,
  tasks,
  versions,
  members,
  onRefresh,
}: MobileTaskDrawerProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 lg:hidden">
      <div className="flex h-full w-full max-w-md flex-col overflow-y-auto border-l border-[#26303b] bg-[#0d151e] p-4">
        <div className="mb-4 flex items-center justify-between border-b border-[#26303b] pb-3">
          <span className="text-xs font-black uppercase text-white">Tasks</span>
          <Button className="size-8" onClick={onClose} size="icon" variant="ghost">
            <X className="size-4 text-[#8b94a1]" />
          </Button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col space-y-6">
          <FileTasksPanel
            annotationMode={annotationMode}
            canCreateTask={canCreateTask}
            onCreateTask={onCreateTask}
            onSelectTask={onSelectTask}
            selectedTaskId={selectedTaskId}
            tasks={tasks}
          />

          <div className="flex-1 overflow-y-auto border-t border-[#26303b] pt-4">
            <TaskDetailPanel
              canReviewTask={canReviewTask}
              canSubmitTask={canSubmitTask}
              focusedTask={focusedTask}
              onCloseFocusedTask={onCloseFocusedTask}
              onStartFrameComment={onStartFrameComment}
              onSubmitTaskWork={onSubmitTaskWork}
              onTaskChange={onTaskChange}
              selectedSubmissionId={selectedSubmissionId}
              versions={versions}
              members={members}
              onRefresh={onRefresh}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export function ExpandTaskSidebarButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      className="absolute right-2 top-1/2 z-40 hidden size-8 -translate-y-1/2 place-items-center rounded-full border border-[#FFD369] bg-[#FFD369] text-[#222831] shadow-[0_4px_12px_rgba(0,0,0,0.6)] transition-all hover:bg-[#eac04f] lg:grid"
      onClick={onClick}
      title="Expand Sidebar"
      type="button"
    >
      <ChevronLeft className="size-4" />
    </button>
  );
}
