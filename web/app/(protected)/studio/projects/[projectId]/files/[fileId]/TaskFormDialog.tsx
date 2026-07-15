'use client';

import { useState } from 'react';
import { Calendar, ChevronDown, Crosshair, FileText, Image as ImageIcon, X } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import {
  fileStatusLabels,
  type FileStatus,
  type FileTaskItem,
  type FileTaskRegion,
} from '../file-ui';

type TaskFormDialogProps = {
  isSubmitting?: boolean;
  members: Array<{ id: number; name: string }>;
  mode: 'create' | 'edit';
  initialData?: FileTaskItem;
  onCancel: () => void;
  onSubmit: (
    task: Partial<FileTaskItem>,
    options?: { assignedBy?: number | null; parentId?: number },
  ) => Promise<void> | void;
  open: boolean;
  tasks?: FileTaskItem[];
};

export function TaskFormDialog({
  isSubmitting = false,
  members,
  mode,
  initialData,
  onCancel,
  onSubmit,
  open,
  tasks = [],
}: TaskFormDialogProps) {
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [assigneeId, setAssigneeId] = useState(initialData?.assignedToUserId ? String(initialData.assignedToUserId) : 'unassigned');
  const [dueDate, setDueDate] = useState(() => {
    if (initialData?.dueDate && initialData.dueDate !== 'No due date') {
      const parsedDate = new Date(initialData.dueDate);
      if (!isNaN(parsedDate.getTime())) {
        const year = parsedDate.getFullYear();
        const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
        const day = String(parsedDate.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
    }
    return '';
  });
  const [parentId, setParentId] = useState(initialData?.parent?.id ? String(initialData.parent.id) : '');
  const [status, setStatus] = useState<FileStatus>(initialData?.status || 'PENDING');
  const [isAssigneeDropdownOpen, setIsAssigneeDropdownOpen] = useState(false);

  const colors = [
    'bg-[#5856d6]',
    'bg-[#007aff]',
    'bg-[#34c759]',
    'bg-[#ff9500]',
    'bg-[#ff2d55]',
    'bg-[#af52de]',
  ];

  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const effectiveAssigneeId = assigneeId === 'unassigned' ? '' : assigneeId;

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setAssigneeId('unassigned');
    setDueDate('');
    setParentId('');
    setStatus('PENDING');
    setIsAssigneeDropdownOpen(false);
  };

  const handleCancel = () => {
    resetForm();
    onCancel();
  };

  const [isInternalSubmitting, setIsInternalSubmitting] = useState(false);

  const handleSubmit = async () => {
    const selectedMember = members.find((member) => member.id === Number(effectiveAssigneeId));
    const assigneeName = selectedMember?.name || 'Unassigned';

    try {
      setIsInternalSubmitting(true);
      await onSubmit(
        {
          assignedTo: assigneeName,
          assignedToUserId: effectiveAssigneeId ? Number(effectiveAssigneeId) : undefined,
          description: description.trim() || 'No description.',
          dueDate: dueDate || undefined,
          id: initialData?.id || `task-local-${Date.now()}`,
          status,
          title: title.trim(),
        },
        {
          assignedBy: effectiveAssigneeId ? Number(effectiveAssigneeId) : null,
          parentId: parentId ? Number(parentId) : undefined,
        },
      );
      resetForm();
    } catch {
      // Keep the form values so the user can retry after an API error.
    } finally {
      setIsInternalSubmitting(false);
    }
  };

  const selectedMember = members.find((member) => member.id === Number(effectiveAssigneeId));

  return (
    <Dialog
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          handleCancel();
        }
      }}
      open={open}
    >
      <DialogContent
        className="flex max-h-[85vh] w-full sm:max-w-[520px] flex-col gap-0 overflow-hidden rounded-[8px] border border-[#212936] bg-[#0c1219] p-0 text-white shadow-2xl"
        showCloseButton={false}
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader className="relative border-b border-[#212936] px-6 py-5 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="grid size-10 place-items-center rounded-[6px] border border-[#ffd35b]/20 bg-[#ffd35b]/10 text-[#ffd35b]">
                <FileText className="size-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-black text-white tracking-wide">
                  {mode === 'create' ? 'Create File Task' : 'Edit Task'}
                </DialogTitle>
                <DialogDescription className="text-xs text-[#8b94a1] mt-0.5">
                  {mode === 'create' ? 'Fill in the API task fields. Frame annotation is optional and saved after the task is created.' : 'Update task details and assignments.'}
                </DialogDescription>
              </div>
            </div>
            <button
              type="button"
              className="size-8 rounded-[6px] bg-[#1f2937]/30 border border-transparent hover:border-[#39424f] hover:bg-[#1f2937]/60 text-white flex items-center justify-center transition-all cursor-pointer"
              onClick={handleCancel}
            >
              <X className="size-4" />
            </button>
          </div>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5">
          {/* Title */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-[0.08em] text-[#8b94a1]">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              className="h-11 w-full rounded-[6px] border border-[#212936] bg-[#0d151e] px-4 text-sm font-bold text-white outline-none focus:border-[#FFD369] transition-all"
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Review character linework"
              value={title}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-[0.08em] text-[#8b94a1]">
              Description
            </label>
            <textarea
              className="h-28 w-full resize-none rounded-[6px] border border-[#212936] bg-[#0d151e] px-4 py-3 text-sm font-bold text-white outline-none focus:border-[#FFD369] transition-all"
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Add context for the artist or reviewer."
              value={description}
            />
          </div>

          {/* Assigned To */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-[0.08em] text-[#8b94a1]">
              Assigned To
            </label>
            <div className="relative">
              <button
                type="button"
                className="flex h-11 w-full items-center justify-between rounded-[6px] border border-[#212936] bg-[#0d151e] px-4 text-sm font-bold text-white outline-none focus:border-[#FFD369] transition-all"
                onClick={() => setIsAssigneeDropdownOpen(!isAssigneeDropdownOpen)}
              >
                {selectedMember ? (
                  <div className="flex items-center gap-2">
                    <span className={cn("size-6 rounded-full flex items-center justify-center text-[10px] font-black text-white", colors[selectedMember.id % colors.length])}>
                      {getInitials(selectedMember.name)}
                    </span>
                    <span>{selectedMember.name}</span>
                  </div>
                ) : (
                  <span className="text-[#8b94a1]">Unassigned</span>
                )}
                <ChevronDown className="size-4 text-[#8b94a1]" />
              </button>

              {isAssigneeDropdownOpen && (
                <div className="absolute top-[calc(100%+4px)] left-0 z-50 w-full rounded-[6px] border border-[#212936] bg-[#0c1219] shadow-[0_10px_25px_rgba(0,0,0,0.6)] overflow-hidden max-h-48 overflow-y-auto">
                  <button
                    type="button"
                    className="flex w-full items-center px-4 py-2.5 text-xs font-bold text-white hover:bg-[#151c25] transition-colors"
                    onClick={() => {
                      setAssigneeId('unassigned');
                      setIsAssigneeDropdownOpen(false);
                    }}
                  >
                    Unassigned
                  </button>
                  {members.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      className="flex w-full items-center gap-2 px-4 py-2.5 text-xs font-bold text-white hover:bg-[#151c25] transition-colors"
                      onClick={() => {
                        setAssigneeId(String(m.id));
                        setIsAssigneeDropdownOpen(false);
                      }}
                    >
                      <span className={cn("size-6 rounded-full flex items-center justify-center text-[10px] font-black text-white", colors[m.id % colors.length])}>
                        {getInitials(m.name)}
                      </span>
                      <span>{m.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Deadline & Parent Task */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.08em] text-[#8b94a1]">
                Deadline
              </label>
              <div className="relative">
                <input
                  className="h-11 w-full rounded-[6px] border border-[#212936] bg-[#0d151e] pl-10 pr-4 text-sm font-bold text-white outline-none focus:border-[#FFD369] transition-all [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                  onChange={(event) => setDueDate(event.target.value)}
                  type="date"
                  value={dueDate}
                  min={new Date().toISOString().split('T')[0]}
                />
                <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[#FFD369]" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.08em] text-[#8b94a1]">
                Parent Task
              </label>
              <div className="relative">
                <select
                  className="h-11 w-full rounded-[6px] border border-[#212936] bg-[#0d151e] px-4 text-sm font-bold text-white outline-none focus:border-[#FFD369] appearance-none"
                  onChange={(event) => setParentId(event.target.value)}
                  value={parentId}
                >
                  <option value="">No parent task</option>
                  {tasks.map((task) => (
                    <option key={task.id} value={task.id}>
                      {task.title}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 size-4 text-[#8b94a1] pointer-events-none" />
              </div>
            </div>

            {mode === 'edit' && (
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.08em] text-[#8b94a1]">
                  Status
                </label>
                <div className="relative">
                  <select
                    className="h-11 w-full rounded-[6px] border border-[#212936] bg-[#0d151e] px-4 text-sm font-bold text-white outline-none focus:border-[#FFD369] appearance-none"
                    onChange={(event) => setStatus(event.target.value as FileStatus)}
                    value={status}
                  >
                    <option value="PENDING">Pending</option>
                    <option value="INPROGRESS">In Progress</option>
                    <option value="REVIEW">Review</option>
                    <option value="DONE">Done</option>
                  </select>
                  <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 size-4 text-[#8b94a1] pointer-events-none" />
                </div>
              </div>
            )}
          </div>


        </div>

        <DialogFooter className="mx-0 mb-0 border-t border-[#212936] bg-[#0c1219] px-6 py-4 shrink-0">
          <div className="flex w-full justify-end gap-3">
            <Button
              className="h-10 rounded-[6px] border border-[#212936] bg-[#0c1219] px-5 text-xs font-black text-[#8b94a1] hover:bg-[#151c25] hover:text-white"
              disabled={isSubmitting || isInternalSubmitting}
              onClick={handleCancel}
              type="button"
            >
              Cancel
            </Button>
            <Button
              className="h-10 rounded-[6px] bg-[#FFD369] px-5 text-xs font-black text-[#222831] hover:bg-[#eac04f] disabled:opacity-50"
              disabled={isSubmitting || isInternalSubmitting || !title.trim()}
              onClick={() => void handleSubmit()}
              type="button"
            >
              {(isSubmitting || isInternalSubmitting) ? (mode === 'create' ? 'Creating...' : 'Saving...') : (mode === 'create' ? 'Create Task' : 'Save Changes')}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
