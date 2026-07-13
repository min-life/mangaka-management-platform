'use client';

import axios from 'axios';
import { createContext, useCallback, useEffect, useMemo, useState } from 'react';

import api from '@/lib/api';
import { clearAccessToken, getAccessToken } from '@/lib/auth-storage';
import { logout as logoutRequest } from '@/services/auth.service';
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
  if (!getAccessToken()) {
    return { status: 'unauthenticated' };
  }

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

  const applyLoggedOutState = useCallback(() => {
    clearAccessToken();
    setUser(null);
    setError(null);
    setStatus('unauthenticated');
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutRequest();
    } catch (logoutError) {
      console.error('Logout request failed:', logoutError);
    } finally {
      applyLoggedOutState();
    }
  }, [applyLoggedOutState]);

  const fetchCurrentUser = useCallback(async () => {
    applyAuthResult(await checkCurrentUser());
  }, [applyAuthResult]);

  const refreshUser = useCallback(async () => {
    setStatus('loading');
    setError(null);
    await fetchCurrentUser();
  }, [fetchCurrentUser]);

  const updateUser = useCallback((patch: Partial<AuthUser>) => {
    setUser((current) => (current ? { ...current, ...patch } : current));
  }, []);

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
    const handleLogoutEvent = () => {
      void logout();
    };

    window.addEventListener(AUTH_LOGOUT_EVENT, handleLogoutEvent);

    return () => {
      window.removeEventListener(AUTH_LOGOUT_EVENT, handleLogoutEvent);
    };
  }, [logout]);

  const value = useMemo(
    () => ({
      user,
      status,
      error,
      refreshUser,
      updateUser,
      logout,
    }),
    [error, logout, refreshUser, status, updateUser, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
