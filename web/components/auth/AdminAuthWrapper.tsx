'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { useAuth } from '@/hooks/useAuth';
import { AuthWrapper } from './AuthWrapper';
import { LoadingScreen } from './LoadingScreen';

function AdminRoleCheck({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, status } = useAuth();

  useEffect(() => {
    if (status === 'authenticated' && user) {
      // Check if user has 'ADMIN' or 'STAFF' role code
      const isAdmin =
        user.roles?.some((role) => role.code === 'ADMIN' || role.code === 'STAFF') || false;

      if (!isAdmin) {
        // Redirect non-admins away from the admin area
        router.replace('/studio');
      }
    }
  }, [router, status, user]);

  if (status === 'authenticated' && user) {
    const isAdmin =
      user.roles?.some((role) => role.code === 'ADMIN' || role.code === 'STAFF') || false;
    if (!isAdmin) {
      return null; // Avoid flashing admin content while redirecting
    }
    return <>{children}</>;
  }

  // Fallback while waiting for AuthWrapper to resolve or redirect
  return <LoadingScreen />;
}

export function AdminAuthWrapper({ children }: { children: React.ReactNode }) {
  return (
    <AuthWrapper>
      <AdminRoleCheck>{children}</AdminRoleCheck>
    </AuthWrapper>
  );
}
