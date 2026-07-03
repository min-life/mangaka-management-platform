'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

import { useAuth } from '@/hooks/useAuth';
import { setAccessToken } from '@/lib/auth-storage';

function LoadingState() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#131313] text-[#e2e2e2]">
      <Loader2 className="size-6 animate-spin text-[#c6c6c6]" />
    </main>
  );
}

function OAuthSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshUser } = useAuth();

  useEffect(() => {
    let isMounted = true;

    const accessToken = searchParams.get('access_token');
    const nextPath = searchParams.get('next') ?? '/studio';
    const safeNextPath = nextPath.startsWith('/') ? nextPath : '/studio';

    if (!accessToken) {
      router.replace('/login?error=oauth_failed');
      return;
    }

    setAccessToken(accessToken);
    void refreshUser().finally(() => {
      if (isMounted) {
        router.replace(safeNextPath);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [refreshUser, router, searchParams]);

  return <LoadingState />;
}

export default function OAuthSuccessPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <OAuthSuccessContent />
    </Suspense>
  );
}
