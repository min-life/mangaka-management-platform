'use client';

import { useState, useEffect } from 'react';
import { AxiosError } from 'axios';
import { toast } from '@/lib/toast';
import { Check, CheckCircle2, ChevronDown, FileText, Plus, Search, Trash2, UploadCloud } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { CreateBoardDialog } from './CreateBoardDialog';
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
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

function getBoardInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word.charAt(0))
    .join('')
    .toUpperCase();
}

function getBoardLeadName(board?: EditorBoardResponse) {
  return board?.createdByUser?.displayName ?? board?.createdByUser?.email ?? 'Unassigned lead';
}

function getBoardProjectCount(board: EditorBoardResponse) {
  return board.numberOfProjects ?? board._count?.projects ?? 0;
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
  const [boardPickerOpen, setBoardPickerOpen] = useState(false);
  const [boardSearch, setBoardSearch] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [boardsList, setBoardsList] = useState<EditorBoardResponse[]>(editorBoards);
  const [createBoardOpen, setCreateBoardOpen] = useState(false);

  useEffect(() => {
    setBoardsList(editorBoards);
  }, [editorBoards]);

  const canSubmit = name.trim().length > 0 && editorBoardId !== 'none' && !isSubmitting;
  const selectedBoard = boardsList.find((board) => String(board.id) === editorBoardId);
  const filteredBoards = boardsList.filter((board) => {
    const query = boardSearch.trim().toLowerCase();

    if (!query) {
      return true;
    }

    return [board.name, board.description ?? '', getBoardLeadName(board)].some((value) =>
      value.toLowerCase().includes(query),
    );
  });

  const resetForm = () => {
    setName('');
    setDescription('');
    setCoverImage('');
    setCoverImageName('');
    setCoverImageSize(null);
    setEditorBoardId('none');
    setBoardPickerOpen(false);
    setBoardSearch('');
    setError(null);
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
      toast.error('Please choose an image file.');
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

    try {
      const project = await createProject({
        ...(coverImage ? { imageUrl: coverImage } : {}),
        ...(description.trim() ? { description: description.trim() } : {}),
        name: name.trim(),
        ...(editorBoardId !== 'none' ? { editorBoardId: Number(editorBoardId) } : {}),
      });

      onCreated?.(project);
      toast.success(`Project "${project.name}" created successfully.`);
      setOpen(false);
      resetForm();
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
                  <Popover onOpenChange={setBoardPickerOpen} open={boardPickerOpen}>
                    <PopoverTrigger asChild>
                      <button
                        className="flex h-[68px] w-full items-center justify-between gap-3 rounded-[5px] border border-[#303842] bg-[#101820] px-4 text-left outline-none transition hover:border-[#4b535f] focus:border-[#FFD369] focus:ring-2 focus:ring-[#FFD369]/20"
                        type="button"
                      >
                        {selectedBoard ? (
                          <span className="flex min-w-0 items-center gap-3">
                            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#2a2414] text-xs font-black text-[#FFD369]">
                              {getBoardInitials(selectedBoard.name)}
                            </span>
                            <span className="min-w-0">
                              <span className="block truncate text-sm font-black text-white">
                                {selectedBoard.name}
                              </span>
                              <span className="block truncate text-xs font-bold text-[#8b94a1]">
                                Lead: {getBoardLeadName(selectedBoard)} - {getBoardProjectCount(selectedBoard)} projects
                              </span>
                            </span>
                          </span>
                        ) : (
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-black text-white">
                              New editor board
                            </span>
                            <span className="block truncate text-xs font-bold text-[#8b94a1]">
                              Create a new board or search system boards
                            </span>
                          </span>
                        )}
                        <ChevronDown className="size-4 shrink-0 text-[#8b94a1]" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent
                      align="start"
                      className="z-[80] w-[var(--radix-popover-trigger-width)] rounded-[5px] border border-[#4b535f] bg-[#151c25] p-2 text-white shadow-2xl"
                    >
                      <div className="flex h-10 items-center gap-2 rounded-[4px] border border-[#303842] bg-[#101820] px-3">
                        <Search className="size-4 shrink-0 text-[#8b94a1]" />
                        <input
                          className="min-w-0 flex-1 bg-transparent text-xs font-bold text-white outline-none placeholder:text-[#8b94a1]"
                          onChange={(event) => setBoardSearch(event.target.value)}
                          placeholder="Search board name or lead..."
                          value={boardSearch}
                        />
                      </div>

                      <div className="mt-2 max-h-64 overflow-y-auto pr-1">
                        <button
                          className="flex w-full items-center gap-3 rounded-[4px] px-3 py-3 text-left hover:bg-[#202832]"
                          onClick={() => {
                            setCreateBoardOpen(true);
                            setBoardPickerOpen(false);
                          }}
                          type="button"
                        >
                          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#FFD369]/10 text-xs font-black text-[#FFD369]">
                            +
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block text-xs font-black text-[#FFD369]">
                              New editor board
                            </span>
                            <span className="block text-[11px] font-bold text-[#8b94a1]">
                              Create a new editor board immediately
                            </span>
                          </span>
                          {editorBoardId === 'none' ? (
                            <Check className="size-4 shrink-0 text-[#FFD369]" />
                          ) : null}
                        </button>

                        {filteredBoards.map((board) => (
                          <button
                            className="flex w-full items-center gap-3 rounded-[4px] px-3 py-3 text-left hover:bg-[#202832]"
                            key={board.id}
                            onClick={() => {
                              setEditorBoardId(String(board.id));
                              setBoardSearch('');
                              setBoardPickerOpen(false);
                            }}
                            type="button"
                          >
                            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#2a2414] text-xs font-black text-[#FFD369]">
                              {getBoardInitials(board.name)}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-xs font-black text-white">
                                {board.name}
                              </span>
                              <span className="block truncate text-[11px] font-bold text-[#8b94a1]">
                                Lead: {getBoardLeadName(board)} - {getBoardProjectCount(board)} projects
                              </span>
                            </span>
                            {String(board.id) === editorBoardId ? (
                              <Check className="size-4 shrink-0 text-[#FFD369]" />
                            ) : null}
                          </button>
                        ))}

                        {filteredBoards.length === 0 ? (
                          <p className="px-3 py-4 text-center text-xs font-bold text-[#8b94a1]">
                            No editor boards match your search.
                          </p>
                        ) : null}
                      </div>
                    </PopoverContent>
                  </Popover>
                  <p className="text-[11px] font-bold leading-5 text-[#8b94a1]">
                    Boards are loaded from the system-wide editor board list.
                  </p>
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
              {isSubmitting ? 'Creating...' : 'Create Project'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
      <CreateBoardDialog
        open={createBoardOpen}
        onOpenChange={setCreateBoardOpen}
        trigger={null}
        onCreated={(board) => {
          setBoardsList((prev) => [board, ...prev]);
          setEditorBoardId(String(board.id));
          setCreateBoardOpen(false);
        }}
      />
    </Dialog>
  );
}
