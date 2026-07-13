'use client';

import { LoaderCircle } from 'lucide-react';

type AdminLoadingOverlayProps = {
  isVisible: boolean;
};

export function AdminLoadingOverlay({ isVisible }: AdminLoadingOverlayProps) {
  if (!isVisible) {
    return null;
  }

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-[#0b1118]/72 backdrop-blur-[2px]">
      <div className="flex h-16 w-16 items-center justify-center rounded-full border border-[#FFD369]/40 bg-[#111a24] shadow-[0_18px_50px_rgba(0,0,0,0.45)]">
        <LoaderCircle className="size-7 animate-spin text-[#FFD369]" />
      </div>
    </div>
  );
}
