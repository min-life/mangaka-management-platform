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
import {
  createEditorBoard,
  type EditorBoardResponse,
} from '@/services/editor-board.service';

const fieldClassName =
  'h-10 rounded-[4px] border-[#4b535f] bg-[#111922] px-3 text-sm font-semibold text-white placeholder:text-[#8b94a1] focus-visible:border-[#FFD369] focus-visible:ring-[#FFD369]/20';

const labelClassName =
  'text-[10px] font-black uppercase tracking-[0.08em] text-[#dce7f3]';

const maxInlineImageLength = 70_000;

function getErrorMessage(error: unknown) {
  if (error instanceof AxiosError) {
    const message = error.response?.data?.message;
    return typeof message === 'string' ? message : 'Create board failed.';
  }

  return 'Create board failed.';
}

function compressBoardImageFile(file: File) {
  return new Promise<string>((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);

      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');

      if (!context) {
        reject(new Error('Canvas is not available.'));
        return;
      }

      const baseScale = Math.min(1, 640 / image.width, 640 / image.height);
      let width = Math.max(1, Math.round(image.width * baseScale));
      let height = Math.max(1, Math.round(image.height * baseScale));

      for (let resizeAttempt = 0; resizeAttempt < 6; resizeAttempt += 1) {
        canvas.width = width;
        canvas.height = height;
        context.clearRect(0, 0, width, height);
        context.drawImage(image, 0, 0, width, height);

        for (const quality of [0.76, 0.64, 0.52, 0.42, 0.32]) {
          const dataUrl = canvas.toDataURL('image/jpeg', quality);

          if (dataUrl.length <= maxInlineImageLength) {
            resolve(dataUrl);
            return;
          }
        }

        width = Math.max(1, Math.round(width * 0.76));
        height = Math.max(1, Math.round(height * 0.76));
      }

      reject(new Error('Image is too large. Please choose a smaller board mark.'));
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Unable to read the selected image.'));
    };

    image.src = objectUrl;
  });
}

type CreateBoardDialogProps = {
  onCreated?: (board: EditorBoardResponse) => void;
};

export function CreateBoardDialog({ onCreated }: CreateBoardDialogProps) {
  const [open, setOpen] = useState(false);
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
      const compressedImage = await compressBoardImageFile(file);
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
      <DialogTrigger asChild>
        <Button className="h-9 rounded-[4px] bg-[#FFD369] px-4 text-xs font-black text-[#222831] hover:bg-[#eac04f]">
          <Plus className="size-4" />
          New Board
        </Button>
      </DialogTrigger>
      <DialogContent
        className="w-[calc(100vw-2rem)] max-h-[88dvh] max-w-[720px] gap-0 overflow-hidden rounded-[7px] border border-[#393E46] bg-[#0c1219] p-0 text-[#eeeeee] ring-0 sm:max-w-[720px]"
        showCloseButton
      >
        <DialogHeader className="border-b border-[#393E46] px-6 py-4">
          <p className="text-xs font-bold uppercase tracking-[0.08em] text-[#FFD369]">
            Create Board
          </p>
          <DialogTitle className="text-[22px] font-black leading-7 text-white">
            New Editor Board
          </DialogTitle>
          <DialogDescription className="max-w-2xl text-sm font-medium leading-5 text-[#aeb7c2]">
            Create the editorial workspace. Only the board name is persisted by the current API.
          </DialogDescription>
        </DialogHeader>

        <form className="flex max-h-[calc(88dvh-124px)] flex-col" onSubmit={handleSubmit}>
          <div className="min-h-0 overflow-y-auto px-6 py-5">
            <div className="grid gap-5 md:grid-cols-[1fr_230px]">
              <div className="grid content-start gap-4">
                <div className="space-y-2">
                  <label className={labelClassName} htmlFor="board_name">
                    Board Name
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

                <div className="space-y-2">
                  <label className={labelClassName} htmlFor="board_description">
                    Board Description *
                  </label>
                  <Textarea
                    className="min-h-[128px] resize-none rounded-[4px] border-[#4b535f] bg-[#111922] px-3 py-3 text-sm font-semibold leading-6 text-white placeholder:text-[#8b94a1] focus-visible:border-[#FFD369] focus-visible:ring-[#FFD369]/20"
                    id="board_description"
                    name="board_description"
                    onChange={(event) => setDescription(event.target.value)}
                    placeholder="Editorial focus, review cadence, team goals..."
                    value={description}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className={labelClassName} htmlFor="board_mark">
                  Board Mark *
                </label>
                <div className="overflow-hidden rounded-[5px] border border-dashed border-[#4b535f] bg-[#111922]">
                  {boardImage ? (
                    <div className="relative">
                      <img
                        alt=""
                        className="aspect-square w-full object-cover"
                        src={boardImage}
                      />
                      <button
                        aria-label="Remove board mark"
                        className="absolute right-3 top-3 grid size-8 place-items-center rounded-full bg-black/70 text-white hover:bg-red-950"
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
                    <div className="grid aspect-square place-items-center text-[#8b94a1]">
                      <ImageIcon className="size-9" />
                    </div>
                  )}
                </div>
                {boardImageName ? (
                  <div className="flex items-center gap-2 rounded-[4px] border border-[#303842] bg-[#101820] p-2">
                    <FileText className="size-4 shrink-0 text-[#dce7f3]" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[11px] font-black text-white">{boardImageName}</p>
                      <p className="text-[10px] font-bold text-[#8b94a1]">
                        {boardImageSize ? `${(boardImageSize / 1024 / 1024).toFixed(1)} MB` : 'Compressed'}
                      </p>
                    </div>
                  </div>
                ) : null}
                <label
                  className="flex h-10 cursor-pointer items-center justify-center gap-2 rounded-[4px] border border-[#4b535f] bg-[#101820] px-3 text-xs font-black text-white hover:bg-[#393E46]"
                  htmlFor="board_mark"
                >
                  <UploadCloud className="size-4" />
                  {boardImage ? 'Replace Image' : 'Upload Image'}
                  <Input
                    accept="image/*"
                    className="hidden"
                    id="board_mark"
                    name="board_mark"
                    onChange={handleBoardImageChange}
                    type="file"
                  />
                </label>
              </div>

              {error ? <p className="md:col-span-2 text-xs font-bold text-red-300">{error}</p> : null}
              {successMessage ? (
                <p className="md:col-span-2 text-xs font-bold text-[#9df2c7]">{successMessage}</p>
              ) : null}
            </div>
          </div>

          <DialogFooter className="mx-0 mb-0 shrink-0 rounded-none border-[#393E46] bg-[#101820] px-6 py-3">
            <DialogClose asChild>
              <Button
                className="h-9 rounded-[4px] border-[#4b535f] bg-[#101820] px-5 text-xs font-black text-white hover:bg-[#393E46]"
                type="button"
                variant="outline"
              >
                Cancel
              </Button>
            </DialogClose>
            <Button
              className="h-9 rounded-[4px] bg-[#FFD369] px-5 text-xs font-black text-[#222831] hover:bg-[#eac04f]"
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
