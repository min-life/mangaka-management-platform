'use client';

import { useState } from 'react';
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
import { createMaterial } from '@/services/file.service';
import { updateMaterial } from '@/services/material.service';
import { updateTask, getTaskMaterials } from '@/services/task.service';
import { toast } from '@/lib/toast';
import type { FileVersionItem } from '../../file-ui';
import type { TaskWorkspaceItem } from '../../../tasks/task-ui';

export function UpdateMaterialsDialog({
  open,
  onClose,
  pendingFiles,
  targetVersion,
  focusedTask,
  fileId,
  onRefresh,
  items,
}: {
  open: boolean;
  onClose: () => void;
  pendingFiles: { img?: File | null; text?: File | null; src?: File | null };
  targetVersion: FileVersionItem | undefined | null;
  focusedTask: TaskWorkspaceItem | null;
  fileId: number;
  onRefresh?: () => void | Promise<void>;
  items: ReadonlyArray<{
    type: 'img' | 'text' | 'src';
    label: string;
    icon: any;
    current: string | undefined;
    url?: string;
    downloadUrl?: string;
    accept?: string;
    pending: File | null | undefined;
  }>;
}) {
  const [commitMessage, setCommitMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      if (pendingFiles.img instanceof File) formData.append('image', pendingFiles.img);
      if (pendingFiles.text instanceof File) formData.append('text', pendingFiles.text);
      if (pendingFiles.src instanceof File) formData.append('source', pendingFiles.src);
      if (commitMessage.trim()) formData.append('name', commitMessage.trim());

      if (focusedTask) {
        formData.append('taskId', String(focusedTask.id));
      }

      if (targetVersion) {
        const options: { deleteImage?: boolean; deleteText?: boolean; deleteSource?: boolean; name?: string } = {};
        if (commitMessage.trim()) options.name = commitMessage.trim();
        if (pendingFiles.img === null) options.deleteImage = true;
        if (pendingFiles.text === null) options.deleteText = true;
        if (pendingFiles.src === null) options.deleteSource = true;
        await updateMaterial(targetVersion.id, formData, options);
      } else {
        await createMaterial(fileId, formData);
      }

      // If uploading for a task, also update the task description with version tag to display as submission
      if (focusedTask) {
        try {
          const taskMaterials = await getTaskMaterials(focusedTask.id);
          const versionTag = `v${(taskMaterials || []).length || 1}`;
          const note = commitMessage.trim();
          const updatedDesc = `${focusedTask.description || ''}\n[Note: ${note || 'Material uploaded'}] [version:${versionTag}]`.trim();
          await updateTask(focusedTask.id, { description: updatedDesc });
        } catch {
          // non-critical
        }
      }

      toast.success('Materials updated successfully');
      if (onRefresh) await onRefresh();
      onClose();
    } catch (error) {
      console.error('Failed to update materials:', error);
      toast.error('Failed to update materials');
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasFiles = Boolean(pendingFiles.img || pendingFiles.text || pendingFiles.src);

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="sm:max-w-md flex flex-col gap-0 overflow-hidden rounded-[7px] border border-[#39424f] bg-[#101820] p-0 text-white" showCloseButton={false}>
        <DialogHeader className="shrink-0 border-b border-[#39424f] px-6 py-5">
          <DialogTitle className="text-xl font-black text-white">Review Uploads</DialogTitle>
          <DialogDescription className="text-sm font-medium text-[#aeb7c2]">
            You are about to upload new materials. Please review and optionally provide a commit message.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <div className="space-y-2">
            <span className="text-[10px] font-black uppercase text-[#dce7f3]">Files to upload</span>
            <div className="flex flex-col gap-2 mt-2">
              {items.map((item) => {
                if (!item.pending && !item.current) return null;
                
                const isUpdated = Boolean(item.pending);
                const fileName = item.pending ? item.pending.name : item.current;
                
                return (
                  <div key={item.type} className="flex items-center gap-3 rounded-[4px] border border-[#26303b] bg-[#151c25] p-2">
                    <div className="grid size-8 shrink-0 place-items-center rounded bg-[#202832]">
                      <item.icon className="size-4 text-[#8b94a1]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="block text-[10px] font-black uppercase text-[#8b94a1]">{item.label}</span>
                      <span className="block truncate text-xs font-bold text-white">{fileName}</span>
                    </div>
                    {isUpdated ? (
                      <span className="shrink-0 rounded bg-[#FFD369]/10 px-2 py-1 text-[10px] font-black uppercase text-[#FFD369]">
                        New
                      </span>
                    ) : (
                      <span className="shrink-0 rounded bg-[#26303b] px-2 py-1 text-[10px] font-black uppercase text-[#8b94a1]">
                        Kept
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          <label className="block">
            <span className="text-[10px] font-black uppercase text-[#dce7f3]">Commit Message (Optional)</span>
            <textarea
              className="mt-2 h-24 w-full resize-none rounded-[4px] border border-[#39424f] bg-[#151c25] px-3 py-3 text-sm font-bold text-white outline-none placeholder:text-[#8b94a1] disabled:opacity-50"
              disabled={isSubmitting}
              onChange={(e) => setCommitMessage(e.target.value)}
              placeholder="Describe the changes made to these materials..."
              value={commitMessage}
            />
          </label>
        </div>

        <DialogFooter className="mx-0 mb-0 shrink-0 rounded-none border-[#39424f] bg-[#151c25] px-6 py-4">
          <DialogClose asChild>
            <Button
              className="h-9 rounded-[4px] border-[#4b535f] bg-[#101820] px-4 text-xs font-black text-white hover:bg-[#303842]"
              disabled={isSubmitting}
              type="button"
              variant="outline"
            >
              Cancel
            </Button>
          </DialogClose>
          <Button
            className="h-9 rounded-[4px] bg-[#FFD369] px-4 text-xs font-black text-[#222831] hover:bg-[#eac04f]"
            disabled={!hasFiles || isSubmitting}
            onClick={handleSubmit}
            type="button"
          >
            {isSubmitting ? 'Uploading...' : 'Confirm Update'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
