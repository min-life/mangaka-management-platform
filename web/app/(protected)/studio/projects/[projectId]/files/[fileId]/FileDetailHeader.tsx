'use client';

import Link from 'next/link';
import { ArrowLeft, ChevronRight, FileText } from 'lucide-react';

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
  project?: any;
  folder?: any;
  folders?: any[];
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
  project,
  folder,
  folders,
  taskCount,
  versions,
}: FileDetailHeaderProps) {
  const searchParams = useSearchParams();
  const backParam = searchParams.get('back');
  const backHref = backParam ? decodeURIComponent(backParam) : `/studio/projects/${projectId}/files`;

  const projectName = project?.name || `Project #${projectId}`;
  const fullFolder = folder ? folders?.find(f => f.id === folder.id) : null;
  const arc = fullFolder?.parentId ? folders?.find(f => f.id === fullFolder.parentId) : fullFolder;
  const chapter = fullFolder?.parentId ? fullFolder : null;

  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b border-[#26303b] bg-[#151c25] px-5 py-3">
      <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-[#8b94a1] overflow-hidden whitespace-nowrap">

        
        <span className="hidden md:inline">{projectName}</span>
        <ChevronRight className="size-3.5 hidden md:inline" />
        <Link href={`/studio/projects/${projectId}/files`} className="hidden md:inline hover:text-white transition-colors">
          Resources
        </Link>

        {arc ? (
          <>
            <ChevronRight className="size-3.5" />
            <Link href={`/studio/projects/${projectId}/files?arcId=${arc.id}`} className="hover:text-white transition-colors">
              {arc.title}
            </Link>
          </>
        ) : null}

        {chapter && chapter.id !== arc?.id ? (
          <>
            <ChevronRight className="size-3.5" />
            <Link href={`/studio/projects/${projectId}/files?arcId=${arc?.id || ''}&chapterId=${chapter.id}`} className="hover:text-white transition-colors">
              {chapter.title}
            </Link>
          </>
        ) : null}

        <ChevronRight className="size-3.5" />
        <div className="flex items-center gap-1.5 text-white">
          <FileText className="size-4 text-[#FFD369]" />
          <span>{file.title}</span>
        </div>
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
