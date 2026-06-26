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

import type { TaskPriority, TaskStatus, TaskWorkspaceItem } from './task-ui';

type CreateTaskDialogProps = {
  fileOptions: Array<{ id: number; title: string }>;
  onCreate: (task: TaskWorkspaceItem) => void;
};

const assignees = ['Kaito Yamamoto *', 'Hana Tanaka *', 'Akira Tanaka *'];

export function CreateTaskDialog({ fileOptions, onCreate }: CreateTaskDialogProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [fileId, setFileId] = useState(fileOptions[0]?.id ? String(fileOptions[0].id) : '');
  const [assignee, setAssignee] = useState(assignees[0]);
  const [priority, setPriority] = useState<TaskPriority>('MEDIUM');
  const [status, setStatus] = useState<TaskStatus>('PENDING');
  const [dueDate, setDueDate] = useState('2026-06-25');

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setAssignee(assignees[0]);
    setPriority('MEDIUM');
    setStatus('PENDING');
    setDueDate('2026-06-25');
  };

  const handleCreate = () => {
    const selectedFile = fileOptions.find((file) => file.id === Number(fileId));
    onCreate({
      assignee,
      description: description.trim() || 'No description. *',
      dueDate: `${dueDate} *`,
      fileId: Number(fileId),
      fileTitle: selectedFile?.title ?? 'Unknown file *',
      id: `task-local-${Date.now()}`,
      isFallback: true,
      isMine: assignee === 'Kaito Yamamoto *',
      previewUrl:
        'https://images.unsplash.com/photo-1518709268805-4e9042af2176?q=80&w=1400&auto=format&fit=crop',
      priority,
      status,
      submissions: [],
      title: `${title.trim()} *`,
      updatedAt: 'Just now *',
    });
    resetForm();
    setOpen(false);
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
              className="mt-2 h-10 w-full rounded-[4px] border border-[#39424f] bg-[#151c25] px-3 text-sm font-bold text-white outline-none placeholder:text-[#8b94a1]"
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Finalize inking for Chapter 01"
              value={title}
            />
          </label>
          <label className="block">
            <span className="text-[10px] font-black uppercase tracking-[0.08em] text-[#dce7f3]">Description</span>
            <textarea
              className="mt-2 h-24 w-full resize-none rounded-[4px] border border-[#39424f] bg-[#151c25] px-3 py-3 text-sm font-bold text-white outline-none placeholder:text-[#8b94a1]"
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Describe the expected production result"
              value={description}
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label>
              <span className="text-[10px] font-black uppercase text-[#dce7f3]">Related File *</span>
              <select className="mt-2 h-10 w-full rounded-[4px] border border-[#39424f] bg-[#151c25] px-3 text-xs font-bold text-white" onChange={(event) => setFileId(event.target.value)} value={fileId}>
                {fileOptions.map((file) => <option key={file.id} value={file.id}>{file.title}</option>)}
              </select>
            </label>
            <label>
              <span className="text-[10px] font-black uppercase text-[#dce7f3]">Assignee *</span>
              <select className="mt-2 h-10 w-full rounded-[4px] border border-[#39424f] bg-[#151c25] px-3 text-xs font-bold text-white" onChange={(event) => setAssignee(event.target.value)} value={assignee}>
                {assignees.map((name) => <option key={name}>{name}</option>)}
              </select>
            </label>
            <label>
              <span className="text-[10px] font-black uppercase text-[#dce7f3]">Priority *</span>
              <select className="mt-2 h-10 w-full rounded-[4px] border border-[#39424f] bg-[#151c25] px-3 text-xs font-bold text-white" onChange={(event) => setPriority(event.target.value as TaskPriority)} value={priority}>
                {(['LOW', 'MEDIUM', 'HIGH'] as const).map((value) => <option key={value}>{value}</option>)}
              </select>
            </label>
            <label>
              <span className="text-[10px] font-black uppercase text-[#dce7f3]">Status</span>
              <select className="mt-2 h-10 w-full rounded-[4px] border border-[#39424f] bg-[#151c25] px-3 text-xs font-bold text-white" onChange={(event) => setStatus(event.target.value as TaskStatus)} value={status}>
                {(['PENDING', 'INPROGRESS', 'REVIEW', 'DONE'] as const).map((value) => <option key={value}>{value}</option>)}
              </select>
            </label>
          </div>
          <label className="block">
            <span className="text-[10px] font-black uppercase text-[#dce7f3]">Due Date *</span>
            <input className="mt-2 h-10 w-full rounded-[4px] border border-[#39424f] bg-[#151c25] px-3 text-sm font-bold text-white" onChange={(event) => setDueDate(event.target.value)} type="date" value={dueDate} />
          </label>
        </div>
        <DialogFooter className="mx-0 mb-0 shrink-0 rounded-none border-[#39424f] bg-[#151c25] px-6 py-4">
          <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
          <Button className="bg-[#FFD369] text-[#222831] hover:bg-[#eac04f]" disabled={!title.trim() || !fileId} onClick={handleCreate}>Create Task *</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
