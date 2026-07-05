'use client';

import { cn } from '@/lib/utils';

type LoadingStateProps = {
  message?: string;
  minHeight?: string;
  variant?: 'workspace' | 'detail' | 'list';
};

function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-[5px] bg-[#1f2937]',
        'before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.25s_linear_infinite]',
        'before:bg-gradient-to-r before:from-transparent before:via-[#374151]/70 before:to-transparent',
        className,
      )}
    />
  );
}

function LoadingLabel({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.08em] text-[#8b94a1]">
      <span className="size-2 rounded-full bg-[#FFD369]" />
      {message}
    </div>
  );
}

function WorkspaceSkeleton({ message }: { message: string }) {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-3">
          <SkeletonBlock className="h-8 w-56" />
          <SkeletonBlock className="h-4 w-[360px] max-w-full" />
        </div>
        <SkeletonBlock className="hidden h-10 w-32 sm:block" />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <SkeletonBlock className="h-10 w-full max-w-[360px]" />
        <SkeletonBlock className="h-10 w-40" />
        <SkeletonBlock className="h-10 w-24" />
      </div>

      <LoadingLabel message={message} />

      <div className="overflow-hidden rounded-[7px] border border-[#303842] bg-[#0c1219]">
        <div className="grid h-11 grid-cols-[2fr_1fr_1fr_120px_120px] gap-5 border-b border-[#303842] bg-[#202832] px-5 py-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <SkeletonBlock className="h-4" key={index} />
          ))}
        </div>
        <div className="divide-y divide-[#303842]">
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              className="grid min-h-[82px] grid-cols-[2fr_1fr_1fr_120px_120px] items-center gap-5 px-5 py-4"
              key={index}
            >
              <div className="flex items-center gap-3">
                <SkeletonBlock className="size-14 shrink-0 rounded-md" />
                <div className="min-w-0 flex-1 space-y-2">
                  <SkeletonBlock className="h-4 w-44 max-w-full" />
                  <SkeletonBlock className="h-3 w-24" />
                </div>
              </div>
              <SkeletonBlock className="h-4" />
              <SkeletonBlock className="h-4" />
              <SkeletonBlock className="h-4" />
              <SkeletonBlock className="h-4" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DetailSkeleton({ message }: { message: string }) {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-3">
          <SkeletonBlock className="h-4 w-32" />
          <SkeletonBlock className="h-8 w-64" />
          <SkeletonBlock className="h-4 w-[420px] max-w-full" />
        </div>
        <div className="flex gap-2">
          <SkeletonBlock className="h-10 w-28" />
          <SkeletonBlock className="h-10 w-28" />
        </div>
      </div>

      <LoadingLabel message={message} />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-4">
          <div className="overflow-hidden rounded-[7px] border border-[#303842] bg-[#0c1219]">
            <div className="flex h-12 items-center justify-between border-b border-[#303842] px-4">
              <SkeletonBlock className="h-4 w-40" />
              <SkeletonBlock className="h-8 w-32" />
            </div>
            <div className="p-4">
              <SkeletonBlock className="aspect-[16/10] min-h-[320px] w-full rounded-[6px]" />
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <SkeletonBlock className="h-24" />
            <SkeletonBlock className="h-24" />
            <SkeletonBlock className="h-24" />
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-[7px] border border-[#303842] bg-[#0c1219] p-4">
            <SkeletonBlock className="h-5 w-36" />
            <div className="mt-4 space-y-3">
              {Array.from({ length: 5 }).map((_, index) => (
                <SkeletonBlock className="h-16" key={index} />
              ))}
            </div>
          </div>
          <div className="rounded-[7px] border border-[#303842] bg-[#0c1219] p-4">
            <SkeletonBlock className="h-5 w-32" />
            <div className="mt-4 space-y-2">
              <SkeletonBlock className="h-4 w-full" />
              <SkeletonBlock className="h-4 w-3/4" />
              <SkeletonBlock className="h-4 w-5/6" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function LoadingState({
  message = 'Loading workspace...',
  minHeight = '560px',
  variant = 'workspace',
}: LoadingStateProps) {
  return (
    <div className="w-full px-0 py-1" style={{ minHeight }}>
      {variant === 'detail' ? (
        <DetailSkeleton message={message} />
      ) : (
        <WorkspaceSkeleton message={message} />
      )}
    </div>
  );
}
