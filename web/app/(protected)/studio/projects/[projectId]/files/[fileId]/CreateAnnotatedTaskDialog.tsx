'use client';

import { useState } from 'react';
import { Crosshair, FileText } from 'lucide-react';

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

type CreateAnnotatedTaskDialogProps = {
  isSubmitting?: boolean;
  members: Array<{ id: number; name: string }>;
  onCancel: () => void;
  onCreate: (
    task: FileTaskItem,
    options?: { assignedBy?: number; parentId?: number },
  ) => Promise<void> | void;
  onRequestFrame: () => void;
  open: boolean;
  region: FileTaskRegion | null;
  tasks?: FileTaskItem[];
};

export function CreateAnnotatedTaskDialog({
  isSubmitting = false,
  members,
  onCancel,
  onCreate,
  onRequestFrame,
  open,
  region,
  tasks = [],
}: CreateAnnotatedTaskDialogProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [parentId, setParentId] = useState('');
  const [status, setStatus] = useState<FileStatus>('PENDING');
  const [includeFrame, setIncludeFrame] = useState(false);
  const [framePreferenceTouched, setFramePreferenceTouched] = useState(false);

  const effectiveAssigneeId = assigneeId || (members[0]?.id ? String(members[0].id) : '');
  const shouldAttachFrame = framePreferenceTouched ? includeFrame : Boolean(region) || includeFrame;

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setAssigneeId('');
    setDueDate('');
    setParentId('');
    setStatus('PENDING');
    setIncludeFrame(false);
    setFramePreferenceTouched(false);
  };

  const handleCancel = () => {
    resetForm();
    onCancel();
  };

  const handleCreate = async () => {
    if (shouldAttachFrame && !region) {
      return;
    }

    const selectedMember = members.find((member) => member.id === Number(effectiveAssigneeId));
    const assigneeName = selectedMember?.name || 'Unassigned';

    try {
      await onCreate(
        {
          assignedTo: assigneeName,
          description: description.trim() || 'No description.',
          dueDate: dueDate || undefined,
          id: `task-local-${Date.now()}`,
          ...(shouldAttachFrame && region ? { region } : {}),
          status,
          title: title.trim(),
        },
        {
          assignedBy: effectiveAssigneeId ? Number(effectiveAssigneeId) : undefined,
          parentId: parentId ? Number(parentId) : undefined,
        },
      );
      resetForm();
    } catch {
      // Keep the form values so the user can retry after an API error.
    }
  };

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
        className="max-w-2xl gap-0 overflow-hidden rounded-[7px] border border-[#39424f] bg-[#101820] p-0 text-white"
        showCloseButton={false}
      >
        <DialogHeader className="border-b border-[#39424f] px-6 py-5">
          <DialogTitle className="flex items-center gap-2 text-xl font-black text-white">
            <FileText className="size-5 text-[#FFD369]" />
            Create File Task
          </DialogTitle>
          <DialogDescription className="text-sm text-[#aeb7c2]">
            Fill the API task fields. Frame annotation is optional and saved after the task is created.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 px-6 py-5">
          <label className="block">
            <span className="text-[10px] font-black uppercase tracking-[0.08em] text-[#dce7f3]">
              Title *
            </span>
            <input
              className="mt-2 h-10 w-full rounded-[4px] border border-[#39424f] bg-[#151c25] px-3 text-sm font-bold text-white outline-none placeholder:text-[#8b94a1]"
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Review character linework"
              value={title}
            />
          </label>

          <label className="block">
            <span className="text-[10px] font-black uppercase tracking-[0.08em] text-[#dce7f3]">
              Description
            </span>
            <textarea
              className="mt-2 h-24 w-full resize-none rounded-[4px] border border-[#39424f] bg-[#151c25] px-3 py-3 text-sm font-bold text-white outline-none placeholder:text-[#8b94a1]"
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Add context for the artist or reviewer."
              value={description}
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-[10px] font-black uppercase tracking-[0.08em] text-[#dce7f3]">
                Assigned By
              </span>
              <select
                className="mt-2 h-10 w-full rounded-[4px] border border-[#39424f] bg-[#151c25] px-3 text-xs font-bold text-white outline-none"
                onChange={(event) => setAssigneeId(event.target.value)}
                value={effectiveAssigneeId}
              >
                {members.length > 0 ? (
                  members.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name}
                    </option>
                  ))
                ) : (
                  <option value="">No members available</option>
                )}
              </select>
            </label>
            <label className="block">
              <span className="text-[10px] font-black uppercase tracking-[0.08em] text-[#dce7f3]">
                Status
              </span>
              <select
                className="mt-2 h-10 w-full rounded-[4px] border border-[#39424f] bg-[#151c25] px-3 text-sm font-bold text-white outline-none"
                onChange={(event) => setStatus(event.target.value as FileStatus)}
                value={status}
              >
                {(['PENDING', 'INPROGRESS', 'REVIEW', 'DONE'] as const).map((value) => (
                  <option key={value} value={value}>
                    {fileStatusLabels[value]}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-[10px] font-black uppercase tracking-[0.08em] text-[#dce7f3]">
                Deadline
              </span>
              <input
                className="mt-2 h-10 w-full rounded-[4px] border border-[#39424f] bg-[#151c25] px-3 text-sm font-bold text-white outline-none"
                onChange={(event) => setDueDate(event.target.value)}
                type="date"
                value={dueDate}
              />
            </label>
            <label className="block">
              <span className="text-[10px] font-black uppercase tracking-[0.08em] text-[#dce7f3]">
                Parent Task
              </span>
              <select
                className="mt-2 h-10 w-full rounded-[4px] border border-[#39424f] bg-[#151c25] px-3 text-sm font-bold text-white outline-none placeholder:text-[#8b94a1]"
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
            </label>
          </div>

          <div className="rounded-[5px] border border-[#39424f] bg-[#151c25] p-4">
            <label className="flex items-start gap-3">
            <input
              checked={shouldAttachFrame}
              className="mt-1 accent-[#FFD369]"
              disabled={isSubmitting}
              onChange={(event) => {
                setFramePreferenceTouched(true);
                setIncludeFrame(event.target.checked);
                }}
                type="checkbox"
              />
              <span>
                <span className="block text-xs font-black text-white">Attach frame annotation</span>
                <span className="mt-1 block text-[10px] font-bold leading-4 text-[#8b94a1]">
                  Optional. If enabled, the selected canvas frame will be saved through the task frame API.
                </span>
              </span>
            </label>

            {shouldAttachFrame ? (
              region ? (
                <div className="mt-3 grid grid-cols-4 gap-2 rounded-[4px] border border-[#303842] bg-[#101820] p-3">
                  {[
                    ['X1', region.startX],
                    ['Y1', region.startY],
                    ['X2', region.endX],
                    ['Y2', region.endY],
                  ].map(([label, value]) => (
                    <div key={String(label)}>
                      <p className="text-[9px] font-black uppercase text-[#8b94a1]">{label}</p>
                      <p className="mt-1 text-xs font-black text-[#FFD369]">
                        {Math.round(Number(value) * 100)}%
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <button
                  className="mt-3 inline-flex h-9 items-center gap-2 rounded-[4px] border border-[#FFD369] px-3 text-xs font-black text-[#FFD369] hover:bg-[#30270d]"
                  disabled={isSubmitting}
                  onClick={onRequestFrame}
                  type="button"
                >
                  <Crosshair className="size-4" />
                  Draw frame on canvas
                </button>
              )
            ) : null}
          </div>
        </div>

        <DialogFooter className="mx-0 mb-0 rounded-none border-[#39424f] bg-[#151c25] px-6 py-4">
          <Button disabled={isSubmitting} onClick={handleCancel} variant="outline">
            Cancel
          </Button>
          <Button
            className="bg-[#FFD369] text-[#222831] hover:bg-[#eac04f]"
            disabled={isSubmitting || !title.trim() || (shouldAttachFrame && !region)}
            onClick={() => void handleCreate()}
          >
            {isSubmitting ? 'Creating...' : 'Create Task'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
