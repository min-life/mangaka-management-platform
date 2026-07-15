'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { useAuth } from '@/hooks/useAuth';
import { setAccessToken } from '@/lib/auth-storage';
import { toast } from '@/lib/toast';

import { LoadingScreen } from '@/components/auth/LoadingScreen';

function isAdminUser(user: ReturnType<typeof useAuth>['user']) {
  return user?.roles?.some((role) => role.code === 'ADMIN' || role.code === 'STAFF') ?? false;
}

function getSafeNextPath(value: string | null) {
  if (!value || !value.startsWith('/') || value.startsWith('//')) {
    return null;
  }

  return value;
}

function getPostLoginPath(user: ReturnType<typeof useAuth>['user'], nextPath: string | null) {
  const isAdmin = isAdminUser(user);

  if (isAdmin) {
    return nextPath?.startsWith('/admin') ? nextPath : '/admin';
  }

  if (nextPath?.startsWith('/admin')) {
    return '/studio';
  }

  return nextPath ?? '/studio';
}

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
      const safeNextPath = getSafeNextPath(searchParams.get('next'));

      router.replace(getPostLoginPath(user, safeNextPath));
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
