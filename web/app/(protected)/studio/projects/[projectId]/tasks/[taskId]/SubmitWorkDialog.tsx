'use client';

import { useRef, useState } from 'react';
import { FileUp, Upload } from 'lucide-react';

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

type SubmitWorkDialogProps = {
  onSubmit: (input: { file: File; note: string }) => void;
};

export function SubmitWorkDialog({ onSubmit }: SubmitWorkDialogProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [assetName, setAssetName] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [note, setNote] = useState('');
  const [confirmed, setConfirmed] = useState(false);

  const handleSubmit = () => {
    if (!selectedFile || !note.trim()) return;
    onSubmit({
      file: selectedFile,
      note: note.trim(),
    });
    setAssetName('');
    setSelectedFile(null);
    setNote('');
    setConfirmed(false);
    setOpen(false);
  };

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger asChild>
        <Button className="h-9 rounded-[4px] bg-[#FFD369] px-4 text-xs font-black text-[#222831] hover:bg-[#eac04f]">
          <Upload className="size-4" />
          Submit for Review *
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg gap-0 overflow-hidden border-[#39424f] bg-[#101820] p-0 text-white" showCloseButton={false}>
        <DialogHeader className="border-b border-[#39424f] px-6 py-5">
          <DialogTitle className="text-xl font-black text-white">Submit Work for Review</DialogTitle>
          <DialogDescription className="text-sm text-[#aeb7c2]">
            Attach the completed result and leave context for the reviewer.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 px-6 py-5">
          <input
            accept="image/*,.pdf,.psd,.clip"
            className="hidden"
            onChange={(event) => {
              const fileObj = event.target.files?.[0];
              setAssetName(fileObj?.name ?? '');
              setSelectedFile(fileObj ?? null);
            }}
            ref={inputRef}
            type="file"
          />
          <button
            className="grid min-h-28 w-full place-items-center border border-dashed border-[#4b535f] bg-[#151c25] p-4 text-center hover:border-[#FFD369]"
            onClick={() => inputRef.current?.click()}
            type="button"
          >
            <span>
              <FileUp className="mx-auto size-6 text-[#FFD369]" />
              <span className="mt-2 block text-xs font-black text-white">{assetName || 'Choose completed work'}</span>
              <span className="mt-1 block text-[10px] font-bold text-[#8b94a1]">
                Work will be uploaded as a new material version.
              </span>
            </span>
          </button>
          <textarea
            className="h-24 w-full resize-none border border-[#39424f] bg-[#151c25] px-3 py-3 text-sm font-medium text-white outline-none placeholder:text-[#8b94a1]"
            onChange={(event) => setNote(event.target.value)}
            placeholder="What changed, and what should the reviewer check?"
            value={note}
          />
          <label className="flex items-start gap-3 border border-[#303842] bg-[#151c25] p-3 text-xs font-bold text-[#dce7f3]">
            <input className="mt-0.5 accent-[#FFD369]" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} type="checkbox" />
            The selected task requirements have been completed.
          </label>
        </div>
        <DialogFooter className="mx-0 mb-0 rounded-none border-[#39424f] bg-[#151c25] px-6 py-4">
          <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
          <Button className="bg-[#FFD369] text-[#222831] hover:bg-[#eac04f]" disabled={!assetName || !note.trim() || !confirmed} onClick={handleSubmit}>Submit for Review</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
