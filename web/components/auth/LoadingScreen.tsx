import { Loader2 } from 'lucide-react';

export function LoadingScreen({ message = 'Loading workspace...' }: { message?: string }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[#222831] text-[#eeeeee]">
      <Loader2 className="size-6 animate-spin text-[#FFD369]" />
      <p className="text-sm font-medium text-[#EEEEEE]">{message}</p>
    </main>
  );
}
