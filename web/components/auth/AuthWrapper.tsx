'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { useAuth } from '@/hooks/useAuth';

import { LoadingScreen } from './LoadingScreen';

export function AuthWrapper({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { error, refreshUser, status } = useAuth();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login');
    }
  }, [router, status]);

  if (status === 'error') {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#222831] px-6 text-center text-[#eeeeee]">
        <div>
          <h1 className="text-lg font-black text-white">Session check failed</h1>
          <p className="mt-2 max-w-sm text-sm text-[#EEEEEE]">
            {error ?? 'Unable to verify your session. Please try again.'}
          </p>
        </div>
        <button
          className="h-10 rounded-[4px] bg-[#FFD369] px-5 text-xs font-black text-[#222831] hover:bg-white"
          onClick={() => void refreshUser()}
          type="button"
        >
          Retry
        </button>
      </main>
    );
  }

  if (status === 'loading') {
    return <LoadingScreen />;
  }

  if (status === 'unauthenticated') {
    return null;
  }

  return children;
}
