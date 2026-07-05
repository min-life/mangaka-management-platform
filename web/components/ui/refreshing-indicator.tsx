import { Loader2 } from 'lucide-react';

export function RefreshingIndicator({ isRefreshing }: { isRefreshing: boolean }) {
  if (!isRefreshing) return null;
  return (
    <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-[#8b94a1] animate-in fade-in duration-200">
      <Loader2 className="size-3 animate-spin text-[#FFD369]" />
      Updating...
    </span>
  );
}
