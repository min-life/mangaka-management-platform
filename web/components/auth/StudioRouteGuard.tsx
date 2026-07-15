'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';

import { useAuth } from '@/hooks/useAuth';

import { LoadingScreen } from './LoadingScreen';

function isAdminUser(user: ReturnType<typeof useAuth>['user']) {
  return user?.roles?.some((role) => role.code === 'ADMIN' || role.code === 'STAFF') ?? false;
}

export function StudioRouteGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { status, user } = useAuth();
  const shouldBlockStudio =
    status === 'authenticated' && isAdminUser(user) && pathname.startsWith('/studio');

  useEffect(() => {
    if (shouldBlockStudio) {
      router.replace('/admin');
    }
  }, [router, shouldBlockStudio]);

  if (shouldBlockStudio) {
    return <LoadingScreen />;
  }

  return children;
}
