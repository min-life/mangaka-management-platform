'use client';

import { useState } from 'react';
import { MessageSquareText } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import type { FileTaskRegion, SubmissionFrameComment } from '../file-ui';

type CreateFrameCommentDialogProps = {
  onCancel: () => void;
  onCreate: (comment: SubmissionFrameComment) => void;
  region: FileTaskRegion | null;
};

export function CreateFrameCommentDialog({
  onCancel,
  onCreate,
  region,
}: CreateFrameCommentDialogProps) {
  const [content, setContent] = useState('');

  const handleCreate = () => {
    if (!region || !content.trim()) return;
    onCreate({
      author: 'Mangaka reviewer',
      content: content.trim(),
      id: `frame-comment-${Date.now()}`,
      region,
      time: 'Just now',
    });
    setContent('');
  };

  return (
    <Dialog open={Boolean(region)} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="max-w-md gap-0 overflow-hidden border-[#39424f] bg-[#151c25] p-0 text-white shadow-2xl sm:rounded-xl" showCloseButton={false}>
        <DialogHeader className="border-b border-[#39424f] bg-[#1a232f] px-5 py-4 sm:rounded-t-xl">
          <DialogTitle className="flex items-center gap-2 text-base font-bold text-white">
            <MessageSquareText className="size-4 text-[#FFD369]" /> Add Frame Comment
          </DialogTitle>
          <DialogDescription className="text-xs text-[#8b94a1]">
            This note is attached to the selected region of this submission.
          </DialogDescription>
        </DialogHeader>
        <div className="bg-[#151c25] px-5 py-4">
          <textarea
            autoFocus
            className="h-28 w-full resize-none rounded-lg border border-[#39424f] bg-[#101820] p-3 text-sm text-white placeholder:text-[#6a7381] focus:border-[#FFD369] focus:outline-none focus:ring-1 focus:ring-[#FFD369] transition-all"
            onChange={(event) => setContent(event.target.value)}
            placeholder="Describe what should be corrected in this region..."
            value={content}
          />
        </div>
        <DialogFooter className="m-0 border-t border-[#39424f] bg-[#1a232f] px-5 py-3 sm:justify-end sm:rounded-b-xl">
          <div className="flex w-full items-center justify-end gap-3">
            <Button
              className="text-[#aeb7c2] hover:bg-[#2b3543] hover:text-white"
              onClick={onCancel}
              variant="ghost"
            >
              Cancel
            </Button>
            <Button
              className="bg-[#FFD369] font-medium text-[#222831] transition-colors hover:bg-[#eac04f] disabled:opacity-50"
              disabled={!content.trim()}
              onClick={handleCreate}
            >
              Add Comment
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
