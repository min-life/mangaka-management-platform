'use client';

import { useEffect, useState } from 'react';
import { ChevronLeft, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type LoadingStateProps = {
  message?: string;
  minHeight?: string;
  variant?: 'workspace' | 'detail' | 'list';
};

function WorkspaceSkeleton({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[350px] p-8 text-center animate-in fade-in duration-200">
      <div className="relative mb-4">
        <div className="size-10 rounded-full border-2 border-[#FFD369]/20 border-t-[#FFD369] animate-spin" />
      </div>
      <p className="text-xs font-black uppercase tracking-[0.1em] text-white animate-pulse">
        {message}
      </p>
      <p className="text-[10px] font-bold text-[#8b94a1] mt-1">
        Synchronizing studio assets...
      </p>
    </div>
  );
}

function DetailSkeleton({ message }: { message: string }) {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#101820] animate-in fade-in duration-300">
      {/* Header skeleton */}
      <div className="flex shrink-0 items-center justify-between border-b border-[#26303b] bg-[#0d151e] px-5 py-3 lg:px-8">
        <div className="flex flex-col gap-1.5">
          <div className="h-3 w-40 animate-pulse rounded-[3px] bg-[#1f2937]" />
          <div className="h-5 w-64 animate-pulse rounded-[3px] bg-[#26303b]" />
          <div className="h-2.5 w-48 animate-pulse rounded-[3px] bg-[#1f2937] mt-0.5" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-8 w-24 animate-pulse rounded-[4px] bg-[#1f2937]" />
          <div className="h-8 w-32 animate-pulse rounded-[4px] bg-[#FFD369]/10 border border-[#FFD369]/20" />
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Main canvas area */}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Canvas */}
          <div className="flex-1 relative bg-[#091018] flex items-center justify-center overflow-hidden">
            {/* Dot grid background */}
            <div className="absolute inset-0 bg-[radial-gradient(#1f293740_1px,transparent_1px)] [background-size:20px_20px]" />

            {/* Centered loader */}
            <div className="relative z-10 flex flex-col items-center gap-5 text-center">
              <div className="relative">
                <div className="size-14 rounded-full border-2 border-[#FFD369]/15 border-t-[#FFD369] animate-spin" />
                <div className="absolute inset-0 size-14 rounded-full border-2 border-[#FFD369]/5 border-b-[#FFD369]/40 animate-spin [animation-duration:1.5s] [animation-direction:reverse]" />
                <Loader2 className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-5 text-[#FFD369]/70 animate-pulse" />
              </div>
              <div className="space-y-1.5">
                <p className="text-[11px] font-black uppercase tracking-[0.12em] text-white/80">
                  {message}
                </p>
                <p className="text-[10px] font-bold text-[#8b94a1]">
                  Synchronizing file version &amp; layers...
                </p>
              </div>
            </div>
          </div>

          {/* Bottom tabs skeleton */}
          <div className="shrink-0 border-t border-[#26303b] bg-[#0d151e]">
            <div className="flex h-11 items-center gap-1 px-5 lg:px-8">
              {['Overview', 'Discussion', 'Versions', 'Activity'].map((tab) => (
                <div key={tab} className="h-5 w-16 animate-pulse rounded-[3px] bg-[#1f2937] mx-2" />
              ))}
            </div>
          </div>
        </main>

        {/* Right sidebar skeleton */}
        <aside className="hidden lg:flex w-[320px] shrink-0 flex-col border-l border-[#26303b] bg-[#0d151e]">
          <div className="border-b border-[#26303b] px-4 py-3">
            <div className="h-4 w-28 animate-pulse rounded-[3px] bg-[#26303b]" />
          </div>
          <div className="flex-1 overflow-hidden p-4 space-y-3">
            {/* Task cards */}
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-[6px] border border-[#26303b] bg-[#151c25] p-3 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="h-3 w-3/4 animate-pulse rounded-[3px] bg-[#26303b]" />
                  <div className="h-4 w-12 animate-pulse rounded-full bg-[#1f2937] shrink-0" />
                </div>
                <div className="h-2.5 w-1/2 animate-pulse rounded-[3px] bg-[#1f2937]" />
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}

export function LoadingState({
  message = 'Loading workspace...',
  minHeight = '560px',
  variant = 'workspace',
}: LoadingStateProps) {
  const [shouldShow, setShouldShow] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShouldShow(true);
    }, 700);
    return () => clearTimeout(timer);
  }, []);

  if (!shouldShow) {
    return <div style={{ minHeight }} />;
  }

  return (
    <div className="w-full" style={{ minHeight: variant === 'detail' ? undefined : minHeight }}>
      {variant === 'detail' ? (
        <DetailSkeleton message={message} />
      ) : (
        <WorkspaceSkeleton message={message} />
      )}
    </div>
  );
}
