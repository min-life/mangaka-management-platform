'use client';

import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, Check, ClipboardCheck, Crosshair, Edit3, FileUp, Trash2, UserRound, X } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from '@/lib/toast';
import { updateTask, deleteTask } from '@/services/task.service';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';


import {
  taskStatusClassName,
  taskStatusLabels,
  type TaskWorkspaceItem,
} from '../../tasks/task-ui';
import { SubmitWorkDialog } from '../../tasks/[taskId]/SubmitWorkDialog';

type FocusedTaskWorkspaceProps = {
  canReview: boolean;
  canSubmit: boolean;
  onStartFrameComment: () => void;
  onClose?: () => void;
  onSubmitWork?: (input: {
    image?: File;
    text?: File;
    source?: File;
    note: string;
  }) => void;
  onMarkReadyForReview?: () => Promise<void>;
  onTaskChange: (task: TaskWorkspaceItem) => void;
  selectedSubmissionId: string | null;
  task: TaskWorkspaceItem;
  targetVersion?: string;
  members?: Array<{ id: number; name: string }>;
  onRefresh?: () => void | Promise<void>;
};

export function FocusedTaskWorkspace({
  canReview,
  canSubmit,
  onClose,
  onStartFrameComment,
  onSubmitWork,
  onMarkReadyForReview,
  onTaskChange,
  selectedSubmissionId,
  task,
  targetVersion,
  members = [],
  onRefresh,
}: FocusedTaskWorkspaceProps) {
  const [reviewNote, setReviewNote] = useState('');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editAssigneeId, setEditAssigneeId] = useState('');
  const [editStatus, setEditStatus] = useState<string>('PENDING');
  const [editDueDate, setEditDueDate] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isConfirmDeleteDialogOpen, setIsConfirmDeleteDialogOpen] = useState(false);

  const handleOpenEdit = () => {
    setEditTitle(task.title);
    setEditDescription(task.description);
    setEditAssigneeId(task.assigneeId ? String(task.assigneeId) : '');
    setEditStatus(task.status);
    
    if (task.dueDate && task.dueDate !== 'No due date') {
      const parsedDate = new Date(task.dueDate);
      if (!isNaN(parsedDate.getTime())) {
        const year = parsedDate.getFullYear();
        const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
        const day = String(parsedDate.getDate()).padStart(2, '0');
        setEditDueDate(`${year}-${month}-${day}`);
      } else {
        setEditDueDate('');
      }
    } else {
      setEditDueDate('');
    }
    
    setIsEditDialogOpen(true);
  };

  const handleUpdateTaskSubmit = async () => {
    setIsSavingEdit(true);
    try {
      let deadline: string | undefined = undefined;
      if (editDueDate) {
        const dateObj = new Date(editDueDate);
        if (!isNaN(dateObj.getTime())) {
          deadline = dateObj.toISOString();
        }
      }

      await updateTask(task.id, {
        title: editTitle.trim(),
        description: editDescription.trim(),
        status: editStatus as any,
        assignedBy: editAssigneeId ? Number(editAssigneeId) : undefined,
        deadline,
      });

      setIsEditDialogOpen(false);
      if (onRefresh) {
        await onRefresh();
      }
      toast.success('Task updated successfully.');
    } catch (err) {
      console.error('Failed to update task:', err);
      toast.error('Failed to update task. Please try again.');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDeleteClick = () => {
    setIsConfirmDeleteDialogOpen(true);
  };

  const handleDeleteTaskConfirm = async () => {
    setIsDeleting(true);
    try {
      await deleteTask(task.id);
      toast.success('Task deleted successfully.');
      setIsConfirmDeleteDialogOpen(false);
      if (onClose) {
        onClose();
      }
      if (onRefresh) {
        await onRefresh();
      }
    } catch (err) {
      console.error('Failed to delete task:', err);
      toast.error('Failed to delete task. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const selectedSubmission = task.submissions.find(
    (submission) => submission.id === selectedSubmissionId,
  );

  const handleReview = (approved: boolean) => {
    if (!selectedSubmission || !reviewNote.trim()) return;
    onTaskChange({
      ...task,
      status: approved ? 'DONE' : 'INPROGRESS',
      submissions: task.submissions.map((submission) =>
        submission.id === selectedSubmission.id
          ? {
              ...submission,
              note: `${submission.note}\nReviewer: ${reviewNote.trim()}`,
              status: approved ? 'APPROVED' : 'CHANGES_REQUESTED',
            }
          : submission,
      ),
      updatedAt: 'Just now',
    });
    setReviewNote('');
  };

  const handleReviewDirect = (approved: boolean) => {
    if (!reviewNote.trim()) return;
    onTaskChange({
      ...task,
      status: approved ? 'DONE' : 'INPROGRESS',
      submissions: task.submissions.map((submission) => ({
        ...submission,
        status: approved ? 'APPROVED' : 'CHANGES_REQUESTED',
        note: `${submission.note}\nReviewer: ${reviewNote.trim()}`,
      })),
      updatedAt: 'Just now',
    });
    setReviewNote('');
  };

  const renderEditDialog = () => (
    <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
      <DialogContent
        className="border border-[#26303b] bg-[#0d151e] text-white sm:max-w-[425px]"
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-sm font-black uppercase tracking-[0.08em] text-white">
            Edit Task Details
          </DialogTitle>
          <DialogDescription className="text-[11px] text-[#8b94a1]">
            Modify the task settings. Click save when you are done.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4 text-xs">
          <div className="flex flex-col gap-2">
            <label htmlFor="edit-title" className="font-bold text-[#8b94a1]">Title</label>
            <input
              id="edit-title"
              className="h-9 w-full border border-[#39424f] bg-[#101820] px-3 text-white outline-none placeholder:text-[#5b626d] focus:border-[#FFD369]"
              placeholder="Task title"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="edit-desc" className="font-bold text-[#8b94a1]">Description</label>
            <textarea
              id="edit-desc"
              className="h-20 w-full resize-none border border-[#39424f] bg-[#101820] p-3 text-white outline-none placeholder:text-[#5b626d] focus:border-[#FFD369]"
              placeholder="Description of work needed..."
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label htmlFor="edit-status" className="font-bold text-[#8b94a1]">Status</label>
              <select
                id="edit-status"
                className="h-9 border border-[#39424f] bg-[#101820] px-2 text-white outline-none focus:border-[#FFD369]"
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value)}
              >
                <option value="PENDING">Pending</option>
                <option value="INPROGRESS">In Progress</option>
                <option value="REVIEW">Review</option>
                <option value="DONE">Done</option>
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="edit-due" className="font-bold text-[#8b94a1]">Due Date</label>
              <input
                id="edit-due"
                type="date"
                className="h-9 border border-[#39424f] bg-[#101820] px-2 text-white outline-none focus:border-[#FFD369] [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                value={editDueDate}
                onChange={(e) => setEditDueDate(e.target.value)}
              />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="edit-assignee" className="font-bold text-[#8b94a1]">Assignee</label>
            <select
              id="edit-assignee"
              className="h-9 border border-[#39424f] bg-[#101820] px-2 text-white outline-none focus:border-[#FFD369]"
              value={editAssigneeId}
              onChange={(e) => setEditAssigneeId(e.target.value)}
            >
              <option value="">Unassigned</option>
              {members.map((m) => (
                <option key={m.id} value={String(m.id)}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <DialogClose asChild>
            <Button type="button" variant="ghost" className="h-9 text-xs font-bold text-[#8b94a1] hover:bg-[#222831] hover:text-white">
              Cancel
              </Button>
          </DialogClose>
          <Button
            type="button"
            className="h-9 bg-[#FFD369] px-4 text-xs font-black text-[#222831] hover:bg-[#eac04f]"
            disabled={isSavingEdit || !editTitle.trim()}
            onClick={handleUpdateTaskSubmit}
          >
            {isSavingEdit ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  const renderDeleteConfirmDialog = () => (
    <Dialog open={isConfirmDeleteDialogOpen} onOpenChange={setIsConfirmDeleteDialogOpen}>
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
            Are you sure you want to delete this task? This action cannot be undone.
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

  if (selectedSubmission) {
    const canAct = canReview && task.status === 'REVIEW' && selectedSubmission.status === 'PENDING_REVIEW';

    return (
      <>
        <section>
          <div className="flex items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.08em] text-white">
              <FileUp className="size-4 text-[#FFD369]" /> Submission Review
            </h2>
            <div className="flex items-center gap-2">
              <Badge className="rounded-[3px] border border-[#6c5516] bg-[#30270d] text-[9px] text-[#ffd35b]">
                {selectedSubmission.status.replaceAll('_', ' ')}
              </Badge>
              <Button
                size="icon"
                variant="ghost"
                className="size-6 text-[#8b94a1] hover:text-white"
                onClick={handleOpenEdit}
                title="Edit Task"
              >
                <Edit3 className="size-3.5" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="size-6 text-[#8b94a1] hover:text-red-400"
                onClick={handleDeleteClick}
                title="Delete Task"
                disabled={isDeleting}
              >
                <Trash2 className="size-3.5" />
              </Button>
              {onClose && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="size-6 text-[#8b94a1] hover:text-white"
                  onClick={onClose}
                >
                  <X className="size-3.5" />
                </Button>
              )}
            </div>
          </div>
        <div className="mt-3 border border-[#303842] bg-[#151c25] p-3">
          <p className="truncate text-xs font-black text-white">{selectedSubmission.assetName}</p>
          <p className="mt-1 text-[9px] font-bold text-[#8b94a1]">
            {selectedSubmission.submittedBy} · {selectedSubmission.submittedAt}
          </p>
          <p className="mt-2 text-[10px] leading-4 text-[#dce7f3]">{selectedSubmission.note}</p>
        </div>

        {canAct ? (
          <div className="mt-3">
            <Button
              className="h-8 border-[#6c5516] bg-[#30270d] px-3 text-[10px] font-black text-[#ffd35b] hover:bg-[#3a3011]"
              onClick={onStartFrameComment}
              variant="outline"
            >
              <Crosshair className="size-3.5" /> Frame Comment
            </Button>
            <textarea
              className="mt-3 h-16 w-full resize-none border border-[#39424f] bg-[#101820] p-2 text-[10px] text-white outline-none placeholder:text-[#8b94a1]"
              onChange={(event) => setReviewNote(event.target.value)}
              placeholder="Required review note..."
              value={reviewNote}
            />
            <div className="mt-2 grid grid-cols-2 gap-2">
              <Button className="h-8 border-[#6b2637] bg-[#371522] px-2 text-[9px] font-black text-[#ff9ab3] hover:bg-[#4a1d2c]" disabled={!reviewNote.trim()} onClick={() => handleReview(false)} variant="outline">
                <X className="size-3" /> Changes
              </Button>
              <Button className="h-8 bg-[#FFD369] px-2 text-[9px] font-black text-[#222831] hover:bg-[#eac04f]" disabled={!reviewNote.trim()} onClick={() => handleReview(true)}>
                <Check className="size-3" /> Approve
              </Button>
            </div>
          </div>
        ) : null}

        {canSubmit && task.status !== 'DONE' && task.status !== 'REVIEW' ? (
          task.parent && task.parent.status !== 'DONE' ? (
            <div className="mt-3 border border-[#6b2637] bg-[#371522] px-3 py-2 text-[10px] font-bold leading-4 text-[#ff9ab3] flex items-start gap-2 rounded-[4px]">
              <AlertTriangle className="size-4 shrink-0 mt-0.5 text-[#ff9ab3]" />
              <div>
                <p className="font-black">Submission Blocked</p>
                <p className="text-[#dce7f3] mt-0.5 font-medium">
                  This task is a subtask of &ldquo;{task.parent.title}&rdquo; which is currently <strong>{task.parent.status}</strong>. The parent task must be completed (Done) first.
                </p>
              </div>
            </div>
          ) : (
            <div className="mt-3 space-y-2">
              <SubmitWorkDialog onSubmit={onSubmitWork ?? (() => undefined)} />
              {onMarkReadyForReview && (
                <button
                  className="w-full rounded-[3px] border border-[#FFD369]/30 bg-[#30270d] py-2 text-[10px] font-black text-[#FFD369] transition hover:border-[#FFD369]/60 hover:bg-[#3a3011]"
                  onClick={onMarkReadyForReview}
                  type="button"
                >
                  ✓ Mark as Ready for Review
                </button>
              )}
            </div>
          )
        ) : null}
      </section>
      {renderEditDialog()}
      {renderDeleteConfirmDialog()}
    </>
  );
}

  return (
    <>
      <section>
        <div className="flex items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.08em] text-white">
            <ClipboardCheck className="size-4 text-[#FFD369]" /> Task Detail
          </h2>
          <div className="flex items-center gap-2">
            <Badge className={`rounded-[3px] border text-[9px] ${taskStatusClassName[task.status]}`}>
              {taskStatusLabels[task.status]}
            </Badge>
            <Button
              size="icon"
              variant="ghost"
              className="size-6 text-[#8b94a1] hover:text-white"
              onClick={handleOpenEdit}
              title="Edit Task"
            >
              <Edit3 className="size-3.5" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="size-6 text-[#8b94a1] hover:text-red-400"
              onClick={handleDeleteClick}
              title="Delete Task"
              disabled={isDeleting}
            >
              <Trash2 className="size-3.5" />
            </Button>
            {onClose && (
              <Button
                size="icon"
                variant="ghost"
                className="size-6 text-[#8b94a1] hover:text-white"
                onClick={onClose}
              >
                <X className="size-3.5" />
              </Button>
            )}
          </div>
        </div>
      <div className="mt-3 border border-[#303842] bg-[#151c25] p-3">
        <p className="text-xs font-black text-white">{task.title}</p>
        <p className="mt-2 text-[10px] leading-4 text-[#dce7f3]">{task.description}</p>

        <p className="mt-2 flex items-center gap-1 text-[9px] font-bold text-[#8b94a1]">
          <UserRound className="size-3" /> {task.assignee || (task as any).assignedTo || 'Unassigned'}
          {task.dueDate ? ` · Due ${task.dueDate}` : ''}
        </p>
      </div>

      {canSubmit && task.status !== 'DONE' && task.status !== 'REVIEW' ? (
        task.parent && task.parent.status !== 'DONE' ? (
          <div className="mt-3 border border-[#6b2637] bg-[#371522] px-3 py-2 text-[10px] font-bold leading-4 text-[#ff9ab3] flex items-start gap-2 rounded-[4px]">
            <AlertTriangle className="size-4 shrink-0 mt-0.5 text-[#ff9ab3]" />
            <div>
              <p className="font-black">Submission Blocked</p>
              <p className="text-[#dce7f3] mt-0.5 font-medium">
                This task is a subtask of &ldquo;{task.parent.title}&rdquo; which is currently <strong>{task.parent.status}</strong>. The parent task must be completed (Done) first.
              </p>
            </div>
          </div>
        ) : (
          <div className="mt-3 space-y-2">
            <SubmitWorkDialog onSubmit={onSubmitWork ?? (() => undefined)} />
            {onMarkReadyForReview && (
              <button
                className="w-full rounded-[3px] border border-[#FFD369]/30 bg-[#30270d] py-2 text-[10px] font-black text-[#FFD369] transition hover:border-[#FFD369]/60 hover:bg-[#3a3011]"
                onClick={onMarkReadyForReview}
                type="button"
              >
                ✓ Mark as Ready for Review
              </button>
            )}
          </div>
        )
      ) : null}

      {canReview && task.status === 'REVIEW' ? (
        <div className="mt-3">
          <textarea
            className="h-16 w-full resize-none border border-[#39424f] bg-[#101820] p-2 text-[10px] text-white outline-none placeholder:text-[#8b94a1]"
            onChange={(event) => setReviewNote(event.target.value)}
            placeholder="Required review note..."
            value={reviewNote}
          />
          <div className="mt-2 grid grid-cols-2 gap-2">
            <Button className="h-8 border-[#6b2637] bg-[#371522] px-2 text-[9px] font-black text-[#ff9ab3] hover:bg-[#4a1d2c]" disabled={!reviewNote.trim()} onClick={() => handleReviewDirect(false)} variant="outline">
              <X className="size-3" /> Changes
            </Button>
            <Button className="h-8 bg-[#FFD369] px-2 text-[9px] font-black text-[#222831] hover:bg-[#eac04f]" disabled={!reviewNote.trim()} onClick={() => handleReviewDirect(true)}>
              <Check className="size-3" /> Approve
            </Button>
          </div>
        </div>
      ) : null}
      </section>
      {renderEditDialog()}
      {renderDeleteConfirmDialog()}
    </>
  );
}
