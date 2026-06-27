'use client';

import { useState } from 'react';
import { Send } from 'lucide-react';

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
import type { ApplicationType } from '@/services/application.service';

import type { FileExplorerItem } from './file-ui';

type CreateFileReviewDialogProps = {
  file: FileExplorerItem;
  isSubmitting: boolean;
  onSubmit: (input: { description?: string; title: string; type: ApplicationType }) => Promise<void>;
};

export function CreateFileReviewDialog({
  file,
  isSubmitting,
  onSubmit,
}: CreateFileReviewDialogProps) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<ApplicationType>('MANUSCRIPT_REVIEW');
  const [title, setTitle] = useState(`Review ${file.title.replace(/ \*$/, '')}`);
  const [description, setDescription] = useState(file.description?.replace(/ \*$/, '') ?? '');

  const handleSubmit = async () => {
    await onSubmit({
      description: description.trim() || undefined,
      title: title.trim(),
      type,
    });
    setOpen(false);
  };

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger asChild>
        <Button className="h-9 w-full rounded-[4px] bg-[#FFD369] text-xs font-black text-[#222831] hover:bg-[#eac04f]">
          <Send className="size-4" />
          Create Review Request
        </Button>
      </DialogTrigger>
      <DialogContent
        className="max-w-lg gap-0 overflow-hidden rounded-[7px] border border-[#39424f] bg-[#101820] p-0 text-white"
        showCloseButton={false}
      >
        <DialogHeader className="border-b border-[#39424f] px-6 py-5">
          <DialogTitle className="text-xl font-black text-white">Create Review Request</DialogTitle>
          <DialogDescription className="text-sm font-medium text-[#aeb7c2]">
            Submit this file record to the Applications workflow.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 px-6 py-5">
          <label className="block">
            <span className="text-[10px] font-black uppercase tracking-[0.08em] text-[#dce7f3]">
              Application Type
            </span>
            <select
              className="mt-2 h-10 w-full rounded-[4px] border border-[#39424f] bg-[#151c25] px-3 text-sm font-bold text-white outline-none"
              onChange={(event) => setType(event.target.value as ApplicationType)}
              value={type}
            >
              <option value="MANUSCRIPT_REVIEW">Manuscript Review</option>
              <option value="PUBLISH_REQUEST">Publish Request</option>
            </select>
          </label>
          <label className="block">
            <span className="text-[10px] font-black uppercase tracking-[0.08em] text-[#dce7f3]">
              Title
            </span>
            <input
              className="mt-2 h-10 w-full rounded-[4px] border border-[#39424f] bg-[#151c25] px-3 text-sm font-bold text-white outline-none"
              onChange={(event) => setTitle(event.target.value)}
              value={title}
            />
          </label>
          <label className="block">
            <span className="text-[10px] font-black uppercase tracking-[0.08em] text-[#dce7f3]">
              Description
            </span>
            <textarea
              className="mt-2 h-24 w-full resize-none rounded-[4px] border border-[#39424f] bg-[#151c25] px-3 py-3 text-sm font-bold text-white outline-none"
              onChange={(event) => setDescription(event.target.value)}
              value={description}
            />
          </label>
          <div className="rounded-[4px] border border-[#39424f] bg-[#151c25] px-4 py-3">
            <p className="text-[10px] font-black uppercase tracking-[0.08em] text-[#8b94a1]">
              Related File
            </p>
            <p className="mt-2 text-xs font-black text-white">{file.title}</p>
          </div>
        </div>
        <DialogFooter className="mx-0 mb-0 rounded-none border-[#39424f] bg-[#151c25] px-6 py-4">
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button
            className="bg-[#FFD369] text-[#222831] hover:bg-[#eac04f]"
            disabled={isSubmitting || !title.trim()}
            onClick={() => void handleSubmit()}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Request'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
