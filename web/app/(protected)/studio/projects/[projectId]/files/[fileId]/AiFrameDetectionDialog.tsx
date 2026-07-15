'use client';

import { useState } from 'react';
import { Loader2, Sparkles } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type AiFrameDetectionDialogProps = {
  isDetecting: boolean;
  onCancel: () => void;
  onDetect: (objectName: string) => void;
  open: boolean;
};

export function AiFrameDetectionDialog({
  isDetecting,
  onCancel,
  onDetect,
  open,
}: AiFrameDetectionDialogProps) {
  const [objectName, setObjectName] = useState('');

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmedName = objectName.trim();
    if (!trimmedName || isDetecting) {
      return;
    }

    onDetect(trimmedName);
    setObjectName('');
  };

  const handleCancel = () => {
    setObjectName('');
    onCancel();
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && handleCancel()}>
      <DialogContent
        className="max-w-md gap-0 overflow-hidden border-[#39424f] bg-[#151c25] p-0 text-white shadow-2xl sm:rounded-xl"
        showCloseButton={false}
      >
        <form onSubmit={handleSubmit}>
          <DialogHeader className="border-b border-[#39424f] bg-[#1a232f] px-5 py-4 sm:rounded-t-xl">
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-white">
              <Sparkles className="size-4 text-[#FFD369]" />
              AI Frame Detection
            </DialogTitle>
            <DialogDescription className="text-xs text-[#8b94a1]">
              Enter the object AI should locate in the current image.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-[#151c25] px-5 py-4">
            <label className="text-xs font-black uppercase tracking-[0.08em] text-[#aeb7c2]">
              Object to frame
              <input
                autoFocus
                className="mt-2 h-10 w-full rounded-[6px] border border-[#39424f] bg-[#101820] px-3 text-sm font-bold text-white outline-none placeholder:text-[#6a7381] transition-all focus:border-[#FFD369] focus:ring-1 focus:ring-[#FFD369]"
                disabled={isDetecting}
                onChange={(event) => setObjectName(event.target.value)}
                placeholder="Luffy, character face, One Piece logo..."
                value={objectName}
              />
            </label>
            <p className="mt-3 text-xs font-medium leading-5 text-[#8b94a1]">
              AI will return a draft frame that you can move or resize before saving a frame
              comment.
            </p>
          </div>
          <DialogFooter className="m-0 border-t border-[#39424f] bg-[#1a232f] px-5 py-3 sm:justify-end sm:rounded-b-xl">
            <div className="flex w-full items-center justify-end gap-3">
              <Button
                className="text-[#aeb7c2] hover:bg-[#2b3543] hover:text-white"
                disabled={isDetecting}
                onClick={handleCancel}
                type="button"
                variant="ghost"
              >
                Cancel
              </Button>
              <Button
                className="bg-[#FFD369] font-medium text-[#222831] transition-colors hover:bg-[#eac04f] disabled:opacity-50"
                disabled={!objectName.trim() || isDetecting}
                type="submit"
              >
                {isDetecting ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Detecting
                  </>
                ) : (
                  'Detect Frame'
                )}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
