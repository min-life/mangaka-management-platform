'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { getGoogleAuthUrl } from '@/services/auth.service';

export function SocialLogin() {
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setError(null);
    setIsRedirecting(true);

    try {
      const url = await getGoogleAuthUrl();
      window.location.href = url;
    } catch {
      setError('Unable to start Google sign-in. Please try again.');
      setIsRedirecting(false);
    }
  };

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
        disabled={isRedirecting}
        onClick={() => void handleGoogleLogin()}
        type="button"
        variant="outline"
      >
        {isRedirecting ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <span className="size-4 rounded-full border border-[#EEEEEE] bg-white" />
        )}
        Google
      </Button>

      {error ? <p className="mt-2 text-center text-xs font-bold text-red-400">{error}</p> : null}
    </>
  );
}
