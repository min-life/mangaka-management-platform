'use client';

import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { TaskFormDialog } from '../TaskFormDialog';
import { updateTask, deleteTask } from '@/services/task.service';
import { toast } from '@/lib/toast';
import type { FileTaskItem } from '../../file-ui';

export function TaskActionDialogs({
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

export function DeleteTaskDialog({
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
