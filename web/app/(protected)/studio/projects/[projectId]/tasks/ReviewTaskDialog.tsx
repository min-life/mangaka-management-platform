import { Check, X } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export type ReviewActionType = 'APPROVE' | 'REJECT' | null;

type ReviewTaskDialogProps = {
  action: ReviewActionType;
  isSubmitting?: boolean;
  onClose: () => void;
  onSubmit: (approved: boolean, note: string) => void;
};

export function ReviewTaskDialog({ action, isSubmitting, onClose, onSubmit }: ReviewTaskDialogProps) {
  const [note, setNote] = useState('');

  // Reset note when dialog opens/closes
  useEffect(() => {
    if (action) {
      setNote('');
    }
  }, [action]);

  const handleSubmit = () => {
    if (action === 'REJECT' && !note.trim()) return;
    onSubmit(action === 'APPROVE', note.trim());
  };

  return (
    <Dialog onOpenChange={(open) => !open && onClose()} open={action !== null}>
      <DialogContent className="max-w-[400px] gap-0 border-[#39424f] bg-[#151c25] p-0 text-white sm:rounded-[8px] overflow-hidden" showCloseButton={false}>
        <DialogHeader className="border-b border-[#26303b] px-6 py-4 flex flex-row items-center justify-between">
          <DialogTitle className="flex items-center gap-2 text-lg font-black text-white">
            {action === 'APPROVE' ? (
              <>
                <Check className="size-5 text-[#FFD369]" /> Approve Submission
              </>
            ) : (
              <>
                <X className="size-5 text-[#ff9ab3]" /> Request Changes
              </>
            )}
          </DialogTitle>
          <DialogClose className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
            <X className="size-4" />
            <span className="sr-only">Close</span>
          </DialogClose>
        </DialogHeader>
        
        <div className="p-6">
          <p className="mb-4 text-xs leading-relaxed text-[#dce7f3]">
            {action === 'APPROVE'
              ? 'Are you sure you want to approve this submission? The task will be marked as Done. You can optionally leave a note for the assignee.'
              : 'Please leave a note explaining what needs to be changed. The task status will revert to In Progress.'}
          </p>
          <textarea
            className="h-24 w-full resize-none rounded-[4px] border border-[#2a3444] bg-[#0d151e] p-3 text-xs text-white outline-none placeholder:text-[#5d6878] focus:border-[#FFD369]/50"
            onChange={(e) => setNote(e.target.value)}
            placeholder={action === 'APPROVE' ? "Optional review note..." : "Required review note..."}
            value={note}
          />
        </div>

        <DialogFooter className="mx-0 mb-0 flex-row justify-end rounded-none border-t border-[#26303b] bg-[#111820]/60 px-6 py-4 gap-2 sm:justify-end">
          <DialogClose asChild>
            <Button
              className="h-9 border-[#4a4f55] bg-[#20282b] text-xs font-bold text-[#dce7f3] hover:bg-[#2a3444] m-0"
              disabled={isSubmitting}
              variant="outline"
            >
              Cancel
            </Button>
          </DialogClose>
          <Button
            className={`h-9 px-5 text-xs font-black m-0 ${
              action === 'APPROVE'
                ? 'bg-[#FFD369] text-[#222831] hover:bg-[#eac04f]'
                : 'bg-[#6b2637] text-[#ff9ab3] hover:bg-[#8b3147]'
            }`}
            disabled={isSubmitting || (action === 'REJECT' && !note.trim())}
            onClick={handleSubmit}
          >
            {isSubmitting ? 'Submitting...' : action === 'APPROVE' ? 'Approve Task' : 'Reject Task'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
