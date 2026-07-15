'use client';

import axios from 'axios';
import { createContext, useCallback, useEffect, useMemo, useState } from 'react';

import api from '@/lib/api';
import { clearAccessToken, getAccessToken, setAccessToken } from '@/lib/auth-storage';
import { logout as logoutRequest } from '@/services/auth.service';
import {
  AUTH_LOGOUT_EVENT,
  type AuthContextType,
  type AuthStatus,
  type AuthUser,
} from '@/types/auth';

type RefreshResponse = {
  accessToken?: string;
  access_token?: string;
  data?: {
    accessToken?: string;
    access_token?: string;
  };
};

type RefreshResult =
  | {
      status: 'refreshed';
    }
  | {
      status: 'unauthenticated';
    }
  | {
      status: 'error';
      message: string;
    };

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

function getRefreshAccessToken(response: RefreshResponse) {
  return (
    response.accessToken ??
    response.access_token ??
    response.data?.accessToken ??
    response.data?.access_token
  );
}

async function refreshAccessTokenFromCookie(): Promise<RefreshResult> {
  try {
    const response = await api.post<RefreshResponse, RefreshResponse>('/auth/refresh', {});
    const accessToken = getRefreshAccessToken(response);

    if (!accessToken) {
      clearAccessToken();
      return { status: 'unauthenticated' };
    }

    setAccessToken(accessToken);
    return { status: 'refreshed' };
  } catch (refreshError) {
    if (axios.isAxiosError(refreshError) && refreshError.response?.status === 401) {
      clearAccessToken();
      return { status: 'unauthenticated' };
    }

    return {
      status: 'error',
      message: 'Unable to restore your session. Please try again.',
    };
  }
}

async function checkCurrentUser(): Promise<AuthCheckResult> {
  if (!getAccessToken()) {
    const refreshResult = await refreshAccessTokenFromCookie();

    if (refreshResult.status === 'unauthenticated') {
      return { status: 'unauthenticated' };
    }

    if (refreshResult.status === 'error') {
      return refreshResult;
    }
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
