'use client';

import axios from 'axios';
import { createContext, useCallback, useEffect, useMemo, useState } from 'react';

import api from '@/lib/api';
import { clearAccessToken } from '@/lib/auth-storage';
import { AUTH_LOGOUT_EVENT, type AuthContextType, type AuthStatus, type AuthUser } from '@/types/auth';

type UserMeResponse = {
  data?: AuthUser;
} & Partial<AuthUser>;

type AuthCheckResult =
  | {
      status: 'authenticated';
      user: AuthUser;
    }
  | {
      status: 'unauthenticated';
    }
  | {
      status: 'error';
      message: string;
    };

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

function normalizeUser(response: UserMeResponse): AuthUser {
  return response.data ?? (response as AuthUser);
}

async function checkCurrentUser(): Promise<AuthCheckResult> {
  try {
    const response = await api.get<UserMeResponse, UserMeResponse>('/users/me');

    return {
      status: 'authenticated',
      user: normalizeUser(response),
    };
  } catch (authError) {
    if (axios.isAxiosError(authError) && authError.response?.status === 401) {
      clearAccessToken();
      return { status: 'unauthenticated' };
    }

    return {
      status: 'error',
      message: 'Unable to verify your session. Please try again.',
    };
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [error, setError] = useState<string | null>(null);

  const applyAuthResult = useCallback((result: AuthCheckResult) => {
    if (result.status === 'authenticated') {
      setUser(result.user);
      setError(null);
      setStatus('authenticated');
      return;
    }

    if (result.status === 'unauthenticated') {
      setUser(null);
      setError(null);
      setStatus('unauthenticated');
      return;
    }

    setUser(null);
    setError(result.message);
    setStatus('error');
  }, []);

  const logout = useCallback(() => {
    clearAccessToken();
    setUser(null);
    setError(null);
    setStatus('unauthenticated');
  }, []);

  const fetchCurrentUser = useCallback(async () => {
    applyAuthResult(await checkCurrentUser());
  }, [applyAuthResult]);

  const refreshUser = useCallback(async () => {
    setStatus('loading');
    setError(null);
    await fetchCurrentUser();
  }, [fetchCurrentUser]);

  useEffect(() => {
    let isMounted = true;
    void checkCurrentUser().then((result) => {
      if (isMounted) {
        applyAuthResult(result);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [applyAuthResult]);

  useEffect(() => {
    window.addEventListener(AUTH_LOGOUT_EVENT, logout);

    return () => {
      window.removeEventListener(AUTH_LOGOUT_EVENT, logout);
    };
  }, [logout]);

  const value = useMemo(
    () => ({
      user,
      status,
      error,
      refreshUser,
      logout,
    }),
    [error, logout, refreshUser, status, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
