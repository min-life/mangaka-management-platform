'use client';

import { AlertTriangle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { ProjectMemberResponse } from '@/services/project.service';

type RemoveMemberDialogProps = {
  isSubmitting: boolean;
  member: ProjectMemberResponse | null;
  onClose: () => void;
  onConfirm: () => void;
};

export function RemoveMemberDialog({
  isSubmitting,
  member,
  onClose,
  onConfirm,
}: RemoveMemberDialogProps) {
  return (
    <Dialog
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
      open={Boolean(member)}
    >
      <DialogContent
        className="max-w-md gap-0 overflow-hidden rounded-[7px] border border-[#39424f] bg-[#101820] p-0 text-white"
        showCloseButton={false}
      >
        {member ? (
          <>
            <DialogHeader className="border-b border-[#39424f] px-6 py-5">
              <div className="mb-3 grid size-10 place-items-center rounded-[4px] border border-[#6b2637] bg-[#371522] text-[#ff9ab3]">
                <AlertTriangle className="size-5" />
              </div>
              <DialogTitle className="text-xl font-black text-white">Remove Member</DialogTitle>
              <DialogDescription className="text-sm font-medium text-[#aeb7c2]">
                {member.displayName ?? member.email} will lose access to this project. Completed
                tasks and history will remain.
              </DialogDescription>
            </DialogHeader>

            <DialogFooter className="mx-0 mb-0 rounded-none border-[#39424f] bg-[#151c25] px-6 py-4">
              <DialogClose asChild>
                <Button
                  className="h-9 rounded-[4px] border-[#4b535f] bg-[#101820] px-4 text-xs font-black text-white hover:bg-[#303842]"
                  type="button"
                  variant="outline"
                >
                  Cancel
                </Button>
              </DialogClose>
              <Button
                className="h-9 rounded-[4px] border-[#6b2637] bg-[#371522] px-4 text-xs font-black text-[#ff9ab3] hover:bg-[#4a1d2c]"
                disabled={isSubmitting}
                onClick={onConfirm}
                type="button"
                variant="outline"
              >
                {isSubmitting ? 'Removing...' : 'Remove Member'}
              </Button>
            </DialogFooter>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
