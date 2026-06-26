'use client';

import { Eye, History } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

import type { FileVersionItem } from '../file-ui';

type VersionHistoryDrawerProps = {
  onOpenChange: (open: boolean) => void;
  onViewVersion: (version: FileVersionItem) => void;
  open: boolean;
  versions: FileVersionItem[];
};

export function VersionHistoryDrawer({
  onOpenChange,
  onViewVersion,
  open,
  versions,
}: VersionHistoryDrawerProps) {
  return (
    <Sheet onOpenChange={onOpenChange} open={open}>
      <SheetContent
        className="w-[430px] max-w-[94vw] gap-0 border-[#39424f] bg-[#101820] p-0 text-white sm:max-w-[430px]"
        side="right"
      >
        <SheetHeader className="border-b border-[#303842] px-5 py-5 pr-12">
          <SheetTitle className="flex items-center gap-2 text-lg font-black text-white">
            <History className="size-5 text-[#FFD369]" />
            Version History *
          </SheetTitle>
          <SheetDescription className="text-xs font-bold text-[#aeb7c2]">
            View immutable snapshots of this production file.
          </SheetDescription>
        </SheetHeader>

        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          <div className="space-y-3">
            {versions.map((version) => (
              <article
                className="rounded-[4px] border border-[#303842] bg-[#151c25] p-4"
                key={version.id}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-black text-white">v{version.version}</p>
                      {version.isCurrent ? (
                        <Badge className="rounded-[3px] border border-[#315846] bg-[#14291f] text-[#9df2c7]">
                          Current
                        </Badge>
                      ) : null}
                    </div>
                    <p className="mt-2 text-xs font-bold text-[#dce7f3]">{version.note}</p>
                    <p className="mt-2 text-[10px] font-bold text-[#8b94a1]">
                      {version.author} · {version.createdAt}
                    </p>
                  </div>
                  <Button
                    className="size-8 shrink-0 rounded-[4px] border-[#4b535f] bg-[#101820] text-white hover:bg-[#303842]"
                    onClick={() => {
                      onViewVersion(version);
                      onOpenChange(false);
                    }}
                    size="icon"
                    variant="outline"
                  >
                    <Eye className="size-4" />
                  </Button>
                </div>
              </article>
            ))}
          </div>
          <p className="mt-4 text-[11px] font-bold leading-5 text-[#8b94a1]">
            * Version data is UI fallback. Restore is intentionally unavailable until backend
            version transactions exist.
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
