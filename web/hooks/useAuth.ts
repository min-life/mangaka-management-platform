'use client';

import { useContext } from 'react';

import { AuthContext } from '@/components/auth/AuthProvider';

export function useAuth() {
  // Hook này giúp component con đọc user/status/logout mà không cần tự gọi API.
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider.');
  }

  return context;
}
