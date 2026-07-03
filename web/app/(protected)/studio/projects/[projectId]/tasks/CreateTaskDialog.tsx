'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

import type { TaskStatus } from './task-ui';

type CreateTaskDialogProps = {
  fileOptions: Array<{ id: number; title: string }>;
  members?: Array<{ id: number; name: string }>;
  onCreate: (input: {
    assignedToId?: number;
    description: string;
    dueDate: string;
    fileId: number;
    status: TaskStatus;
    title: string;
  }) => void | Promise<void>;
};

export function CreateTaskDialog({ fileOptions, members = [], onCreate }: CreateTaskDialogProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [fileId, setFileId] = useState(fileOptions[0]?.id ? String(fileOptions[0].id) : '');
  const [assigneeId, setAssigneeId] = useState('');
  const [status, setStatus] = useState<TaskStatus>('PENDING');
  const [dueDate, setDueDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setAssigneeId('');
    setStatus('PENDING');
    setDueDate('');
  };

  const handleCreate = async () => {
    setIsSubmitting(true);
    try {
      await onCreate({
        ...(assigneeId ? { assignedToId: Number(assigneeId) } : {}),
        description: description.trim(),
        dueDate,
        fileId: Number(fileId),
        status,
        title: title.trim(),
      });
      resetForm();
      setOpen(false);
    } catch (err) {
      console.error('Failed to create task:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger asChild>
        <Button className="h-9 rounded-[4px] bg-[#FFD369] px-4 text-xs font-black text-[#222831] hover:bg-[#eac04f]">
          <Plus className="size-4" />
          New Task *
        </Button>
      </DialogTrigger>
      <DialogContent
        className="flex max-h-[88vh] max-w-2xl flex-col gap-0 overflow-hidden rounded-[7px] border border-[#39424f] bg-[#101820] p-0 text-white"
        showCloseButton={false}
      >
        <DialogHeader className="shrink-0 border-b border-[#39424f] px-6 py-5">
          <DialogTitle className="text-xl font-black text-white">Create Production Task</DialogTitle>
          <DialogDescription className="text-sm text-[#aeb7c2]">
            Create a project task. Add a canvas region later from File Detail. *
          </DialogDescription>
        </DialogHeader>
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-5">
          <label className="block">
            <span className="text-[10px] font-black uppercase tracking-[0.08em] text-[#dce7f3]">Title</span>
            <input
              className="mt-2 h-10 w-full rounded-[4px] border border-[#39424f] bg-[#151c25] px-3 text-sm font-bold text-white outline-none placeholder:text-[#8b94a1] disabled:opacity-50"
              disabled={isSubmitting}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Finalize inking for Chapter 01"
              value={title}
            />
          </label>
          <label className="block">
            <span className="text-[10px] font-black uppercase tracking-[0.08em] text-[#dce7f3]">Description</span>
            <textarea
              className="mt-2 h-24 w-full resize-none rounded-[4px] border border-[#39424f] bg-[#151c25] px-3 py-3 text-sm font-bold text-white outline-none placeholder:text-[#8b94a1] disabled:opacity-50"
              disabled={isSubmitting}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Describe the expected production result"
              value={description}
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label>
              <span className="text-[10px] font-black uppercase text-[#dce7f3]">Related File</span>
              <select
                className="mt-2 h-10 w-full rounded-[4px] border border-[#39424f] bg-[#151c25] px-3 text-xs font-bold text-white disabled:opacity-50"
                disabled={isSubmitting}
                onChange={(event) => setFileId(event.target.value)}
                value={fileId}
              >
                {fileOptions.map((file) => <option key={file.id} value={file.id}>{file.title}</option>)}
              </select>
            </label>
            <label>
              <span className="text-[10px] font-black uppercase text-[#dce7f3]">Assignee</span>
              <select
                className="mt-2 h-10 w-full rounded-[4px] border border-[#39424f] bg-[#151c25] px-3 text-xs font-bold text-white disabled:opacity-50"
                disabled={isSubmitting}
                onChange={(event) => setAssigneeId(event.target.value)}
                value={assigneeId}
              >
                <option value="">Unassigned</option>
                {members.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}
              </select>
            </label>
            <label>
              <span className="text-[10px] font-black uppercase text-[#dce7f3]">Status</span>
              <select
                className="mt-2 h-10 w-full rounded-[4px] border border-[#39424f] bg-[#151c25] px-3 text-xs font-bold text-white disabled:opacity-50"
                disabled={isSubmitting}
                onChange={(event) => setStatus(event.target.value as TaskStatus)}
                value={status}
              >
                {(['PENDING', 'INPROGRESS', 'REVIEW', 'DONE'] as const).map((value) => <option key={value}>{value}</option>)}
              </select>
            </label>
            <label>
              <span className="text-[10px] font-black uppercase text-[#dce7f3]">Due Date</span>
              <input
                className="mt-2 h-10 w-full rounded-[4px] border border-[#39424f] bg-[#151c25] px-3 text-sm font-bold text-white disabled:opacity-50"
                disabled={isSubmitting}
                onChange={(event) => setDueDate(event.target.value)}
                type="date"
                value={dueDate}
              />
            </label>
          </div>
        </div>
        <DialogFooter className="mx-0 mb-0 shrink-0 rounded-none border-[#39424f] bg-[#151c25] px-6 py-4">
          <DialogClose asChild>
            <Button variant="outline" disabled={isSubmitting}>Cancel</Button>
          </DialogClose>
          <Button
            className="bg-[#FFD369] text-[#222831] hover:bg-[#eac04f]"
            disabled={!title.trim() || !fileId || isSubmitting}
            onClick={handleCreate}
          >
            {isSubmitting ? 'Creating...' : 'Create Task *'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
