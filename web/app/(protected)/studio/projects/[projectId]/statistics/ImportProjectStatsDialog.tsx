'use client';

import { useState } from 'react';
import { AxiosError } from 'axios';
import { FileSpreadsheet, UploadCloud, Trash2 } from 'lucide-react';

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/lib/toast';
import { importProjectStats } from '@/services/project-stats.service';

export type ChapterOption = {
  arcTitle: string;
  id: number;
  title: string;
};

type ImportProjectStatsDialogProps = {
  chapters: ChapterOption[];
  defaultChapterId: number | null;
  onImported: () => Promise<void> | void;
  projectId: number;
};

const labelClassName = 'text-[10px] font-black uppercase tracking-[0.08em] text-[#dce7f3]';

function getErrorMessage(error: unknown) {
  if (error instanceof AxiosError) {
    const message = error.response?.data?.message;
    if (typeof message === 'string') return message;
    if (Array.isArray(message) && message.length) return message.join(' ');
    if (error.response?.status) return `Import failed (HTTP ${error.response.status}).`;
  }
  return 'Import failed. Please check the CSV file and try again.';
}

export function ImportProjectStatsDialog({
  chapters,
  defaultChapterId,
  onImported,
  projectId,
}: ImportProjectStatsDialogProps) {
  const [open, setOpen] = useState(false);
  const [chapterId, setChapterId] = useState(defaultChapterId ? String(defaultChapterId) : '');
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (nextOpen) {
      setChapterId(defaultChapterId ? String(defaultChapterId) : '');
      setFile(null);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const picked = event.target.files?.[0];
    if (picked) setFile(picked);
    event.target.value = '';
  };

  const handleImport = async () => {
    if (!chapterId || !file) return;

    setIsSubmitting(true);
    try {
      await importProjectStats(projectId, { chapterId: Number(chapterId), file });
      toast.success('Chapter stats imported successfully.');
      setOpen(false);
      await onImported();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit = Boolean(chapterId && file) && !isSubmitting;

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      <DialogTrigger asChild>
        <Button className="h-9 rounded-[4px] bg-[#FFD369] px-4 text-xs font-black text-[#222831] hover:bg-[#eac04f]">
          <UploadCloud className="size-4" />
          Import CSV
        </Button>
      </DialogTrigger>
      <DialogContent
        className="w-[calc(100vw-2rem)] max-w-[520px] gap-0 overflow-hidden rounded-[7px] border border-[#39424f] bg-[#101820] p-0 text-white"
        showCloseButton
      >
        <DialogHeader className="border-b border-[#39424f] px-6 py-5">
          <p className="text-xs font-black uppercase tracking-[0.08em] text-[#FFD369]">
            Project Stats
          </p>
          <DialogTitle className="text-xl font-black text-white">Import Chapter Stats</DialogTitle>
          <DialogDescription className="text-sm font-medium text-[#aeb7c2]">
            Upload a yearly CSV for one chapter. Required columns: <span className="text-white">Month</span>,{' '}
            <span className="text-white">Year</span>, plus any of Total Views, Total Sales, Total Revenue, Total
            Reviews, Average Rating. Re-importing overwrites matching month/year rows.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 space-y-4 px-6 py-5">
          <label className="block">
            <span className={labelClassName}>Chapter</span>
            <Select onValueChange={setChapterId} value={chapterId}>
              <SelectTrigger className="mt-2 h-10 w-full rounded-[4px] border-[#39424f] bg-[#151c25] text-sm font-bold text-white">
                <SelectValue placeholder="Select a chapter" />
              </SelectTrigger>
              <SelectContent className="border-[#39424f] bg-[#1a2029] text-white">
                {chapters.length ? (
                  chapters.map((chapter) => (
                    <SelectItem key={chapter.id} value={String(chapter.id)}>
                      {chapter.arcTitle} / {chapter.title}
                    </SelectItem>
                  ))
                ) : (
                  <div className="px-3 py-4 text-center text-xs font-bold text-[#8b94a1]">
                    No chapters available. Create chapters through Applications first.
                  </div>
                )}
              </SelectContent>
            </Select>
          </label>

          <div>
            <span className={labelClassName}>CSV File</span>
            <label
              className={`mt-2 flex min-h-[72px] cursor-pointer items-center gap-3 overflow-hidden rounded-[5px] border border-dashed px-3 py-3 text-left transition-colors ${
                isSubmitting ? 'cursor-not-allowed opacity-50' : 'hover:border-[#FFD369]/70'
              } ${file ? 'border-[#FFD369]/40 bg-[#2a2414]' : 'border-[#4b535f] bg-[#151c25]'}`}
              htmlFor={isSubmitting ? undefined : 'stats_csv_file'}
            >
              {file ? (
                <>
                  <FileSpreadsheet className="size-7 shrink-0 text-[#FFD369]" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[11px] font-black text-white">{file.name}</p>
                    <p className="mt-0.5 text-[10px] font-bold text-[#8b94a1]">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  <button
                    className="shrink-0 text-red-300 hover:text-red-200"
                    onClick={(event) => {
                      event.preventDefault();
                      setFile(null);
                    }}
                    type="button"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </>
              ) : (
                <span className="flex flex-1 items-center gap-3">
                  <UploadCloud className="size-5 shrink-0 text-[#8b94a1]" />
                  <span className="text-[11px] font-black text-[#8b94a1]">Click to upload .csv</span>
                </span>
              )}
              <input
                accept=".csv,text/csv"
                className="hidden"
                disabled={isSubmitting}
                id="stats_csv_file"
                onChange={handleFileChange}
                type="file"
              />
            </label>
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
            onClick={() => void handleImport()}
          >
            {isSubmitting ? 'Importing...' : 'Import'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
