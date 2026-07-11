'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, FileQuestion } from 'lucide-react';

import { LoadingState } from '@/components/ui/loading-state';

import { FileDetailView } from './FileDetailView';
import { useFileDetailController } from './hooks/useFileDetailController';

type FileDetailClientProps = {
  fileId: number;
  focusedTaskId: string | null;
  projectId: number;
};

export function FileDetailClient({ fileId, focusedTaskId, projectId }: FileDetailClientProps) {
  const controller = useFileDetailController({ fileId, focusedTaskId, projectId });
  const searchParams = useSearchParams();
  const backParam = searchParams.get('back');
  const backHref = backParam ? decodeURIComponent(backParam) : `/studio/projects/${projectId}/files`;

  if (controller.isInitialLoading) {
    return (
      <LoadingState
        message="Loading file workspace..."
        minHeight="70vh"
        variant="detail"
      />
    );
  }

  if (!controller.file) {
    return (
      <div className="grid min-h-[70vh] place-items-center px-6 text-center">
        <div>
          <FileQuestion className="mx-auto size-10 text-[#5b626d]" />
          <p className="mt-4 text-base font-black text-white">File detail unavailable</p>
          <p className="mt-2 text-sm font-medium text-[#aeb7c2]">
            {controller.error ?? 'File was not found in the current project workspace.'}
          </p>
          <Link
            className="mt-5 inline-flex h-9 items-center gap-2 rounded-[4px] border border-[#4b535f] px-4 text-xs font-black text-white hover:bg-[#303842]"
            href={backHref}
          >
            <ArrowLeft className="size-4" />
            Back to Resources
          </Link>
        </div>
      </div>
    );
  }

  return <FileDetailView controller={controller} />;
}
