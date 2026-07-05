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
  onSubmit: (input: {
    image?: File;
    text?: File;
    source?: File;
    note: string;
  }) => void | Promise<void>;
};

export function SubmitWorkDialog({ onSubmit }: SubmitWorkDialogProps) {
  const imageRef = useRef<HTMLInputElement>(null);
  const textRef = useRef<HTMLInputElement>(null);
  const sourceRef = useRef<HTMLInputElement>(null);

  const [open, setOpen] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [textFile, setTextFile] = useState<File | null>(null);
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [note, setNote] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!imageFile || !note.trim()) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        image: imageFile,
        text: textFile || undefined,
        source: sourceFile || undefined,
        note: note.trim(),
      });
      setImageFile(null);
      setTextFile(null);
      setSourceFile(null);
      setNote('');
      setConfirmed(false);
      setOpen(false);
    } catch (err) {
      console.error(err);
      setError('Failed to upload submission work.');
    } finally {
      setIsSubmitting(false);
    }
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
          {/* File slot 1: Image (Required) */}
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-[#8b94a1] tracking-wider">
              Preview Image or PDF (Required)
            </label>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                className="h-8 border-[#39424f] bg-[#151c25] text-[10px] text-white hover:bg-[#202832] disabled:opacity-50"
                disabled={isSubmitting}
                onClick={() => imageRef.current?.click()}
              >
                <Upload className="size-3 mt-0.5" /> Choose Image
              </Button>
              <span className="truncate text-xs text-[#aeb7c2]">
                {imageFile ? imageFile.name : 'No file chosen'}
              </span>
              <input
                type="file"
                ref={imageRef}
                accept="image/*,application/pdf"
                className="hidden"
                disabled={isSubmitting}
                onChange={(e) => setImageFile(e.target.files?.[0] || null)}
              />
            </div>
          </div>

          {/* File slot 2: Text (Optional) */}
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-[#8b94a1] tracking-wider">
              Manga Script / Translation (Optional)
            </label>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                className="h-8 border-[#39424f] bg-[#151c25] text-[10px] text-white hover:bg-[#202832] disabled:opacity-50"
                disabled={isSubmitting}
                onClick={() => textRef.current?.click()}
              >
                <Upload className="size-3 mt-0.5" /> Choose Script
              </Button>
              <span className="truncate text-xs text-[#aeb7c2]">
                {textFile ? textFile.name : 'No file chosen'}
              </span>
              <input
                type="file"
                ref={textRef}
                accept=".txt,.pdf,.docx,.doc"
                className="hidden"
                disabled={isSubmitting}
                onChange={(e) => setTextFile(e.target.files?.[0] || null)}
              />
            </div>
          </div>

          {/* File slot 3: Source (Optional) */}
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-[#8b94a1] tracking-wider">
              Source PSD / CLIP / ZIP (Optional)
            </label>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                className="h-8 border-[#39424f] bg-[#151c25] text-[10px] text-white hover:bg-[#202832] disabled:opacity-50"
                disabled={isSubmitting}
                onClick={() => sourceRef.current?.click()}
              >
                <Upload className="size-3 mt-0.5" /> Choose Source
              </Button>
              <span className="truncate text-xs text-[#aeb7c2]">
                {sourceFile ? sourceFile.name : 'No file chosen'}
              </span>
              <input
                type="file"
                ref={sourceRef}
                accept=".psd,.clip,.zip,.rar"
                className="hidden"
                disabled={isSubmitting}
                onChange={(e) => setSourceFile(e.target.files?.[0] || null)}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-[#8b94a1] tracking-wider">
              Submission Note
            </label>
            <textarea
              className="h-20 w-full resize-none border border-[#39424f] bg-[#151c25] px-3 py-2 text-xs font-medium text-white outline-none placeholder:text-[#8b94a1] rounded-[4px] disabled:opacity-50"
              disabled={isSubmitting}
              onChange={(event) => setNote(event.target.value)}
              placeholder="What changed, and what should the reviewer check?"
              value={note}
            />
          </div>

          <label className="flex items-start gap-3 border border-[#303842] bg-[#151c25] p-3 text-xs font-bold text-[#dce7f3] disabled:opacity-50">
            <input className="mt-0.5 accent-[#FFD369]" checked={confirmed} disabled={isSubmitting} onChange={(event) => setConfirmed(event.target.checked)} type="checkbox" />
            The selected task requirements have been completed.
          </label>

          {error ? (
            <p className="text-xs font-bold text-red-300">
              {error}
            </p>
          ) : null}
        </div>
        <DialogFooter className="mx-0 mb-0 rounded-none border-[#39424f] bg-[#151c25] px-6 py-4">
          <DialogClose asChild><Button variant="outline" disabled={isSubmitting}>Cancel</Button></DialogClose>
          <Button className="bg-[#FFD369] text-[#222831] hover:bg-[#eac04f]" disabled={!imageFile || !note.trim() || !confirmed || isSubmitting} onClick={handleSubmit}>
            {isSubmitting ? 'Submitting...' : 'Submit for Review'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
