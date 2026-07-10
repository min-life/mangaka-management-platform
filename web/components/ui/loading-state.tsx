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
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col gap-2 border-b border-[#26303b] pb-4">
        <div className="flex items-center gap-2 text-xs font-bold text-[#8b94a1]">
          <span className="inline-flex items-center gap-1 hover:text-white transition-colors cursor-default">
            <ChevronLeft className="size-3.5" /> Back to Files
          </span>
          <span>·</span>
          <span>Studio</span>
          <span>/</span>
          <span>Projects</span>
          <span>/</span>
          <span className="text-[#FFD369]">Workspace</span>
        </div>
        <div className="flex items-center justify-between gap-4 mt-1">
          <div>
            <h1 className="text-xl font-black text-white tracking-wide">Loading File...</h1>
            <p className="text-xs font-bold text-[#8b94a1] mt-1">Preparing drawing canvas and syncing workspace details</p>
          </div>
          <div className="flex gap-2">
            <div className="h-8 w-24 rounded bg-[#1f2937]/50 border border-[#303842] flex items-center justify-center text-[10px] text-[#8b94a1] font-bold">
              History
            </div>
            <div className="h-8 w-24 rounded bg-[#FFD369]/10 border border-[#FFD369]/20 flex items-center justify-center text-[10px] text-[#FFD369] font-black uppercase">
              Current Version
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-[8px] border border-[#26303b] bg-[#0c1219]/60 backdrop-blur-sm">
        <div className="flex h-11 items-center justify-between border-b border-[#26303b] bg-[#151c25]/30 px-4">
          <div className="flex items-center gap-2 text-xs font-bold text-[#8b94a1]">
            <span>Canvas View</span>
          </div>
        </div>
        <div className="p-8 flex flex-col items-center justify-center min-h-[420px] relative">
          <div className="flex flex-col items-center gap-4 text-center z-10">
            <div className="relative">
              <div className="size-12 rounded-full border-2 border-[#FFD369]/20 border-t-[#FFD369] animate-spin" />
              <Loader2 className="size-5 text-[#FFD369] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-black uppercase tracking-[0.1em] text-white animate-pulse">
                {message}
              </p>
              <p className="text-[10px] font-bold text-[#8b94a1]">
                Synchronizing file version & layers...
              </p>
            </div>
          </div>
          <div className="absolute inset-0 bg-[radial-gradient(#1f2937_1px,transparent_1px)] [background-size:16px_16px] opacity-25" />
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
    <div className="w-full px-0 py-1" style={{ minHeight }}>
      {variant === 'detail' ? (
        <DetailSkeleton message={message} />
      ) : (
        <WorkspaceSkeleton message={message} />
      )}
    </div>
  );
}
