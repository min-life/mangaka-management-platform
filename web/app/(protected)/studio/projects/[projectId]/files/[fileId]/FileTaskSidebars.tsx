'use client';

import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, X, Image as ImageIcon, FileText, FileArchive, Upload, Save, Eye, Download, Trash2 } from 'lucide-react';

import { createMaterial } from '@/services/file.service';
import { updateTask, deleteTask } from '@/services/task.service';
import { toast } from '@/lib/toast';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AlertTriangle } from 'lucide-react';
import { TaskFormDialog } from './TaskFormDialog';
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
  onMarkReadyForReview?: () => Promise<void>;
  onTaskChange: (task: TaskWorkspaceItem) => void;
  selectedSubmissionId: string | null;
  selectedTaskId: string | null;
  selectedVersion: FileVersionItem | null;
  tasks: FileTaskItem[];
  versions: FileVersionItem[];
  members?: Array<{ id: number; name: string }>;
  onRefresh?: () => void | Promise<void>;
  discussionContextKey: string;
  setDiscussionContext: (key: string) => void;
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

function MaterialTabDetail({
  versions,
  focusedTask,
}: {
  versions: FileVersionItem[];
  focusedTask: TaskWorkspaceItem | null;
}) {
  const [pendingFiles, setPendingFiles] = useState<{
    img?: File;
    text?: File;
    src?: File;
  }>({});

  // Get the most recent version for the focused task, or the most recent overall version
  const targetVersion = focusedTask 
    ? (versions.find(v => v.taskId === Number(focusedTask.id) && v.isCurrent) ?? versions.find(v => v.taskId === Number(focusedTask.id)))
    : versions[0];
    
  const imgMat: any = (targetVersion?.materials as any[] || []).find((m: any) => m.type === 'IMAGE' || m.originalName?.match(/\.(png|jpe?g)$/i) || m.name?.match(/\.(png|jpe?g)$/i));
  const textMat: any = (targetVersion?.materials as any[] || []).find((m: any) => m.type === 'TEXT' || m.originalName?.match(/\.(txt|md|docx?)$/i) || m.name?.match(/\.(txt|md|docx?)$/i));
  const srcMat: any = (targetVersion?.materials as any[] || []).find((m: any) => m.type === 'SOURCE' || m.originalName?.match(/\.(zip|rar|clip|psd)$/i) || m.name?.match(/\.(zip|rar|clip|psd)$/i));

  const items = [
    { type: 'img', label: 'IMG', icon: ImageIcon, current: imgMat?.originalName || imgMat?.name, pending: pendingFiles.img },
    { type: 'text', label: 'TEXT', icon: FileText, current: textMat?.originalName || textMat?.name, pending: pendingFiles.text },
    { type: 'src', label: 'SRC', icon: FileArchive, current: srcMat?.originalName || srcMat?.name, pending: pendingFiles.src },
  ] as const;

  const handleFileChange = (type: 'img' | 'text' | 'src', file: File | undefined) => {
    setPendingFiles(prev => ({ ...prev, [type]: file }));
  };

  const hasPending = Boolean(pendingFiles.img || pendingFiles.text || pendingFiles.src);

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="mb-2">
        <h3 className="text-xs font-black uppercase text-white">Latest Materials</h3>
        <p className="text-[10px] text-[#8b94a1] mt-1">
          {focusedTask ? `Task: ${focusedTask.title}` : `Overall File Materials`}
          {targetVersion ? ` (v${targetVersion.version})` : ''}
        </p>
      </div>

      <div className="flex flex-col gap-2">
        {items.map((item) => (
          <div key={item.type} className="flex items-center justify-between rounded-[4px] border border-[#26303b] bg-[#151c25] p-3">
            <div className="flex items-center gap-3 overflow-hidden pr-3">
              <div className="grid size-8 shrink-0 place-items-center rounded bg-[#202832]">
                <item.icon className="size-4 text-[#8b94a1]" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="block text-[10px] font-black uppercase text-[#8b94a1]">{item.label}</span>
                {item.pending ? (
                  <span className="block truncate text-xs font-bold text-[#FFD369]">{item.pending.name}</span>
                ) : item.current ? (
                  <span className="block truncate text-xs font-bold text-white">{item.current}</span>
                ) : (
                  <span className="block text-xs italic text-[#5b626d]">No file uploaded</span>
                )}
              </div>
            </div>
            
            <label className="shrink-0 cursor-pointer rounded bg-[#202832] px-3 py-1.5 text-[10px] font-bold text-white hover:bg-[#303842] transition-colors">
              Update
              <input 
                type="file" 
                className="hidden" 
                onChange={(e) => handleFileChange(item.type, e.target.files?.[0])} 
              />
            </label>
          </div>
        ))}
      </div>

      {hasPending && (
        <Button className="mt-2 w-full gap-2 bg-[#FFD369] text-[#222831] hover:bg-[#eac04f]">
          <Save className="size-4" />
          Save Uploads
        </Button>
      )}
    </div>
  );
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
  onMarkReadyForReview,
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
  | 'onMarkReadyForReview'
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
      onMarkReadyForReview={onMarkReadyForReview}
      onTaskChange={onTaskChange}
      selectedSubmissionId={selectedSubmissionId}
      task={focusedTask}
      targetVersion={getTargetVersion(focusedTask, versions)}
      members={members}
      onRefresh={onRefresh}
    />
  );
}

function TaskActionDialogs({
  task,
  onClose,
  onRefresh,
  members = [],
}: {
  task: FileTaskItem;
  onClose: () => void;
  onRefresh?: () => void | Promise<void>;
  members?: Array<{ id: number; name: string }>;
}) {
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const handleUpdateTaskSubmit = async (
    data: Partial<FileTaskItem>,
    options?: { assignedBy?: number; parentId?: number }
  ) => {
    setIsSavingEdit(true);
    try {
      let deadline: string | undefined = undefined;
      if (data.dueDate) {
        const dateObj = new Date(data.dueDate.replace(/\s*\*$/, ''));
        if (!isNaN(dateObj.getTime())) {
          deadline = dateObj.toISOString();
        }
      }

      await updateTask(task.id, {
        title: (data.title || '').trim(),
        description: (data.description || '').trim(),
        status: data.status as any,
        assignedBy: options?.assignedBy,
        deadline,
      });

      if (onRefresh) {
        await onRefresh();
      }
      toast.success('Task updated successfully.');
      onClose();
    } catch (err) {
      console.error('Failed to update task:', err);
      toast.error('Failed to update task. Please try again.');
    } finally {
      setIsSavingEdit(false);
    }
  };

  return (
    <TaskFormDialog
      mode="edit"
      initialData={task}
      members={members}
      onCancel={onClose}
      onSubmit={handleUpdateTaskSubmit}
      open={true}
      isSubmitting={isSavingEdit}
    />
  );
}

function DeleteTaskDialog({
  task,
  onClose,
  onRefresh,
}: {
  task: FileTaskItem;
  onClose: () => void;
  onRefresh?: () => void | Promise<void>;
}) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteTaskConfirm = async () => {
    setIsDeleting(true);
    try {
      await deleteTask(task.id);
      toast.success('Task deleted successfully.');
      if (onRefresh) {
        await onRefresh();
      }
      onClose();
    } catch (err) {
      console.error('Failed to delete task:', err);
      toast.error('Failed to delete task. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="max-w-md gap-0 overflow-hidden rounded-[7px] border border-[#39424f] bg-[#101820] p-0 text-white"
        showCloseButton={false}
      >
        <DialogHeader className="border-b border-[#39424f] px-6 py-5">
          <div className="mb-3 grid size-10 place-items-center rounded-[4px] border border-[#6b2637] bg-[#371522] text-[#ff9ab3]">
            <AlertTriangle className="size-5" />
          </div>
          <DialogTitle className="text-xl font-black text-white">Delete Task</DialogTitle>
          <DialogDescription className="text-sm font-medium text-[#aeb7c2]">
            Are you sure you want to delete this task? This action cannot be undone and will permanently remove all associated work and discussions.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="mx-0 mb-0 rounded-none border-[#39424f] bg-[#151c25] px-6 py-4">
          <DialogClose asChild>
            <Button
              className="h-9 rounded-[4px] border-[#4b535f] bg-[#101820] px-4 text-xs font-black text-white hover:bg-[#303842]"
              type="button"
              variant="outline"
            >
              Cancel
            </Button>
          </DialogClose>
          <Button
            className="h-9 rounded-[4px] border-[#6b2637] bg-[#371522] px-4 text-xs font-black text-[#ff9ab3] hover:bg-[#4a1d2c]"
            disabled={isDeleting}
            onClick={handleDeleteTaskConfirm}
            type="button"
            variant="outline"
          >
            {isDeleting ? 'Deleting...' : 'Delete Task'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
  onMarkReadyForReview,
  onTaskChange,
  selectedSubmissionId,
  selectedTaskId,
  selectedVersion,
  tasks,
  versions,
  members,
  onRefresh,
  discussionContextKey,
  setDiscussionContext,
}: DesktopTaskSidebarProps) {
  const [sidebarTab, setSidebarTab] = useState<'task' | 'material'>('task');
  const [sidebarWidth, setSidebarWidth] = useState(320);
  const [isResizing, setIsResizing] = useState(false);
  const [topSectionHeight, setTopSectionHeight] = useState(220);
  const [isResizingVertical, setIsResizingVertical] = useState(false);
  const [editingTask, setEditingTask] = useState<FileTaskItem | null>(null);
  const [deletingTask, setDeletingTask] = useState<FileTaskItem | null>(null);
  const topSectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizing) {
        // Width is computed from the right edge of the window
        const newWidth = document.body.clientWidth - e.clientX;
        if (newWidth >= 280 && newWidth <= 800) {
          setSidebarWidth(newWidth);
        }
      } else if (isResizingVertical && topSectionRef.current) {
        const rect = topSectionRef.current.getBoundingClientRect();
        const newHeight = e.clientY - rect.top;
        if (newHeight >= 100 && newHeight <= 800) {
          setTopSectionHeight(newHeight);
        }
      }
    };
    const handleMouseUp = () => {
      setIsResizing(false);
      setIsResizingVertical(false);
    };

    if (isResizing || isResizingVertical) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      // Prevent text selection while dragging
      document.body.style.userSelect = 'none';
    } else {
      document.body.style.userSelect = '';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
    };
  }, [isResizing, isResizingVertical]);

  if (!isOpen) {
    return null;
  }

  return (
    <aside 
      className="relative hidden h-full shrink-0 flex-col overflow-visible border-l border-[#26303b] bg-[#0d151e] lg:flex"
      style={{ width: sidebarWidth }}
    >
      {/* Resizer Handle */}
      <div 
        className="absolute -left-1 top-0 bottom-0 w-2 cursor-col-resize z-50 hover:bg-[#FFD369]/20 transition-colors"
        onMouseDown={(e) => {
          e.preventDefault();
          setIsResizing(true);
        }}
      />
      
      <button
        className="absolute left-0 top-1/2 z-40 hidden size-8 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-[#FFD369] bg-[#FFD369] text-[#222831] shadow-[0_4px_12px_rgba(0,0,0,0.6)] transition-all hover:bg-[#eac04f] lg:grid"
        onClick={onClose}
        title="Collapse Sidebar"
        type="button"
      >
        <ChevronRight className="size-4" />
      </button>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">

        <section 
          ref={topSectionRef}
          className="shrink-0 p-4 overflow-y-auto"
          style={{ height: topSectionHeight }}
        >
          <FileTasksPanel
            annotationMode={annotationMode}
            canCreateTask={canCreateTask}
            onCreateTask={onCreateTask}
            onSelectTask={onSelectTask}
            onEditTask={setEditingTask}
            onDeleteTask={setDeletingTask}
            selectedTaskId={selectedTaskId}
            tasks={tasks}
          />
          {editingTask && (
            <TaskActionDialogs
              task={editingTask}
              onClose={() => setEditingTask(null)}
              onRefresh={onRefresh}
              members={members}
            />
          )}
          {deletingTask && (
            <DeleteTaskDialog
              task={deletingTask}
              onClose={() => setDeletingTask(null)}
              onRefresh={onRefresh}
            />
          )}
        </section>

        {/* Vertical Resizer Handle */}
        <div 
          className="relative h-1 cursor-row-resize bg-[#26303b] z-40 hover:bg-[#FFD369] transition-colors shrink-0"
          onMouseDown={(e) => {
            e.preventDefault();
            setIsResizingVertical(true);
          }}
        />

        <div className="flex h-11 shrink-0 items-center border-b border-[#26303b] bg-[#091018] px-4">
          <button
            className={`relative h-full px-4 text-xs font-black capitalize ${
              sidebarTab === 'material' ? 'text-[#FFD369]' : 'text-[#8b94a1] hover:text-white'
            }`}
            onClick={() => setSidebarTab('material')}
          >
            Material
            {sidebarTab === 'material' && (
              <span className="absolute bottom-0 left-0 h-[2px] w-full bg-[#FFD369]" />
            )}
          </button>
          <button
            className={`relative h-full px-4 text-xs font-black capitalize ${
              sidebarTab === 'task' ? 'text-[#FFD369]' : 'text-[#8b94a1] hover:text-white'
            }`}
            onClick={() => setSidebarTab('task')}
          >
            Task
            {sidebarTab === 'task' && (
              <span className="absolute bottom-0 left-0 h-[2px] w-full bg-[#FFD369]" />
            )}
          </button>
        </div>

        <section className="flex-1 overflow-y-auto bg-[#101820]">
          {sidebarTab === 'material' ? (
            <MaterialTabDetail versions={versions} focusedTask={focusedTask} />
          ) : (
            <div className="p-4">
              <TaskDetailPanel
                canReviewTask={canReviewTask}
                canSubmitTask={canSubmitTask}
                focusedTask={focusedTask}
                onCloseFocusedTask={onCloseFocusedTask}
                onStartFrameComment={onStartFrameComment}
                onSubmitTaskWork={onSubmitTaskWork}
                onMarkReadyForReview={onMarkReadyForReview}
                onTaskChange={onTaskChange}
                selectedSubmissionId={selectedSubmissionId}
                versions={versions}
                members={members}
                onRefresh={onRefresh}
              />
            </div>
          )}
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
  onMarkReadyForReview,
  onTaskChange,
  open,
  selectedSubmissionId,
  selectedTaskId,
  tasks,
  versions,
  members,
  onRefresh,
  discussionContextKey,
  setDiscussionContext,
}: MobileTaskDrawerProps) {
  const [sidebarTab, setSidebarTab] = useState<'task' | 'material'>('task');
  const [mobileEditingTask, setMobileEditingTask] = useState<FileTaskItem | null>(null);
  const [mobileDeletingTask, setMobileDeletingTask] = useState<FileTaskItem | null>(null);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 lg:hidden">
      <div className="flex h-full w-full max-w-md flex-col overflow-y-auto border-l border-[#26303b] bg-[#0d151e]">
        <div className="flex items-center justify-between border-b border-[#26303b] p-4 shrink-0">
          <span className="text-xs font-black uppercase text-white">Tasks</span>
          <Button className="size-8" onClick={onClose} size="icon" variant="ghost">
            <X className="size-4 text-[#8b94a1]" />
          </Button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col">
          <section className="shrink-0 border-b border-[#26303b] p-4 max-h-[220px] overflow-y-auto">
            <FileTasksPanel
              annotationMode={annotationMode}
              canCreateTask={canCreateTask}
              onCreateTask={onCreateTask}
              onSelectTask={onSelectTask}
              onEditTask={setMobileEditingTask}
              onDeleteTask={setMobileDeletingTask}
              selectedTaskId={selectedTaskId}
              tasks={tasks}
            />
            {mobileEditingTask && (
              <TaskActionDialogs
                task={mobileEditingTask}
                onClose={() => setMobileEditingTask(null)}
                onRefresh={onRefresh}
                members={members}
              />
            )}
            {mobileDeletingTask && (
              <DeleteTaskDialog
                task={mobileDeletingTask}
                onClose={() => setMobileDeletingTask(null)}
                onRefresh={onRefresh}
              />
            )}
          </section>

          <div className="flex h-11 shrink-0 items-center border-b border-[#26303b] bg-[#091018] px-4">
            <button
              className={`relative h-full px-4 text-xs font-black capitalize ${
                sidebarTab === 'material' ? 'text-[#FFD369]' : 'text-[#8b94a1] hover:text-white'
              }`}
              onClick={() => setSidebarTab('material')}
            >
              Material
              {sidebarTab === 'material' && (
                <span className="absolute bottom-0 left-0 h-[2px] w-full bg-[#FFD369]" />
              )}
            </button>
            <button
              className={`relative h-full px-4 text-xs font-black capitalize ${
                sidebarTab === 'task' ? 'text-[#FFD369]' : 'text-[#8b94a1] hover:text-white'
              }`}
              onClick={() => setSidebarTab('task')}
            >
              Task
              {sidebarTab === 'task' && (
                <span className="absolute bottom-0 left-0 h-[2px] w-full bg-[#FFD369]" />
              )}
            </button>
          </div>

          <section className="flex-1 overflow-y-auto bg-[#101820]">
            {sidebarTab === 'material' ? (
              <MaterialTabDetail versions={versions} focusedTask={focusedTask} />
            ) : (
              <div className="p-4">
                <TaskDetailPanel
                  canReviewTask={canReviewTask}
                  canSubmitTask={canSubmitTask}
                  focusedTask={focusedTask}
                  onCloseFocusedTask={onCloseFocusedTask}
                  onStartFrameComment={onStartFrameComment}
                  onSubmitTaskWork={onSubmitTaskWork}
                  onMarkReadyForReview={onMarkReadyForReview}
                  onTaskChange={onTaskChange}
                  selectedSubmissionId={selectedSubmissionId}
                  versions={versions}
                  members={members}
                  onRefresh={onRefresh}
                />
              </div>
            )}
          </section>
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
