'use client';

import { useState } from 'react';
import { AxiosError } from 'axios';
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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { compressImageFile } from '@/lib/image-upload';
import {
  createEditorBoard,
  type EditorBoardResponse,
} from '@/services/editor-board.service';

const fieldClassName =
  'h-11 rounded-[5px] border-[#303842] bg-[#101820] px-4 text-sm font-bold text-white placeholder:text-[#8b94a1] focus-visible:border-[#FFD369] focus-visible:ring-[#FFD369]/20';

const labelClassName =
  'text-[10px] font-black uppercase tracking-[0.08em] text-[#dce7f3]';

function getErrorMessage(error: unknown) {
  if (error instanceof AxiosError) {
    const message = error.response?.data?.message;
    return typeof message === 'string' ? message : 'Create board failed.';
  }

  return 'Create board failed.';
}

type CreateBoardDialogProps = {
  onCreated?: (board: EditorBoardResponse) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
};

export function CreateBoardDialog({ onCreated, open: controlledOpen, onOpenChange: controlledOnOpenChange, trigger }: CreateBoardDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = controlledOnOpenChange !== undefined ? controlledOnOpenChange : setInternalOpen;
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [boardImage, setBoardImage] = useState('');
  const [boardImageName, setBoardImageName] = useState('');
  const [boardImageSize, setBoardImageSize] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const canSubmit = name.trim().length > 0 && !isSubmitting;

  const resetForm = () => {
    setName('');
    setDescription('');
    setBoardImage('');
    setBoardImageName('');
    setBoardImageSize(null);
    setError(null);
    setSuccessMessage(null);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);

    if (!nextOpen) {
      resetForm();
    }
  };

  const handleBoardImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file.');
      return;
    }

    try {
      const compressedImage = await compressImageFile(file, {
        maxHeight: 640,
        maxInlineImageLength: 70_000,
        maxWidth: 640,
        qualities: [0.76, 0.64, 0.52, 0.42, 0.32],
      });
      setBoardImage(compressedImage);
      setBoardImageName(file.name);
      setBoardImageSize(file.size);
      setError(null);
    } catch (imageError) {
      setBoardImage('');
      setBoardImageName('');
      setBoardImageSize(null);
      setError(imageError instanceof Error ? imageError.message : 'Unable to read the selected image.');
    } finally {
      event.target.value = '';
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!canSubmit) {
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const board = await createEditorBoard({
        ...(description.trim() ? { description: description.trim() } : {}),
        ...(boardImage ? { imageUrl: boardImage } : {}),
        name: name.trim(),
      });
      setSuccessMessage(`Created board #${board.id}: ${board.name}`);
      onCreated?.(board);
      setName('');
      setDescription('');
      setBoardImage('');
      setBoardImageName('');
      setBoardImageSize(null);
    } catch (submitError) {
      setError(getErrorMessage(submitError));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      {trigger !== undefined ? (
        trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null
      ) : (
        <DialogTrigger asChild>
          <Button className="h-9 rounded-[4px] bg-[#FFD369] px-4 text-xs font-black text-[#222831] hover:bg-[#eac04f]">
            <Plus className="size-4" />
            New Board
          </Button>
        </DialogTrigger>
      )}
      <DialogContent
        className="w-[calc(100vw-2rem)] max-h-[85dvh] max-w-[800px] gap-0 overflow-hidden rounded-[8px] border border-[#303842] bg-[#0c1219] p-0 text-[#eeeeee] shadow-2xl ring-0 sm:max-w-[800px]"
        showCloseButton
      >
        <DialogHeader className="border-b border-[#303842] px-7 pb-3 pt-6">
          <DialogTitle className="text-[26px] font-black leading-8 text-white">
            New Editor Board
          </DialogTitle>
          <DialogDescription className="mt-2 max-w-2xl text-sm font-semibold leading-5 text-[#aeb7c2]">
            Create the editorial workspace. Only the board name is persisted by the current API.
          </DialogDescription>
        </DialogHeader>

        <form className="flex max-h-[calc(88dvh-124px)] flex-col" onSubmit={handleSubmit}>
          <div className="min-h-0 overflow-y-auto px-7 py-5">
            <div className="grid gap-7 lg:grid-cols-[1fr_320px]">
              <div className="grid content-start gap-5 border-[#303842] lg:border-r lg:pr-8">
                <div className="space-y-3">
                  <label className={labelClassName} htmlFor="board_name">
                    Board Name <span className="text-red-300">*</span>
                  </label>
                  <Input
                    className={fieldClassName}
                    id="board_name"
                    name="board_name"
                    onChange={(event) => setName(event.target.value)}
                    placeholder="e.g. Weekly Shonen Review Alpha"
                    value={name}
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <label className={labelClassName} htmlFor="board_description">
                      Board Description <span className="text-red-300">*</span>
                    </label>
                  </div>
                  <Textarea
                    className="min-h-[118px] resize-none rounded-[5px] border-[#303842] bg-[#101820] px-4 py-3 text-sm font-semibold leading-6 text-white placeholder:text-[#8b94a1] focus-visible:border-[#FFD369] focus-visible:ring-[#FFD369]/20"
                    id="board_description"
                    name="board_description"
                    onChange={(event) => setDescription(event.target.value)}
                    placeholder="Editorial focus, review cadence, team goals..."
                    value={description}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className={labelClassName} htmlFor="board_mark">
                    Board Mark <span className="text-red-300">*</span>
                  </label>
                  <p className="mt-2 text-xs font-semibold text-[#8b94a1]">
                    Recommended 640x640px or higher
                  </p>
                </div>
                
                <label
                  className="mx-auto block w-full max-w-[175px] cursor-pointer overflow-hidden rounded-[5px] border border-dashed border-[#4b535f] bg-[#101820] hover:border-[#FFD369]/70 hover:bg-[#111922]"
                  htmlFor="board_mark"
                >
                  {boardImage ? (
                    <div className="relative overflow-hidden rounded-[5px]">
                      <img
                        alt=""
                        className="aspect-[2/3] w-full object-cover"
                        src={boardImage}
                      />
                      <button
                        aria-label="Remove board mark"
                        className="absolute right-3 top-3 grid size-9 place-items-center rounded-full bg-black/70 text-white hover:bg-red-950"
                        onClick={() => {
                          setBoardImage('');
                          setBoardImageName('');
                          setBoardImageSize(null);
                        }}
                        type="button"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="grid aspect-[2/3] place-items-center bg-[#090f16] px-6 text-center">
                      <div>
                        <UploadCloud className="mx-auto size-9 text-[#dce7f3]" />
                        <p className="mt-3 text-sm font-black text-white">Upload board mark</p>
                        <p className="mt-1 text-xs font-bold text-[#8b94a1]">
                          Click to upload PNG, JPG or WebP
                        </p>
                      </div>
                    </div>
                  )}
                  <Input
                    accept="image/*"
                    className="hidden"
                    id="board_mark"
                    name="board_mark"
                    onChange={handleBoardImageChange}
                    type="file"
                  />
                </label>
                
                {boardImageName ? (
                  <div className="flex items-center gap-3 rounded-[5px] border border-dashed border-[#303842] bg-[#101820] p-3">
                    <FileText className="size-6 shrink-0 text-[#dce7f3]" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-black text-white">{boardImageName}</p>
                      <p className="mt-1 text-[11px] font-bold text-[#8b94a1]">
                        {boardImageSize ? `${(boardImageSize / 1024 / 1024).toFixed(1)} MB` : 'Compressed'}
                      </p>
                    </div>
                    <label
                      className="inline-flex h-9 cursor-pointer items-center rounded-[4px] border border-[#303842] bg-[#111922] px-3 text-xs font-black text-white hover:bg-[#303842]"
                      htmlFor="board_mark"
                    >
                      Replace
                    </label>
                    <button
                      className="h-9 rounded-[4px] border border-[#303842] bg-[#111922] px-3 text-xs font-black text-red-300 hover:bg-red-950/30"
                      onClick={() => {
                        setBoardImage('');
                        setBoardImageName('');
                        setBoardImageSize(null);
                      }}
                      type="button"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <p className="rounded-[5px] border border-[#303842] bg-[#101820] px-3 py-3 text-[11px] font-semibold leading-5 text-[#8b94a1]">
                    No cover selected. You can still create the board and add artwork later.
                  </p>
                )}
              </div>

              {error ? <p className="md:col-span-2 text-xs font-bold text-red-300">{error}</p> : null}
              {successMessage ? (
                <p className="md:col-span-2 text-xs font-bold text-[#9df2c7]">{successMessage}</p>
              ) : null}
            </div>
          </div>

          <DialogFooter className="mx-0 mb-0 shrink-0 rounded-none border-[#303842] bg-[#101820] px-7 py-5">
            <DialogClose asChild>
              <Button
                className="h-11 min-w-28 rounded-[5px] border-[#4b535f] bg-[#101820] px-5 text-sm font-black text-white hover:bg-[#393E46]"
                type="button"
                variant="outline"
              >
                Cancel
              </Button>
            </DialogClose>
            <Button
              className="h-11 min-w-40 rounded-[5px] bg-[#FFD369] px-5 text-sm font-black text-[#222831] hover:bg-[#eac04f]"
              disabled={!canSubmit}
              type="submit"
            >
              {isSubmitting ? 'Creating...' : 'Create Board'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
