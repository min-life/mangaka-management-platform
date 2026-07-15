'use client';

import { useEffect, useMemo, useState } from 'react';
import { FolderOpen, Plus, Search, Trash2, UploadCloud, FileText, ImageIcon, FileCode2, X } from 'lucide-react';

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
import type { ProjectFolderResponse } from '@/services/project.service';

const labelClassName = 'text-[10px] font-black uppercase tracking-[0.08em] text-[#dce7f3]';
const fieldClassName =
  'mt-2 h-11 w-full rounded-[4px] border border-[#39424f] bg-[#151c25] px-3 text-sm font-bold text-white outline-none placeholder:text-[#8b94a1] focus:border-[#FFD369]';

export type CreateProductionFilePayload = {
  description?: string;
  folderId: number;
  imageFile?: File;
  sourceFile?: File;
  textFile?: File;
  title: string;
};

type CreateProductionItemDialogProps = {
  folders: ProjectFolderResponse[];
  isSubmitting: boolean;
  onCreateFile: (payload: CreateProductionFilePayload) => Promise<void>;
  selectedFolderId?: number | string | null;
};

type FileSlot = {
  file?: File;
  previewUrl?: string;
};

function getFolderPath(folder: ProjectFolderResponse, folders: ProjectFolderResponse[]) {
  const parents: string[] = [];
  let currentParentId = folder.parentId ?? folder.parent?.id ?? null;

  while (currentParentId) {
    const parent = folders.find((candidate) => candidate.id === currentParentId);
    if (!parent) break;
    parents.unshift(parent.title);
    currentParentId = parent.parentId ?? parent.parent?.id ?? null;
  }

  return parents.length ? `${parents.join(' / ')} / ${folder.title}` : folder.title;
}

function FileUploadSlot({
  accept,
  description,
  disabled,
  icon,
  inputId,
  label,
  slot,
  onChange,
  onClear,
}: {
  accept: string;
  description: string;
  disabled: boolean;
  icon: React.ReactNode;
  inputId: string;
  label: string;
  slot: FileSlot;
  onChange: (file: File) => void;
  onClear: () => void;
}) {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const picked = event.target.files?.[0];
    if (picked) onChange(picked);
    event.target.value = '';
  };

  return (
    <div className="rounded-[4px] border border-[#39424f] bg-[#151c25] p-3">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-black text-white">
          <span className="grid size-8 place-items-center rounded-[4px] border border-[#4b535f] bg-[#101820] text-[#FFD369]">
            {icon}
          </span>
          <div>
            <p>{label}</p>
            <p className="mt-0.5 text-[9px] font-bold tracking-[0.05em] text-[#8b94a1]">{description}</p>
          </div>
        </div>
        <label
          className={`inline-flex h-8 items-center rounded-[4px] border border-[#4b535f] bg-[#101820] px-3 text-[10px] font-black text-white transition-colors ${
            disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:bg-[#303842]'
          }`}
          htmlFor={disabled ? undefined : inputId}
        >
          {slot.file ? 'Replace' : 'Choose'}
        </label>
        <input accept={accept} className="hidden" disabled={disabled} id={inputId} onChange={handleChange} type="file" />
      </div>
      
      {slot.file ? (
        <div className="flex items-center justify-between gap-3 rounded-[4px] border border-[#303842] bg-[#0d151e] px-3 py-2">
          <div className="flex items-center gap-3 min-w-0">
            {slot.previewUrl ? (
              <img alt="" className="size-8 shrink-0 rounded-[3px] object-cover" src={slot.previewUrl} />
            ) : null}
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-black text-white">{slot.file.name}</p>
              <p className="mt-1 text-[11px] font-bold text-[#8b94a1]">
                {slot.file.type || 'Unknown type'} - {(slot.file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          </div>
          <button
            className="grid size-7 shrink-0 place-items-center rounded-[3px] text-[#aeb7c2] hover:bg-[#303842] hover:text-white"
            onClick={(e) => { e.preventDefault(); onClear(); }}
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

const emptySlot = (): FileSlot => ({ file: undefined, previewUrl: '' });

export function CreateProductionItemDialog({
  folders,
  isSubmitting,
  onCreateFile,
  selectedFolderId,
}: CreateProductionItemDialogProps) {
  const [open, setOpen] = useState(false);
  const [fileTitle, setFileTitle] = useState('');
  const [fileDescription, setFileDescription] = useState('');
  const [fileFolderId, setFileFolderId] = useState(selectedFolderId ? String(selectedFolderId) : '');
  const [folderSearch, setFolderSearch] = useState('');

  // 3 file slots matching API fields: image, text, source
  const [imageSlot, setImageSlot] = useState<FileSlot>(emptySlot());
  const [textSlot, setTextSlot] = useState<FileSlot>(emptySlot());
  const [sourceSlot, setSourceSlot] = useState<FileSlot>(emptySlot());

  useEffect(() => {
    if (!open) return;
    setFileFolderId(selectedFolderId ? String(selectedFolderId) : '');
  }, [open, selectedFolderId]);

  const filteredFolders = useMemo(() => {
    const query = folderSearch.trim().toLowerCase();
    return folders.filter((folder) => {
      if (!query) return true;
      return getFolderPath(folder, folders).toLowerCase().includes(query);
    });
  }, [folderSearch, folders]);

  const reset = () => {
    setFileTitle('');
    setFileDescription('');
    setFileFolderId(selectedFolderId ? String(selectedFolderId) : '');
    setFolderSearch('');
    setImageSlot(emptySlot());
    setTextSlot(emptySlot());
    setSourceSlot(emptySlot());
  };

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) reset();
  };

  const makeSlotSetter = (
    setter: React.Dispatch<React.SetStateAction<FileSlot>>,
    isImage: boolean,
  ) => (file: File) => {
    const previewUrl = isImage && file.type.startsWith('image/') ? URL.createObjectURL(file) : '';
    setter({ file, previewUrl });
    // Auto-fill title from first uploaded file if title is still empty
    setFileTitle((current) => current || file.name.replace(/\.[^/.]+$/, ''));
  };

  const handleCreate = async () => {
    await onCreateFile({
      description: fileDescription.trim() || undefined,
      folderId: Number(fileFolderId),
      imageFile: imageSlot.file,
      textFile: textSlot.file,
      sourceFile: sourceSlot.file,
      title: fileTitle.trim(),
    });
    setOpen(false);
    reset();
  };

  const canSubmit = Boolean(fileTitle.trim() && fileFolderId) && !isSubmitting;

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      <DialogTrigger asChild>
        <Button className="h-9 rounded-[4px] bg-[#FFD369] px-4 text-xs font-black text-[#222831] hover:bg-[#eac04f]">
          <Plus className="size-4" />
          New Resources
        </Button>
      </DialogTrigger>
      <DialogContent
        className="w-[calc(100vw-2rem)] max-h-[88dvh] max-w-[860px] gap-0 overflow-hidden rounded-[7px] border border-[#39424f] bg-[#101820] p-0 text-white sm:max-w-[860px]"
        showCloseButton
      >
        <DialogHeader className="border-b border-[#39424f] px-6 py-5">
          <p className="text-xs font-black uppercase tracking-[0.08em] text-[#FFD369]">
            Production File
          </p>
          <DialogTitle className="text-xl font-black text-white">Create File</DialogTitle>
          <DialogDescription className="text-sm font-medium text-[#aeb7c2]">
            Create a file record inside an existing story arc or chapter folder. Folder creation is handled through Application requests.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 overflow-y-auto px-6 py-5">
          <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_320px]">
            {/* Left: metadata */}
            <div className="space-y-4">
              <label className="block">
                <span className={labelClassName}>File Name</span>
                <input
                  className={fieldClassName}
                  onChange={(event) => setFileTitle(event.target.value)}
                  placeholder="Chapter 01 Storyboard"
                  value={fileTitle}
                />
              </label>

              <div>
                <span className={labelClassName}>Target Folder</span>
                <div className="mt-2 rounded-[5px] border border-[#39424f] bg-[#151c25]">
                  <div className="flex h-10 items-center gap-2 border-b border-[#26303b] px-3">
                    <Search className="size-4 shrink-0 text-[#8b94a1]" />
                    <input
                      className="min-w-0 flex-1 bg-transparent text-xs font-bold text-white outline-none placeholder:text-[#8b94a1]"
                      onChange={(event) => setFolderSearch(event.target.value)}
                      placeholder="Search arcs or chapters..."
                      value={folderSearch}
                    />
                  </div>
                  <div className="max-h-44 overflow-y-auto p-1">
                    {filteredFolders.length ? (
                      filteredFolders.map((folder) => {
                        const isSelected = String(folder.id) === fileFolderId;
                        return (
                          <button
                            className={`flex w-full items-center gap-3 rounded-[4px] px-3 py-2.5 text-left ${
                              isSelected ? 'bg-[#2a2414] text-[#FFD369]' : 'text-white hover:bg-[#202832]'
                            }`}
                            key={folder.id}
                            onClick={() => setFileFolderId(String(folder.id))}
                            type="button"
                          >
                            <FolderOpen className="size-4 shrink-0" />
                            <span className="min-w-0">
                              <span className="block truncate text-xs font-black">{folder.title}</span>
                              <span className="block truncate text-[11px] font-bold text-[#8b94a1]">
                                {getFolderPath(folder, folders)}
                              </span>
                            </span>
                          </button>
                        );
                      })
                    ) : (
                      <p className="px-3 py-4 text-center text-xs font-bold text-[#8b94a1]">
                        No folders found. Create folders through Applications first.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <label className="block">
                <span className={labelClassName}>Description</span>
                <textarea
                  className="mt-2 h-24 w-full resize-none rounded-[4px] border border-[#39424f] bg-[#151c25] px-3 py-3 text-sm font-bold text-white outline-none placeholder:text-[#8b94a1] focus:border-[#FFD369]"
                  onChange={(event) => setFileDescription(event.target.value)}
                  placeholder="Describe this production record"
                  value={fileDescription}
                />
              </label>
            </div>

            {/* Right: 3 file upload slots matching API fields */}
            <div className="space-y-4">
              <div>
                <span className={labelClassName}>Initial Material</span>
                <p className="mt-1 text-[11px] font-bold leading-5 text-[#8b94a1]">
                  Optional. Upload up to 3 file types — they become the first material version.
                </p>
              </div>

              <FileUploadSlot
                accept="image/*,.pdf"
                description="PNG, JPG, GIF, PDF"
                disabled={isSubmitting}
                icon={<ImageIcon className="size-5" />}
                inputId="upload_image"
                label="Image"
                slot={imageSlot}
                onChange={makeSlotSetter(setImageSlot, true)}
                onClear={() => setImageSlot(emptySlot())}
              />

              <FileUploadSlot
                accept=".txt,.doc,.docx,text/*"
                description="TXT, DOC, DOCX"
                disabled={isSubmitting}
                icon={<FileText className="size-5" />}
                inputId="upload_text"
                label="Text / Document"
                slot={textSlot}
                onChange={makeSlotSetter(setTextSlot, false)}
                onClear={() => setTextSlot(emptySlot())}
              />

              <FileUploadSlot
                accept=".psd,.clip,.zip,.ai,.csp"
                description="PSD, CLIP, ZIP, AI, CSP"
                disabled={isSubmitting}
                icon={<FileCode2 className="size-5" />}
                inputId="upload_source"
                label="Source File"
                slot={sourceSlot}
                onChange={makeSlotSetter(setSourceSlot, false)}
                onClear={() => setSourceSlot(emptySlot())}
              />
            </div>
          </div>
        </div>

        <DialogFooter className="mx-0 mb-0 shrink-0 rounded-none border-[#39424f] bg-[#151c25] px-6 py-4">
          <DialogClose asChild>
            <Button
              className="h-9 rounded-[4px] border-[#4b535f] bg-[#101820] px-5 text-xs font-black text-white hover:bg-[#303842]"
              disabled={isSubmitting}
              variant="outline"
            >
              Cancel
            </Button>
          </DialogClose>
          <Button
            className="h-9 rounded-[4px] bg-[#FFD369] px-5 text-xs font-black text-[#222831] hover:bg-[#eac04f]"
            disabled={!canSubmit}
            onClick={() => void handleCreate()}
          >
            {isSubmitting ? 'Creating...' : 'Create File'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
