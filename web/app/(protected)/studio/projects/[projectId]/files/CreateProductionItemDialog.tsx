'use client';

import { useEffect, useMemo, useState } from 'react';
import { FileText, FolderOpen, Plus, Search, Trash2, UploadCloud } from 'lucide-react';

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
import { readUploadFile } from '@/lib/image-upload';
import type { ProjectFolderResponse } from '@/services/project.service';

type CreateProductionItemDialogProps = {
  folders: ProjectFolderResponse[];
  isSubmitting: boolean;
  onCreateFile: (input: {
    assetFile?: File;
    description?: string;
    folderId: number;
    previewUrl?: string;
    title: string;
  }) => Promise<void>;
  selectedFolderId: number | null;
};

const fieldClassName =
  'mt-2 h-10 w-full rounded-[4px] border border-[#39424f] bg-[#151c25] px-3 text-sm font-bold text-white outline-none placeholder:text-[#8b94a1] focus:border-[#FFD369]';

const labelClassName =
  'text-[10px] font-black uppercase tracking-[0.08em] text-[#dce7f3]';

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
  const [filePreviewUrl, setFilePreviewUrl] = useState('');
  const [fileUploadName, setFileUploadName] = useState('');
  const [fileUploadMeta, setFileUploadMeta] = useState('');
  const [assetFile, setAssetFile] = useState<File | undefined>();
  const [folderSearch, setFolderSearch] = useState('');

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

  const selectedFolder = useMemo(
    () => folders.find((folder) => String(folder.id) === fileFolderId),
    [fileFolderId, folders],
  );

  const reset = () => {
    setFileTitle('');
    setFileDescription('');
    setFileFolderId(selectedFolderId ? String(selectedFolderId) : '');
    setFilePreviewUrl('');
    setFileUploadName('');
    setFileUploadMeta('');
    setAssetFile(undefined);
    setFolderSearch('');
  };

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);

    if (!nextOpen) {
      reset();
    }
  };

  const handleFileUploadChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const { dataUrl, meta, name } = await readUploadFile(file);
    setAssetFile(file);
    setFilePreviewUrl(dataUrl ?? '');
    setFileUploadName(name);
    setFileUploadMeta(meta);
    setFileTitle((current) => current || name.replace(/\.[^/.]+$/, ''));
    event.target.value = '';
  };

  const handleCreate = async () => {
    await onCreateFile({
      assetFile,
      description: fileDescription.trim() || undefined,
      folderId: Number(fileFolderId),
      previewUrl: filePreviewUrl || undefined,
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
          New File
        </Button>
      </DialogTrigger>
      <DialogContent
        className="w-[calc(100vw-2rem)] max-h-[86dvh] max-w-[820px] gap-0 overflow-hidden rounded-[7px] border border-[#39424f] bg-[#101820] p-0 text-white sm:max-w-[820px]"
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
          <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_250px]">
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
                              isSelected
                                ? 'bg-[#2a2414] text-[#FFD369]'
                                : 'text-white hover:bg-[#202832]'
                            }`}
                            key={folder.id}
                            onClick={() => setFileFolderId(String(folder.id))}
                            type="button"
                          >
                            <FolderOpen className="size-4 shrink-0" />
                            <span className="min-w-0">
                              <span className="block truncate text-xs font-black">
                                {folder.title}
                              </span>
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

            <div>
              <span className={labelClassName}>Initial Material</span>
              <p className="mt-1 text-[11px] font-bold leading-5 text-[#8b94a1]">
                Optional. If attached, it becomes the first file material/version.
              </p>
              <label
                className="mt-2 grid min-h-[208px] cursor-pointer place-items-center overflow-hidden rounded-[5px] border border-dashed border-[#4b535f] bg-[#151c25] text-center hover:border-[#FFD369]/70"
                htmlFor="file_asset_upload"
              >
                {filePreviewUrl ? (
                  <img alt="" className="h-full w-full object-cover" src={filePreviewUrl} />
                ) : (
                  <span className="px-4">
                    <UploadCloud className="mx-auto size-8 text-[#8b94a1]" />
                    <span className="mt-3 block text-xs font-black text-white">
                      Upload from computer
                    </span>
                    <span className="mt-1 block text-[11px] font-bold text-[#8b94a1]">
                      PNG, JPG, PDF, PSD, CLIP, or text
                    </span>
                  </span>
                )}
                <input
                  accept="image/*,.psd,.clip,.pdf,.txt,.doc,.docx"
                  className="hidden"
                  id="file_asset_upload"
                  onChange={handleFileUploadChange}
                  type="file"
                />
              </label>
              {fileUploadName ? (
                <div className="mt-2 rounded-[4px] border border-[#39424f] bg-[#151c25] px-3 py-2">
                  <div className="flex items-center gap-2">
                    <FileText className="size-4 shrink-0 text-[#FFD369]" />
                    <p className="min-w-0 flex-1 truncate text-[11px] font-black text-white">
                      {fileUploadName}
                    </p>
                    <button
                      className="text-red-300 hover:text-red-200"
                      onClick={() => {
                        setAssetFile(undefined);
                        setFilePreviewUrl('');
                        setFileUploadMeta('');
                        setFileUploadName('');
                      }}
                      type="button"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                  <p className="mt-1 text-[11px] font-bold text-[#8b94a1]">
                    {fileUploadMeta}
                    {selectedFolder ? ` - ${selectedFolder.title}` : ''}
                  </p>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <DialogFooter className="mx-0 mb-0 rounded-none border-[#39424f] bg-[#151c25] px-6 py-4">
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
