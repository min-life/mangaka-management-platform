'use client';

import Link from 'next/link';
import { ArrowLeft, FileText } from 'lucide-react';

import { useSearchParams } from 'next/navigation';

import { Button } from '@/components/ui/button';
import type { ApplicationType } from '@/services/application.service';

import { CreateFileReviewDialog } from '../CreateFileReviewDialog';
import { fileStatusLabels, type FileExplorerItem, type FileVersionItem } from '../file-ui';

type FileDetailHeaderProps = {
  assignedToName: string;
  file: FileExplorerItem;
  folderTitle?: string;
  isSubmittingReview: boolean;
  onCreateReview: (data: { title: string; description?: string; type: ApplicationType }) => Promise<void>;
  onOpenMobileTasks: () => void;
  projectId: number;
  taskCount: number;
  versions: FileVersionItem[];
};

export function FileDetailHeader({
  assignedToName,
  file,
  folderTitle,
  isSubmittingReview,
  onCreateReview,
  onOpenMobileTasks,
  projectId,
  taskCount,
  versions,
}: FileDetailHeaderProps) {
  const searchParams = useSearchParams();
  const arcId = searchParams.get('arcId');
  const chapterId = searchParams.get('chapterId');

  const backParams = new URLSearchParams();
  if (arcId) backParams.set('arcId', arcId);
  if (chapterId) backParams.set('chapterId', chapterId);
  const backQuery = backParams.toString();
  const backHref = `/studio/projects/${projectId}/files${backQuery ? `?${backQuery}` : ''}`;

  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b border-[#26303b] bg-[#151c25] px-5 py-3">
      <div className="flex items-center gap-3">
        <Link
          className="mr-2 flex items-center gap-1.5 rounded-[4px] border border-[#39424f] bg-[#0d151e]/50 px-2.5 py-1.5 text-xs font-black text-[#8b94a1] transition-colors hover:bg-[#303842] hover:text-white"
          href={backHref}
        >
          <ArrowLeft className="size-3.5" />
          <span>Back</span>
        </Link>
        <FileText className="size-5 text-[#FFD369]" />
        <h1 className="text-base font-black text-white">{file.title}</h1>
      </div>

      <div className="flex items-center gap-3">
        <span className="rounded-[4px] border border-[#315846] bg-[#14291f] px-3 py-1.5 text-xs font-black text-[#9df2c7]">
          Current v{versions[0]?.version || 1}
        </span>

        <details className="group relative">
          <summary className="grid size-9 cursor-pointer list-none place-items-center rounded-[4px] border border-[#39424f] text-[16px] font-black text-[#FFD369] transition-colors hover:bg-[#303842]">
            ...
          </summary>
          <div className="absolute right-0 top-11 z-50 w-64 rounded-[4px] border border-[#39424f] bg-[#101820] p-4 shadow-2xl">
            <p className="text-[10px] font-black uppercase tracking-[0.08em] text-white">File Information</p>
            <dl className="mb-3 mt-3 grid grid-cols-2 gap-3 border-b border-[#303842] pb-3">
              {[
                ['Type', file.category],
                ['Version', versions[0] ? `v${versions[0].version}` : 'v1'],
                ['Assigned', assignedToName],
                ['Folder', folderTitle ?? 'Unknown'],
                ['Review', fileStatusLabels[file.status]],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="text-[8px] font-black uppercase text-[#8b94a1]">{label}</dt>
                  <dd className="mt-1 truncate text-[10px] font-bold text-white">{value}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-2 text-left">
              <p className="text-[8px] font-black uppercase text-[#8b94a1]">Description</p>
              <p className="mt-1 max-h-16 overflow-y-auto text-[10px] font-bold leading-relaxed text-white">
                {file.description || 'No description provided.'}
              </p>
            </div>
            <div className="mt-4 border-t border-[#303842] pt-3">
              <CreateFileReviewDialog file={file} isSubmitting={isSubmittingReview} onSubmit={onCreateReview} />
            </div>
          </div>
        </details>

        <Button
          className="h-9 rounded-[4px] bg-[#FFD369] px-4 text-xs font-black text-[#222831] hover:bg-[#eac04f] lg:hidden"
          onClick={onOpenMobileTasks}
        >
          Tasks ({taskCount})
        </Button>
      </div>
    </header>
  );
}
