'use client';

import { Button } from '@/components/ui/button';

const apiBaseUrl = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api').replace(
  /\/$/,
  '',
);

export function SocialLogin() {
  return (
    <>
      <div className="relative flex items-center py-4">
        <div className="h-px flex-1 bg-[#393E46]" />
        <span className="mx-4 text-xs font-black uppercase tracking-[0.05em] text-[#aeb7c2]">
          Or Continue With
        </span>
        <div className="h-px flex-1 bg-[#393E46]" />
      </div>

      <Button
        className="h-12 w-full rounded-[4px] border-[#4A5260] bg-[#393E46] text-[#eeeeee] hover:border-[#FFD369] hover:bg-[#303640]"
        onClick={() => {
          window.location.href = `${apiBaseUrl}/auth/google`;
        }}
        type="button"
        variant="outline"
      >
        <span className="size-4 rounded-full border border-[#EEEEEE] bg-white" />
        Google
      </Button>
    </>
  );
}
