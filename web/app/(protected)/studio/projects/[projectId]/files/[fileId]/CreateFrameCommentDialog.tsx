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
      <DialogContent className="max-w-md gap-0 overflow-hidden border-[#39424f] bg-[#101820] p-0 text-white" showCloseButton={false}>
        <DialogHeader className="border-b border-[#39424f] px-5 py-4">
          <DialogTitle className="flex items-center gap-2 text-base font-black text-white">
            <MessageSquareText className="size-4 text-[#FFD369]" /> Add Frame Comment
          </DialogTitle>
          <DialogDescription className="text-xs text-[#aeb7c2]">
            This note is attached to the selected region of this submission.
          </DialogDescription>
        </DialogHeader>
        <div className="px-5 py-4">
          <textarea
            autoFocus
            className="h-28 w-full resize-none border border-[#39424f] bg-[#151c25] p-3 text-sm text-white outline-none placeholder:text-[#8b94a1]"
            onChange={(event) => setContent(event.target.value)}
            placeholder="Describe what should be corrected in this region..."
            value={content}
          />
        </div>
        <DialogFooter className="mx-0 mb-0 rounded-none border-[#39424f] bg-[#151c25] px-5 py-3">
          <Button onClick={onCancel} variant="outline">Cancel</Button>
          <Button className="bg-[#FFD369] text-[#222831] hover:bg-[#eac04f]" disabled={!content.trim()} onClick={handleCreate}>
            Add Comment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
