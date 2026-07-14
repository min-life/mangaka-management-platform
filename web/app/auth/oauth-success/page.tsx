'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

import { useAuth } from '@/hooks/useAuth';
import { setAccessToken } from '@/lib/auth-storage';
import { toast } from '@/lib/toast';

import { LoadingScreen } from '@/components/auth/LoadingScreen';

function OAuthSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshUser, status, user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const accessToken = searchParams.get('access_token');
    const linked = searchParams.get('linked');

    if (linked === 'google') {
      toast.success('Google account linked successfully');
      void refreshUser().finally(() => {
        if (isMounted) {
          router.replace('/user-profile');
        }
      });
      return () => {
        isMounted = false;
      };
    }

    if (!accessToken) {
      router.replace('/login?error=oauth_failed');
      return;
    }

    setAccessToken(accessToken);
    void refreshUser().finally(() => {
      if (!isMounted) return;
      setIsProcessing(false);
    });

    return () => {
      isMounted = false;
    };
  }, [refreshUser, router, searchParams]);

  useEffect(() => {
    if (!isProcessing && status === 'authenticated' && user) {
      const nextPath = searchParams.get('next') ?? '/studio';
      const safeNextPath = nextPath.startsWith('/') ? nextPath : '/studio';
      
      const isAdmin = user.roles?.some(r => r.code === 'ADMIN' || r.code === 'STAFF') || false;
      if (isAdmin && safeNextPath === '/studio') {
        router.replace('/admin');
      } else {
        router.replace(safeNextPath);
      }
    }
  }, [isProcessing, status, user, router, searchParams]);

  return <LoadingScreen />;
}

export default function OAuthSuccessPage() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <OAuthSuccessContent />
    </Suspense>
  );
}
