'use client';

import { useState } from 'react';
import { Crosshair } from 'lucide-react';

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
  onCancel: () => void;
  onCreate: (task: FileTaskItem) => void;
  open: boolean;
  region: FileTaskRegion | null;
  scope: 'REGION' | 'WHOLE_FILE';
};

const fallbackAssignees = ['Assistant Artist *', 'Sarah Jenkins *', 'Current user *'];

export function CreateAnnotatedTaskDialog({
  onCancel,
  onCreate,
  open,
  region,
  scope,
}: CreateAnnotatedTaskDialogProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignedTo, setAssignedTo] = useState(fallbackAssignees[0]);
  const [dueDate, setDueDate] = useState('2026-06-25');
  const [status, setStatus] = useState<FileStatus>('PENDING');

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setAssignedTo(fallbackAssignees[0]);
    setDueDate('2026-06-25');
    setStatus('PENDING');
  };

  const handleCancel = () => {
    resetForm();
    onCancel();
  };

  const handleCreate = () => {
    if (scope === 'REGION' && !region) {
      return;
    }

    onCreate({
      assignedTo,
      description: description.trim() || 'No description. *',
      dueDate: `${dueDate} *`,
      id: `task-local-${Date.now()}`,
      ...(region ? { region } : {}),
      status,
      title: `${title.trim()} *`,
    });
    resetForm();
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
        className="max-w-lg gap-0 overflow-hidden rounded-[7px] border border-[#39424f] bg-[#101820] p-0 text-white"
        showCloseButton={false}
      >
        <DialogHeader className="border-b border-[#39424f] px-6 py-5">
          <DialogTitle className="flex items-center gap-2 text-xl font-black text-white">
            <Crosshair className="size-5 text-[#FFD369]" />
            Create {scope === 'REGION' ? 'Regional' : 'Whole File'} Task
          </DialogTitle>
          <DialogDescription className="text-sm text-[#aeb7c2]">
            {scope === 'REGION'
              ? 'Assign work to the selected canvas region. Coordinates are stored as UI fallback. *'
              : 'Assign work that applies to the complete file. *'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 px-6 py-5">
          {region ? (
            <div className="grid grid-cols-4 gap-2 rounded-[4px] border border-[#39424f] bg-[#151c25] p-3">
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
          ) : null}

          <label className="block">
            <span className="text-[10px] font-black uppercase tracking-[0.08em] text-[#dce7f3]">
              Task Title
            </span>
            <input
              className="mt-2 h-10 w-full rounded-[4px] border border-[#39424f] bg-[#151c25] px-3 text-sm font-bold text-white outline-none placeholder:text-[#8b94a1]"
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Draw detailed character features"
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
              placeholder="Add detail to the face, hair, and costume in this region."
              value={description}
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-[10px] font-black uppercase tracking-[0.08em] text-[#dce7f3]">
                Assign To *
              </span>
              <select
                className="mt-2 h-10 w-full rounded-[4px] border border-[#39424f] bg-[#151c25] px-3 text-sm font-bold text-white outline-none"
                onChange={(event) => setAssignedTo(event.target.value)}
                value={assignedTo}
              >
                {fallbackAssignees.map((assignee) => (
                  <option key={assignee} value={assignee}>
                    {assignee}
                  </option>
                ))}
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

          <label className="block">
            <span className="text-[10px] font-black uppercase tracking-[0.08em] text-[#dce7f3]">
              Due Date *
            </span>
            <input
              className="mt-2 h-10 w-full rounded-[4px] border border-[#39424f] bg-[#151c25] px-3 text-sm font-bold text-white outline-none"
              onChange={(event) => setDueDate(event.target.value)}
              type="date"
              value={dueDate}
            />
          </label>
        </div>

        <DialogFooter className="mx-0 mb-0 rounded-none border-[#39424f] bg-[#151c25] px-6 py-4">
          <Button onClick={handleCancel} variant="outline">
            Cancel
          </Button>
          <Button
            className="bg-[#FFD369] text-[#222831] hover:bg-[#eac04f]"
            disabled={!title.trim() || !dueDate || (scope === 'REGION' && !region)}
            onClick={handleCreate}
          >
            Create Task *
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
