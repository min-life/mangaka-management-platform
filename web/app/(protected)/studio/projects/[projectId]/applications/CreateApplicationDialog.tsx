'use client';

import { FileUp, Plus, X } from 'lucide-react';

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

export type UploadedApplicationFile = {
  id: string;
  lastModified: number;
  mimeType: string;
  name: string;
  sizeBytes: number;
};

type CreateApplicationDialogProps = {
  description: string;
  isSubmitting: boolean;
  onCreate: () => void;
  onDescriptionChange: (value: string) => void;
  onFilesChange: (files: UploadedApplicationFile[]) => void;
  onOpenChange: (open: boolean) => void;
  onTitleChange: (value: string) => void;
  onTypeChange: (value: ApplicationType) => void;
  open: boolean;
  title: string;
  type: ApplicationType;
  uploadedFiles: UploadedApplicationFile[];
};

export function CreateApplicationDialog({
  description,
  isSubmitting,
  onCreate,
  onDescriptionChange,
  onFilesChange,
  onOpenChange,
  onTitleChange,
  onTypeChange,
  open,
  title,
  type,
  uploadedFiles,
}: CreateApplicationDialogProps) {
  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files ?? []);

    if (!selectedFiles.length) {
      return;
    }

    const nextFiles = selectedFiles.map((file) => ({
      id: `${file.name}-${file.size}-${file.lastModified}`,
      lastModified: file.lastModified,
      mimeType: file.type || 'application/octet-stream',
      name: file.name,
      sizeBytes: file.size,
    }));

    const existingIds = new Set(uploadedFiles.map((file) => file.id));
    onFilesChange([...uploadedFiles, ...nextFiles.filter((file) => !existingIds.has(file.id))]);
    event.target.value = '';
  };

  const handleRemoveFile = (fileId: string) => {
    onFilesChange(uploadedFiles.filter((file) => file.id !== fileId));
  };

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogTrigger asChild>
        <Button className="h-9 rounded-[4px] bg-[#FFD369] px-4 text-xs font-black text-[#222831] hover:bg-[#eac04f]">
          <Plus className="size-4" />
          New Request
        </Button>
      </DialogTrigger>
      <DialogContent
        className="flex max-h-[86vh] w-[640px] max-w-[calc(100vw-2rem)] flex-col gap-0 overflow-hidden rounded-[7px] border border-[#39424f] bg-[#101820] p-0 text-white"
        showCloseButton={false}
      >
        <DialogHeader className="shrink-0 border-b border-[#39424f] px-6 py-5">
          <DialogTitle className="text-[22px] font-black text-white">
            New Application Request
          </DialogTitle>
          <DialogDescription className="text-sm font-medium leading-6 text-[#aeb7c2]">
            Submit a manuscript review or publishing request for this project.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-5">
          <label className="block">
            <span className="text-[10px] font-black uppercase tracking-[0.08em] text-[#dce7f3]">
              Title
            </span>
            <input
              className="mt-2 h-10 w-full rounded-[4px] border border-[#39424f] bg-[#151c25] px-3 text-sm font-bold text-white outline-none placeholder:text-[#8b94a1]"
              onChange={(event) => onTitleChange(event.target.value)}
              placeholder="Chapter 12 Manuscript Review"
              value={title}
            />
          </label>

          <label className="block">
            <span className="text-[10px] font-black uppercase tracking-[0.08em] text-[#dce7f3]">
              Type
            </span>
            <select
              className="mt-2 h-10 w-full rounded-[4px] border border-[#39424f] bg-[#151c25] px-3 text-sm font-bold text-white outline-none"
              onChange={(event) => onTypeChange(event.target.value as ApplicationType)}
              value={type}
            >
              <option value="MANUSCRIPT_REVIEW">Manuscript Review</option>
              <option value="PUBLISH_REQUEST">Publish Request</option>
            </select>
          </label>

          <label className="block">
            <span className="text-[10px] font-black uppercase tracking-[0.08em] text-[#dce7f3]">
              Description
            </span>
            <textarea
              className="mt-2 h-24 w-full resize-none rounded-[4px] border border-[#39424f] bg-[#151c25] px-3 py-3 text-sm font-bold text-white outline-none placeholder:text-[#8b94a1]"
              onChange={(event) => onDescriptionChange(event.target.value)}
              placeholder="What should reviewers check before approval?"
              value={description}
            />
          </label>

          <section>
            <span className="text-[10px] font-black uppercase tracking-[0.08em] text-[#dce7f3]">
              Uploaded Files
            </span>
            <label
              className="mt-2 flex min-h-28 cursor-pointer flex-col items-center justify-center gap-3 rounded-[4px] border border-dashed border-[#4b535f] bg-[#151c25] px-4 py-5 text-center hover:border-[#FFD369]/70 hover:bg-[#17202b]"
              htmlFor="application_upload_files"
            >
              <FileUp className="size-7 text-[#FFD369]" />
              <span className="text-sm font-black text-white">Import files from your computer</span>
              <span className="text-xs font-bold text-[#8b94a1]">
                PDF, ZIP, PNG, JPG, PSD, CLIP, or manuscript package
              </span>
            </label>
            <input
              className="hidden"
              id="application_upload_files"
              multiple
              onChange={handleFileInputChange}
              type="file"
            />
            <div className="mt-3 max-h-52 overflow-y-auto rounded-[4px] border border-[#39424f] bg-[#151c25]">
              {uploadedFiles.length ? (
                uploadedFiles.map((file) => (
                  <div
                    className="flex min-h-12 items-center justify-between gap-3 border-b border-[#303842] px-4 py-3 last:border-b-0"
                    key={file.id}
                  >
                    <div className="min-w-0">
                      <p className="truncate text-xs font-black text-white">{file.name}</p>
                      <p className="mt-1 text-[11px] font-bold text-[#8b94a1]">
                        {file.mimeType} - {(file.sizeBytes / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <button
                      className="grid size-7 shrink-0 place-items-center rounded-[3px] text-[#aeb7c2] hover:bg-[#303842] hover:text-white"
                      onClick={() => handleRemoveFile(file.id)}
                      type="button"
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                ))
              ) : (
                <p className="px-4 py-5 text-xs font-bold text-[#aeb7c2]">
                  No uploaded files selected yet.
                </p>
              )}
            </div>
            <p className="mt-2 text-[11px] font-bold text-[#8b94a1]">
              {uploadedFiles.length} uploaded file{uploadedFiles.length === 1 ? '' : 's'} will be
              attached as metadata until backend upload storage is available.
            </p>
          </section>
        </div>

        <DialogFooter className="mx-0 mb-0 shrink-0 rounded-none border-[#39424f] bg-[#151c25] px-6 py-4">
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
            className="h-9 rounded-[4px] bg-[#FFD369] px-4 text-xs font-black text-[#222831] hover:bg-[#eac04f]"
            disabled={isSubmitting || !title.trim()}
            onClick={onCreate}
            type="button"
          >
            {isSubmitting ? 'Creating...' : 'Create Request'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
