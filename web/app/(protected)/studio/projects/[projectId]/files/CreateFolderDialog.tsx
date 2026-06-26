'use client';

import { useState } from 'react';
import { FolderPlus } from 'lucide-react';

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
import type { ProjectFolderResponse } from '@/services/project.service';

type CreateFolderDialogProps = {
  folders: ProjectFolderResponse[];
  isSubmitting: boolean;
  onCreate: (input: { description?: string; parentId?: number; title: string }) => Promise<void>;
  selectedFolderId: number | null;
};

export function CreateFolderDialog({
  folders,
  isSubmitting,
  onCreate,
  selectedFolderId,
}: CreateFolderDialogProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [parentId, setParentId] = useState(selectedFolderId ? String(selectedFolderId) : 'root');

  const handleCreate = async () => {
    await onCreate({
      description: description.trim() || undefined,
      parentId: parentId === 'root' ? undefined : Number(parentId),
      title: title.trim(),
    });
    setOpen(false);
    setTitle('');
    setDescription('');
  };

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger asChild>
        <Button
          className="h-9 rounded-[4px] border-[#4b535f] bg-[#101820] px-4 text-xs font-black text-white hover:bg-[#303842]"
          variant="outline"
        >
          <FolderPlus className="size-4" />
          New Folder
        </Button>
      </DialogTrigger>
      <DialogContent
        className="max-w-lg gap-0 overflow-hidden rounded-[7px] border border-[#39424f] bg-[#101820] p-0 text-white"
        showCloseButton={false}
      >
        <DialogHeader className="border-b border-[#39424f] px-6 py-5">
          <DialogTitle className="text-xl font-black text-white">Create Folder</DialogTitle>
          <DialogDescription className="text-sm font-medium text-[#aeb7c2]">
            Organize production records inside this project.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 px-6 py-5">
          <label className="block">
            <span className="text-[10px] font-black uppercase tracking-[0.08em] text-[#dce7f3]">
              Folder Name
            </span>
            <input
              className="mt-2 h-10 w-full rounded-[4px] border border-[#39424f] bg-[#151c25] px-3 text-sm font-bold text-white outline-none placeholder:text-[#8b94a1]"
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Chapter 01"
              value={title}
            />
          </label>
          <label className="block">
            <span className="text-[10px] font-black uppercase tracking-[0.08em] text-[#dce7f3]">
              Description
            </span>
            <textarea
              className="mt-2 h-20 w-full resize-none rounded-[4px] border border-[#39424f] bg-[#151c25] px-3 py-3 text-sm font-bold text-white outline-none placeholder:text-[#8b94a1]"
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Optional folder description"
              value={description}
            />
          </label>
          <label className="block">
            <span className="text-[10px] font-black uppercase tracking-[0.08em] text-[#dce7f3]">
              Parent Folder
            </span>
            <select
              className="mt-2 h-10 w-full rounded-[4px] border border-[#39424f] bg-[#151c25] px-3 text-sm font-bold text-white outline-none"
              onChange={(event) => setParentId(event.target.value)}
              value={parentId}
            >
              <option value="root">Project root</option>
              {folders.map((folder) => (
                <option key={folder.id} value={folder.id}>
                  {folder.title}
                </option>
              ))}
            </select>
          </label>
        </div>
        <DialogFooter className="mx-0 mb-0 rounded-none border-[#39424f] bg-[#151c25] px-6 py-4">
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button
            className="bg-[#FFD369] text-[#222831] hover:bg-[#eac04f]"
            disabled={isSubmitting || !title.trim()}
            onClick={() => void handleCreate()}
          >
            {isSubmitting ? 'Creating...' : 'Create Folder'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
