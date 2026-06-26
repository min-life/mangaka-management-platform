'use client';

import { useState } from 'react';
import { AxiosError } from 'axios';
import { CheckCircle2, FileText, Plus, Trash2, UploadCloud } from 'lucide-react';

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { compressImageFile } from '@/lib/image-upload';
import { createProject, type ProjectResponse } from '@/services/project.service';
import type { EditorBoardResponse } from '@/services/editor-board.service';

const fieldClassName =
  'h-11 rounded-[5px] border-[#303842] bg-[#101820] px-4 text-sm font-bold text-white placeholder:text-[#8b94a1] focus-visible:border-[#FFD369] focus-visible:ring-[#FFD369]/20';

const labelClassName =
  'text-[10px] font-black uppercase tracking-[0.08em] text-[#dce7f3]';

function getErrorMessage(error: unknown) {
  if (error instanceof AxiosError) {
    const message = error.response?.data?.message;
    return typeof message === 'string' ? message : 'Create project failed.';
  }

  return 'Create project failed.';
}

type CreateProjectDialogProps = {
  editorBoards?: EditorBoardResponse[];
  onCreated?: (project: ProjectResponse) => void;
};

export function CreateProjectDialog({ editorBoards = [], onCreated }: CreateProjectDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [coverImageName, setCoverImageName] = useState('');
  const [coverImageSize, setCoverImageSize] = useState<number | null>(null);
  const [editorBoardId, setEditorBoardId] = useState('none');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const canSubmit = name.trim().length > 0 && !isSubmitting;
  const selectedBoard = editorBoards.find((board) => String(board.id) === editorBoardId);

  const resetForm = () => {
    setName('');
    setDescription('');
    setCoverImage('');
    setCoverImageName('');
    setCoverImageSize(null);
    setEditorBoardId('none');
    setError(null);
    setSuccessMessage(null);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);

    if (!nextOpen) {
      resetForm();
    }
  };

  const handleCoverChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file.');
      return;
    }

    try {
      const compressedImage = await compressImageFile(file);
      setCoverImage(compressedImage);
      setCoverImageName(file.name);
      setCoverImageSize(file.size);
      setError(null);
    } catch (imageError) {
      setCoverImage('');
      setCoverImageName('');
      setCoverImageSize(null);
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
      const project = await createProject({
        ...(coverImage ? { imageUrl: coverImage } : {}),
        ...(description.trim() ? { description: description.trim() } : {}),
        name: name.trim(),
        ...(editorBoardId !== 'none' ? { editorBoardId: Number(editorBoardId) } : {}),
      });

      setSuccessMessage(`Created project #${project.id}: ${project.name}`);
      onCreated?.(project);
      setName('');
      setDescription('');
      setCoverImage('');
      setCoverImageName('');
      setCoverImageSize(null);
      setEditorBoardId('none');
    } catch (submitError) {
      setError(getErrorMessage(submitError));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      <DialogTrigger asChild>
        <Button className="h-11 rounded-[4px] bg-[#FFD369] px-5 text-sm font-black text-[#222831] hover:bg-[#eac04f]">
          <Plus className="size-4" />
          New Project
        </Button>
      </DialogTrigger>
      <DialogContent
        className="w-[calc(100vw-2rem)] max-h-[85dvh] max-w-[900px] gap-0 overflow-hidden rounded-[8px] border border-[#303842] bg-[#0c1219] p-0 text-[#eeeeee] shadow-2xl ring-0 sm:max-w-[900px]"
        showCloseButton
      >
        <DialogHeader className="border-b border-[#303842] px-7 pb-3 pt-6">
          <DialogTitle className="text-[26px] font-black leading-8 text-white">
            New Project
          </DialogTitle>
          <DialogDescription className="mt-2 max-w-2xl text-sm font-semibold leading-5 text-[#aeb7c2]">
            Create a new manga production project.
          </DialogDescription>
        </DialogHeader>

        <form className="flex max-h-[calc(85dvh-112px)] flex-col" onSubmit={handleSubmit}>
          <div className="min-h-0 overflow-y-auto px-7 py-5">
            <div className="grid gap-7 lg:grid-cols-[1fr_320px]">
              <div className="grid content-start gap-5 border-[#303842] lg:border-r lg:pr-8">
                <div className="space-y-3">
                  <label className={labelClassName} htmlFor="project_name">
                    Project Name <span className="text-red-300">*</span>
                  </label>
                  <div className="relative">
                    <Input
                      className={`${fieldClassName} pr-11`}
                      id="project_name"
                      name="project_name"
                      onChange={(event) => setName(event.target.value)}
                      placeholder="e.g. Shadow Over Kyoto"
                      value={name}
                    />
                    {name.trim() ? (
                      <CheckCircle2 className="absolute right-3 top-1/2 size-5 -translate-y-1/2 text-[#56e08f]" />
                    ) : null}
                  </div>
                  {name.trim() ? (
                    <p className="flex items-center gap-2 text-xs font-bold text-[#56e08f]">
                      <CheckCircle2 className="size-4" />
                      This project name is available.
                    </p>
                  ) : null}
                </div>

                <div className="space-y-3">
                  <label className={labelClassName}>
                    Editor Board <span className="text-red-300">*</span>
                  </label>
                  <Select onValueChange={setEditorBoardId} value={editorBoardId}>
                    <SelectTrigger className="h-[68px] w-full rounded-[5px] border-[#303842] bg-[#101820] px-4 text-left focus:border-[#FFD369] focus:ring-[#FFD369]/20">
                      <SelectValue placeholder="Select a production board...">
                        {selectedBoard ? (
                          <div className="flex items-center gap-3">
                            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#2a2414] text-xs font-black text-[#FFD369]">
                              {selectedBoard.name
                                .split(' ')
                                .slice(0, 2)
                                .map((word) => word.charAt(0))
                                .join('')}
                            </span>
                            <span className="min-w-0">
                              <span className="block truncate text-sm font-black text-white">
                                {selectedBoard.name}
                              </span>
                              <span className="block truncate text-xs font-bold text-[#8b94a1]">
                                Lead: {selectedBoard.createdByUser?.displayName ?? selectedBoard.createdByUser?.email ?? 'Unassigned'}
                              </span>
                            </span>
                          </div>
                        ) : null}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="border-[#4b535f] bg-[#151c25] text-white">
                      <SelectItem value="none">No editor board yet</SelectItem>
                      {editorBoards.map((board) => (
                        <SelectItem key={board.id} value={String(board.id)}>
                          <span className="font-bold">{board.name}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <label className={labelClassName} htmlFor="project_description">
                      Description
                    </label>
                    <span className="text-xs font-bold text-[#8b94a1]">
                      {description.length} / 500
                    </span>
                  </div>
                  <Textarea
                    className="min-h-[118px] resize-none rounded-[5px] border-[#303842] bg-[#101820] px-4 py-3 text-sm font-semibold leading-6 text-white placeholder:text-[#8b94a1] focus-visible:border-[#FFD369] focus-visible:ring-[#FFD369]/20"
                    id="project_description"
                    maxLength={500}
                    name="project_description"
                    onChange={(event) => setDescription(event.target.value)}
                    placeholder="A historical fantasy set in Edo-period Kyoto..."
                    value={description}
                  />
                  <p className="text-xs font-semibold leading-5 text-[#8b94a1]">
                    Briefly describe the project.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className={labelClassName} htmlFor="cover_image">
                    Project Cover
                  </label>
                  <p className="mt-2 text-xs font-semibold text-[#8b94a1]">
                    Recommended 1200x1800px or higher
                  </p>
                </div>

                <label
                  className="mx-auto block w-full max-w-[175px] cursor-pointer overflow-hidden rounded-[5px] border border-dashed border-[#4b535f] bg-[#101820] hover:border-[#FFD369]/70 hover:bg-[#111922]"
                  htmlFor="cover_image"
                >
                  {coverImage ? (
                    <div className="relative overflow-hidden rounded-[5px]">
                      <img
                        alt=""
                        className="aspect-[2/3] w-full object-cover"
                        src={coverImage}
                      />
                      <button
                        aria-label="Remove cover"
                        className="absolute right-3 top-3 grid size-9 place-items-center rounded-full bg-black/70 text-white hover:bg-red-950"
                        onClick={() => {
                          setCoverImage('');
                          setCoverImageName('');
                          setCoverImageSize(null);
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
                        <p className="mt-3 text-sm font-black text-white">Upload project cover</p>
                        <p className="mt-1 text-xs font-bold text-[#8b94a1]">
                          Click to upload PNG, JPG or WebP
                        </p>
                      </div>
                    </div>
                  )}
                  <Input
                    accept="image/*"
                    className="hidden"
                    id="cover_image"
                    name="cover_image"
                    onChange={handleCoverChange}
                    type="file"
                  />
                </label>

                {coverImageName ? (
                  <div className="flex items-center gap-3 rounded-[5px] border border-dashed border-[#303842] bg-[#101820] p-3">
                    <FileText className="size-6 shrink-0 text-[#dce7f3]" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-black text-white">{coverImageName}</p>
                      <p className="mt-1 text-[11px] font-bold text-[#8b94a1]">
                        {coverImageSize ? `${(coverImageSize / 1024 / 1024).toFixed(1)} MB` : 'Compressed upload'}
                      </p>
                    </div>
                    <label
                      className="inline-flex h-9 cursor-pointer items-center rounded-[4px] border border-[#303842] bg-[#111922] px-3 text-xs font-black text-white hover:bg-[#303842]"
                      htmlFor="cover_image"
                    >
                      Replace
                    </label>
                    <button
                      className="h-9 rounded-[4px] border border-[#303842] bg-[#111922] px-3 text-xs font-black text-red-300 hover:bg-red-950/30"
                      onClick={() => {
                        setCoverImage('');
                        setCoverImageName('');
                        setCoverImageSize(null);
                      }}
                      type="button"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <p className="rounded-[5px] border border-[#303842] bg-[#101820] px-3 py-3 text-[11px] font-semibold leading-5 text-[#8b94a1]">
                    No cover selected. You can still create the project and add artwork later.
                  </p>
                )}
              </div>

              {error ? (
                <p className="text-xs font-bold text-red-300 lg:col-span-2">{error}</p>
              ) : null}
              {successMessage ? (
                <p className="text-xs font-bold text-[#9df2c7] lg:col-span-2">{successMessage}</p>
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
              {isSubmitting ? 'Creating...' : (
                <span className="inline-flex items-center gap-2">
                  Create Project
                  <Plus className="size-4" />
                </span>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
