'use client';

import { Archive, BookOpen, FileCheck2, FileText, FileUp, ImageIcon, Plus, X } from 'lucide-react';

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
import type { ProjectFolderResponse } from '@/services/project.service';

export type UploadedApplicationFile = {
  file: File;
  id: string;
  lastModified: number;
  mimeType: string;
  name: string;
  role?: 'image' | 'material' | 'source' | 'text';
  sizeBytes: number;
};

type CreateApplicationDialogProps = {
  description: string;
  isSubmitting: boolean;
  onCreate: () => void;
  onDescriptionChange: (value: string) => void;
  onFilesChange: (files: UploadedApplicationFile[]) => void;
  onOpenChange: (open: boolean) => void;
  onParentFolderIdChange: (value: string) => void;
  onTitleChange: (value: string) => void;
  onTypeChange: (value: ApplicationType) => void;
  open: boolean;
  parentFolderId: string;
  parentFolders: ProjectFolderResponse[];
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
  onParentFolderIdChange,
  onTitleChange,
  onTypeChange,
  open,
  parentFolderId,
  parentFolders,
  title,
  type,
  uploadedFiles,
}: CreateApplicationDialogProps) {
  const isFolderRequest = type === 'CREATE_ARC' || type === 'CREATE_CHAPTER';
  const imageFile = uploadedFiles.find((file) => file.role === 'image');
  const textFile = uploadedFiles.find((file) => file.role === 'text');
  const sourceFile = uploadedFiles.find((file) => file.role === 'source');
  const materialFiles = uploadedFiles.filter((file) => file.role === 'material' || !file.role);

  const upsertSlotFile = (
    role: NonNullable<UploadedApplicationFile['role']>,
    file: File | undefined,
  ) => {
    if (!file) {
      return;
    }

    const nextFile: UploadedApplicationFile = {
      file,
      id: `${role}-${file.name}-${file.size}-${file.lastModified}`,
      lastModified: file.lastModified,
      mimeType: file.type || 'application/octet-stream',
      name: file.name,
      role,
      sizeBytes: file.size,
    };

    onFilesChange([...uploadedFiles.filter((item) => item.role !== role), nextFile]);
  };

  const removeSlotFile = (role: NonNullable<UploadedApplicationFile['role']>) => {
    onFilesChange(uploadedFiles.filter((file) => file.role !== role));
  };

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files ?? []);

    if (!selectedFiles.length) {
      return;
    }

    const nextFiles = selectedFiles.map((file) => ({
      file,
      id: `${file.name}-${file.size}-${file.lastModified}`,
      lastModified: file.lastModified,
      mimeType: file.type || 'application/octet-stream',
      name: file.name,
      role: 'material' as const,
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
        className="!flex max-h-[86vh] w-[calc(100vw-2rem)] max-w-[calc(100vw-2rem)] flex-col gap-0 overflow-hidden rounded-[7px] border border-[#39424f] bg-[#101820] p-0 text-white sm:!max-w-[920px]"
        showCloseButton={false}
      >
        <DialogHeader className="shrink-0 border-b border-[#39424f] px-6 py-5">
          <p className="text-[10px] font-black uppercase tracking-[0.1em] text-[#FFD369]">
            Project Application
          </p>
          <DialogTitle className="mt-1 text-[24px] font-black text-white">
            New Application Request
          </DialogTitle>
          <DialogDescription className="max-w-2xl text-sm font-medium leading-6 text-[#aeb7c2]">
            Create a review, publishing, story arc, or chapter request with the files required by
            the selected workflow.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-6 py-5">
          <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
            <div className="space-y-5 border-[#303842] lg:border-r lg:pr-6">
              <label className="block">
                <span className="text-[10px] font-black uppercase tracking-[0.08em] text-[#dce7f3]">
                  Title <span className="text-red-300">*</span>
                </span>
                <input
                  className="mt-2 h-11 w-full rounded-[4px] border border-[#39424f] bg-[#151c25] px-3 text-sm font-bold text-white outline-none placeholder:text-[#8b94a1] focus:border-[#FFD369]"
                  onChange={(event) => onTitleChange(event.target.value)}
                  placeholder="Chapter 12 manuscript review"
                  value={title}
                />
              </label>

              <label className="block">
                <span className="text-[10px] font-black uppercase tracking-[0.08em] text-[#dce7f3]">
                  Request Type <span className="text-red-300">*</span>
                </span>
                <select
                  className="mt-2 h-11 w-full rounded-[4px] border border-[#39424f] bg-[#151c25] px-3 text-sm font-bold text-white outline-none focus:border-[#FFD369]"
                  onChange={(event) => {
                    const nextType = event.target.value as ApplicationType;
                    onTypeChange(nextType);
                    if (nextType !== 'CREATE_CHAPTER') {
                      onParentFolderIdChange('');
                    }
                    onFilesChange([]);
                  }}
                  value={type}
                >
                  <option value="CREATE_ARC">Create Story Arc</option>
                  <option value="CREATE_CHAPTER">Create Chapter</option>
                  <option value="MANUSCRIPT_REVIEW">Manuscript Review</option>
                  <option value="PUBLISH_REQUEST">Publish Request</option>
                </select>
              </label>

              {type === 'CREATE_CHAPTER' ? (
                <label className="block">
                  <span className="text-[10px] font-black uppercase tracking-[0.08em] text-[#dce7f3]">
                    Parent Story Arc <span className="text-red-300">*</span>
                  </span>
                  <select
                    className="mt-2 h-11 w-full rounded-[4px] border border-[#39424f] bg-[#151c25] px-3 text-sm font-bold text-white outline-none focus:border-[#FFD369]"
                    onChange={(event) => onParentFolderIdChange(event.target.value)}
                    value={parentFolderId}
                  >
                    <option value="">Select parent arc...</option>
                    {parentFolders.map((folder) => (
                      <option key={folder.id} value={String(folder.id)}>
                        {folder.title}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}

              <label className="block">
                <span className="text-[10px] font-black uppercase tracking-[0.08em] text-[#dce7f3]">
                  Description
                </span>
                <textarea
                  className="mt-2 h-32 w-full resize-none rounded-[4px] border border-[#39424f] bg-[#151c25] px-3 py-3 text-sm font-bold leading-6 text-white outline-none placeholder:text-[#8b94a1] focus:border-[#FFD369]"
                  onChange={(event) => onDescriptionChange(event.target.value)}
                  placeholder="Context, review notes, or publishing instructions..."
                  value={description}
                />
                <p className="mt-2 text-[11px] font-bold text-[#8b94a1]">
                  Keep this short and action-oriented so reviewers know what to approve.
                </p>
              </label>
            </div>

            <section className="space-y-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-[0.08em] text-[#dce7f3]">
                  Request Files
                </span>
                <p className="mt-2 text-xs font-bold leading-5 text-[#8b94a1]">
                  {isFolderRequest
                    ? 'Story arc and chapter requests need one cover image and one manuscript/text file.'
                    : 'Review and publish requests keep file metadata with the request.'}
                </p>
              </div>

              {isFolderRequest ? (
                <div className="space-y-3">
                  <ApplicationFileSlot
                    accept="image/*"
                    file={imageFile}
                    icon={<ImageIcon className="size-5" />}
                    label="Cover image"
                    required
                    onRemove={() => removeSlotFile('image')}
                    onSelect={(file) => upsertSlotFile('image', file)}
                  />
                  <ApplicationFileSlot
                    accept=".txt,.md,.pdf,.doc,.docx,application/pdf,text/*"
                    file={textFile}
                    icon={<FileText className="size-5" />}
                    label="Text / manuscript"
                    required
                    onRemove={() => removeSlotFile('text')}
                    onSelect={(file) => upsertSlotFile('text', file)}
                  />
                  <ApplicationFileSlot
                    accept="*"
                    file={sourceFile}
                    icon={<Archive className="size-5" />}
                    label="Source file"
                    onRemove={() => removeSlotFile('source')}
                    onSelect={(file) => upsertSlotFile('source', file)}
                  />
                </div>
              ) : (
                <div>
                  <label
                    className="flex min-h-28 cursor-pointer flex-col items-center justify-center gap-3 rounded-[4px] border border-dashed border-[#4b535f] bg-[#151c25] px-4 py-5 text-center hover:border-[#FFD369]/70 hover:bg-[#17202b]"
                    htmlFor="application_upload_files"
                  >
                    {type === 'PUBLISH_REQUEST' ? (
                      <FileCheck2 className="size-7 text-[#FFD369]" />
                    ) : (
                      <BookOpen className="size-7 text-[#FFD369]" />
                    )}
                    <span className="text-sm font-black text-white">Attach supporting files</span>
                    <span className="text-xs font-bold text-[#8b94a1]">
                      Local file details will be stored with this request
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
                    {materialFiles.length ? (
                      materialFiles.map((file) => (
                        <ApplicationFileRow
                          file={file}
                          key={file.id}
                          onRemove={() => handleRemoveFile(file.id)}
                        />
                      ))
                    ) : (
                      <p className="px-4 py-5 text-xs font-bold text-[#aeb7c2]">
                        No supporting files selected.
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="rounded-[4px] border border-[#303842] bg-[#0d151e] px-4 py-3">
                <p className="text-xs font-black text-white">
                  {type === 'CREATE_ARC'
                    ? 'Creates a story arc request'
                    : type === 'CREATE_CHAPTER'
                      ? 'Creates a chapter request under the selected story arc'
                      : type === 'PUBLISH_REQUEST'
                        ? 'Submits a publishing approval request'
                        : 'Submits a manuscript review request'}
                </p>
                <p className="mt-1 text-[11px] font-bold leading-5 text-[#8b94a1]">
                  Status starts as pending and reviewers can approve, reject, or request updates.
                </p>
              </div>
            </section>
          </div>
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

function formatFileSize(sizeBytes: number) {
  return `${(sizeBytes / 1024 / 1024).toFixed(2)} MB`;
}

function ApplicationFileRow({
  file,
  onRemove,
}: {
  file: UploadedApplicationFile;
  onRemove: () => void;
}) {
  return (
    <div className="flex min-h-12 items-center justify-between gap-3 border-b border-[#303842] px-4 py-3 last:border-b-0">
      <div className="min-w-0">
        <p className="truncate text-xs font-black text-white">{file.name}</p>
        <p className="mt-1 text-[11px] font-bold text-[#8b94a1]">
          {file.mimeType} - {formatFileSize(file.sizeBytes)}
        </p>
      </div>
      <button
        className="grid size-7 shrink-0 place-items-center rounded-[3px] text-[#aeb7c2] hover:bg-[#303842] hover:text-white"
        onClick={onRemove}
        type="button"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}

function ApplicationFileSlot({
  accept,
  file,
  icon,
  label,
  onRemove,
  onSelect,
  required = false,
}: {
  accept?: string;
  file?: UploadedApplicationFile;
  icon: React.ReactNode;
  label: string;
  onRemove: () => void;
  onSelect: (file: File | undefined) => void;
  required?: boolean;
}) {
  const inputId = `application_${label.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`;

  return (
    <div className="rounded-[4px] border border-[#39424f] bg-[#151c25] p-3">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-black text-white">
          <span className="grid size-8 place-items-center rounded-[4px] border border-[#4b535f] bg-[#101820] text-[#FFD369]">
            {icon}
          </span>
          {label}
          {required ? <span className="text-red-300">*</span> : null}
        </div>
        <label
          className="inline-flex h-8 cursor-pointer items-center rounded-[4px] border border-[#4b535f] bg-[#101820] px-3 text-[10px] font-black text-white hover:bg-[#303842]"
          htmlFor={inputId}
        >
          {file ? 'Replace' : 'Choose'}
        </label>
        <input
          accept={accept}
          className="hidden"
          id={inputId}
          onChange={(event) => {
            onSelect(event.target.files?.[0]);
            event.target.value = '';
          }}
          type="file"
        />
      </div>
      {file ? (
        <div className="flex items-center justify-between gap-3 rounded-[4px] border border-[#303842] bg-[#0d151e] px-3 py-2">
          <div className="min-w-0">
            <p className="truncate text-xs font-black text-white">{file.name}</p>
            <p className="mt-1 text-[11px] font-bold text-[#8b94a1]">
              {file.mimeType} - {formatFileSize(file.sizeBytes)}
            </p>
          </div>
          <button
            className="grid size-7 shrink-0 place-items-center rounded-[3px] text-[#aeb7c2] hover:bg-[#303842] hover:text-white"
            onClick={onRemove}
            type="button"
          >
            <X className="size-4" />
          </button>
        </div>
      ) : (
        <p className="rounded-[4px] border border-dashed border-[#303842] bg-[#0d151e] px-3 py-3 text-[11px] font-bold text-[#8b94a1]">
          No file selected.
        </p>
      )}
    </div>
  );
}
