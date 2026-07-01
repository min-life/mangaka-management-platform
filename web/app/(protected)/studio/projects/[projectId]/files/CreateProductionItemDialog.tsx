'use client';

import { useMemo, useState } from 'react';
import { FileText, ImageIcon, Plus, Trash2, UploadCloud } from 'lucide-react';

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

type CreateMode = 'folder' | 'file';

type CreateProductionItemDialogProps = {
  folders: ProjectFolderResponse[];
  isSubmitting: boolean;
  onCreateFile: (input: {
    description?: string;
    folderId: number;
    previewUrl?: string;
    title: string;
  }) => void;
  onCreateFolder: (input: {
    coverPreviewUrl?: string;
    description?: string;
    parentId?: number;
    title: string;
  }) => Promise<void>;
  selectedFolderId: number | null;
};

const fieldClassName =
  'mt-2 h-10 w-full rounded-[4px] border border-[#39424f] bg-[#151c25] px-3 text-sm font-bold text-white outline-none placeholder:text-[#8b94a1] focus:border-[#FFD369]';

const labelClassName =
  'text-[10px] font-black uppercase tracking-[0.08em] text-[#dce7f3]';

export function CreateProductionItemDialog({
  folders,
  isSubmitting,
  onCreateFile,
  onCreateFolder,
  selectedFolderId,
}: CreateProductionItemDialogProps) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<CreateMode>('folder');
  const [folderTitle, setFolderTitle] = useState('');
  const [folderDescription, setFolderDescription] = useState('');
  const [folderParentId, setFolderParentId] = useState(
    selectedFolderId ? String(selectedFolderId) : 'root',
  );
  const [folderCoverUrl, setFolderCoverUrl] = useState('');
  const [folderCoverName, setFolderCoverName] = useState('');
  const [fileTitle, setFileTitle] = useState('');
  const [fileDescription, setFileDescription] = useState('');
  const [fileFolderId, setFileFolderId] = useState(selectedFolderId ? String(selectedFolderId) : '');
  const [filePreviewUrl, setFilePreviewUrl] = useState('');
  const [fileUploadName, setFileUploadName] = useState('');
  const [fileUploadMeta, setFileUploadMeta] = useState('');
  const selectedFolderName = useMemo(
    () => folders.find((folder) => String(folder.id) === fileFolderId)?.title,
    [fileFolderId, folders],
  );

  const reset = () => {
    setFolderTitle('');
    setFolderDescription('');
    setFolderParentId(selectedFolderId ? String(selectedFolderId) : 'root');
    setFolderCoverUrl('');
    setFolderCoverName('');
    setFileTitle('');
    setFileDescription('');
    setFileFolderId(selectedFolderId ? String(selectedFolderId) : '');
    setFilePreviewUrl('');
    setFileUploadName('');
    setFileUploadMeta('');
  };

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);

    if (!nextOpen) {
      reset();
    }
  };

  const handleFolderCoverChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const { dataUrl, name } = await readUploadFile(file);
    if (dataUrl) {
      setFolderCoverUrl(dataUrl ?? '');
    }
    setFolderCoverName(name);
    event.target.value = '';
  };

  const handleFileUploadChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const { dataUrl, meta, name } = await readUploadFile(file);
    setFilePreviewUrl(dataUrl ?? '');
    setFileUploadName(name);
    setFileUploadMeta(meta);
    setFileTitle((current) => current || name.replace(/\.[^/.]+$/, ''));
    event.target.value = '';
  };

  const handleCreate = async () => {
    if (mode === 'folder') {
      await onCreateFolder({
        coverPreviewUrl: folderCoverUrl || undefined,
        description: folderDescription.trim() || undefined,
        parentId: folderParentId === 'root' ? undefined : Number(folderParentId),
        title: folderTitle.trim(),
      });
    } else {
      onCreateFile({
        description: fileDescription.trim() || undefined,
        folderId: Number(fileFolderId),
        previewUrl: filePreviewUrl || undefined,
        title: fileTitle.trim(),
      });
    }

    setOpen(false);
    reset();
  };

  const canSubmit =
    mode === 'folder'
      ? Boolean(folderTitle.trim()) && !isSubmitting
      : Boolean(fileTitle.trim() && fileFolderId) && !isSubmitting;

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      <DialogTrigger asChild>
        <Button className="h-9 rounded-[4px] bg-[#FFD369] px-4 text-xs font-black text-[#222831] hover:bg-[#eac04f]">
          <Plus className="size-4" />
          New
        </Button>
      </DialogTrigger>
      <DialogContent
        className="w-[calc(100vw-2rem)] max-h-[88dvh] max-w-[760px] gap-0 overflow-hidden rounded-[7px] border border-[#39424f] bg-[#101820] p-0 text-white sm:max-w-[760px]"
        showCloseButton
      >
        <DialogHeader className="border-b border-[#39424f] px-6 py-5">
          <DialogTitle className="text-xl font-black text-white">Create Production Item</DialogTitle>
          <DialogDescription className="text-sm font-medium text-[#aeb7c2]">
            Create a folder or a file record. Folder covers use one 2:3 image for cards and hero
            previews in UI fallback mode.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 overflow-y-auto px-6 py-5">
          <div className="mb-5 grid grid-cols-2 overflow-hidden rounded-[5px] border border-[#39424f] bg-[#151c25] p-1">
            {(['folder', 'file'] as const).map((itemMode) => (
              <button
                className={`h-9 rounded-[4px] text-xs font-black ${
                  mode === itemMode
                    ? 'bg-[#FFD369] text-[#222831]'
                    : 'text-[#aeb7c2] hover:bg-[#202a35] hover:text-white'
                }`}
                key={itemMode}
                onClick={() => setMode(itemMode)}
                type="button"
              >
                {itemMode === 'folder' ? 'Folder' : 'File'}
              </button>
            ))}
          </div>

          {mode === 'folder' ? (
            <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_220px]">
              <div className="space-y-4">
                <label className="block">
                  <span className={labelClassName}>Folder Name</span>
                  <input
                    className={fieldClassName}
                    onChange={(event) => setFolderTitle(event.target.value)}
                    placeholder="Chapter 01"
                    value={folderTitle}
                  />
                </label>
                <label className="block">
                  <span className={labelClassName}>Parent Folder</span>
                  <select
                    className={fieldClassName}
                    onChange={(event) => setFolderParentId(event.target.value)}
                    value={folderParentId}
                  >
                    <option value="root">Project root</option>
                    {folders.map((folder) => (
                      <option key={folder.id} value={folder.id}>
                        {folder.title}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className={labelClassName}>Description</span>
                  <textarea
                    className="mt-2 h-24 w-full resize-none rounded-[4px] border border-[#39424f] bg-[#151c25] px-3 py-3 text-sm font-bold text-white outline-none placeholder:text-[#8b94a1] focus:border-[#FFD369]"
                    onChange={(event) => setFolderDescription(event.target.value)}
                    placeholder="Optional folder description"
                    value={folderDescription}
                  />
                </label>
              </div>

              <div>
                <span className={labelClassName}>Folder Cover</span>
                <p className="mt-1 text-[11px] font-bold text-[#8b94a1]">
                  One 2:3 cover. Arc heroes crop this same image automatically.
                </p>
                <label
                  className="mt-2 grid aspect-[2/3] cursor-pointer place-items-center overflow-hidden rounded-[5px] border border-dashed border-[#4b535f] bg-[#151c25] text-center hover:border-[#FFD369]/70"
                  htmlFor="folder_cover_upload"
                >
                  {folderCoverUrl ? (
                    <img alt="" className="h-full w-full object-cover" src={folderCoverUrl} />
                  ) : (
                    <span className="px-4">
                      <ImageIcon className="mx-auto size-8 text-[#8b94a1]" />
                      <span className="mt-3 block text-xs font-black text-white">
                        Upload cover
                      </span>
                      <span className="mt-1 block text-[11px] font-bold text-[#8b94a1]">
                        2:3 cover preview *
                      </span>
                    </span>
                  )}
                  <input
                    accept="image/*"
                    className="hidden"
                    id="folder_cover_upload"
                    onChange={handleFolderCoverChange}
                    type="file"
                  />
                </label>
                {folderCoverName ? (
                  <button
                    className="mt-2 flex w-full items-center justify-between rounded-[4px] border border-[#39424f] bg-[#151c25] px-3 py-2 text-left text-[11px] font-bold text-[#aeb7c2]"
                    onClick={() => {
                      setFolderCoverName('');
                      setFolderCoverUrl('');
                    }}
                    type="button"
                  >
                    <span className="truncate">{folderCoverName}</span>
                    <Trash2 className="size-3.5 text-red-300" />
                  </button>
                ) : null}
              </div>
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_240px]">
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
                <label className="block">
                  <span className={labelClassName}>Folder</span>
                  <select
                    className={fieldClassName}
                    onChange={(event) => setFileFolderId(event.target.value)}
                    value={fileFolderId}
                  >
                    <option value="">Select folder</option>
                    {folders.map((folder) => (
                      <option key={folder.id} value={folder.id}>
                        {folder.title}
                      </option>
                    ))}
                  </select>
                </label>
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
                <span className={labelClassName}>Upload File</span>
                <label
                  className="mt-2 grid min-h-[190px] cursor-pointer place-items-center overflow-hidden rounded-[5px] border border-dashed border-[#4b535f] bg-[#151c25] text-center hover:border-[#FFD369]/70"
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
                        Material upload happens after the file is created
                      </span>
                    </span>
                  )}
                  <input
                    accept="image/*,.psd,.clip,.pdf"
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
                      {selectedFolderName ? ` - ${selectedFolderName}` : ''}
                    </p>
                  </div>
                ) : null}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="mx-0 mb-0 rounded-none border-[#39424f] bg-[#151c25] px-6 py-4">
          <DialogClose asChild>
            <Button
              className="h-9 rounded-[4px] border-[#4b535f] bg-[#101820] px-5 text-xs font-black text-white hover:bg-[#303842]"
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
            {isSubmitting ? 'Creating...' : mode === 'folder' ? 'Create Folder' : 'Create File'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
