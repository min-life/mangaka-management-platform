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
  project?: any;
  folder?: any;
  folders?: any[];
  taskCount: number;
  versions: FileVersionItem[];
};

import { useProjectParams } from '@/hooks/useProjectParams';

export function FileDetailHeader({
  assignedToName,
  file,
  folderTitle,
  isSubmittingReview,
  onCreateReview,
  onOpenMobileTasks,
  project,
  folder,
  folders,
  taskCount,
  versions,
}: FileDetailHeaderProps) {
  const searchParams = useSearchParams();
  const backParam = searchParams.get('back');
  const { slug, numericId: projectId } = useProjectParams();
  const backHref = backParam ? decodeURIComponent(backParam) : `/studio/projects/${slug}/files`;

  const projectName = project?.name || `Project #${projectId}`;
  const fullFolder = folder ? folders?.find(f => f.id === folder.id) : null;
  const arc = fullFolder?.parentId ? folders?.find(f => f.id === fullFolder.parentId) : fullFolder;
  const chapter = fullFolder?.parentId ? fullFolder : null;

  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b border-[#26303b] bg-[#151c25] px-5 py-3">
      <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-[#8b94a1] overflow-hidden whitespace-nowrap">

        
        <span className="hidden md:inline">{projectName}</span>
        <ChevronRight className="size-3.5 hidden md:inline" />
        <Link href={`/studio/projects/${slug}/files`} className="hidden md:inline hover:text-white transition-colors">
          Resources
        </Link>

        {arc ? (
          <>
            <ChevronRight className="size-3.5" />
            <Link href={`/studio/projects/${slug}/files?arcId=${arc.id}`} className="hover:text-white transition-colors">
              {arc.title}
            </Link>
          </>
        ) : null}

        {chapter && chapter.id !== arc?.id ? (
          <>
            <ChevronRight className="size-3.5" />
            <Link href={`/studio/projects/${slug}/files?arcId=${arc?.id || ''}&chapterId=${chapter.id}`} className="hover:text-white transition-colors">
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
