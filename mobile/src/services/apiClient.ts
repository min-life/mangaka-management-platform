import { Platform } from 'react-native';

import { resetToLogin } from '@/src/navigation/navigationRef';

import { clearSession, getAccessToken, saveAccessToken } from './tokenStorage';

interface ApiErrorBody {
  error?: string;
  message?: string | string[];
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  params?: Record<string, boolean | number | string | undefined | null>;
  skipAuthRefresh?: boolean;
}

interface ApiFetchResult {
  body: unknown;
  response: Response;
}

interface RefreshResponse {
  accessToken?: unknown;
}

export class ApiClientError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
  }
}

const DEFAULT_API_BASE_URL =
  Platform.OS === 'android' ? 'http://10.0.2.2:3000/api' : 'http://localhost:3000/api';

const AUTH_REFRESH_PATH = '/auth/refresh';
const AUTH_LOGOUT_PATH = '/auth/logout';
const AUTH_REFRESH_EXCLUDED_PATHS = new Set([
  '/auth/forgot',
  '/auth/login',
  AUTH_LOGOUT_PATH,
  AUTH_REFRESH_PATH,
]);

let refreshPromise: Promise<string> | null = null;
let sessionExpirationPromise: Promise<void> | null = null;

export const API_BASE_URL = (
  process.env.EXPO_PUBLIC_API_BASE_URL?.trim() ||
  process.env.BASE_URL?.trim() ||
  DEFAULT_API_BASE_URL
).replace(/\/+$/, '');

function buildUrl(path: string, params?: RequestOptions['params']) {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const url = new URL(`${API_BASE_URL}${cleanPath}`);

  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value));
    }
  });

  return url.toString();
}

function normalizeApiPath(path: string) {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const withoutTrailingSlash = cleanPath.replace(/\/+$/, '') || '/';

  return withoutTrailingSlash.startsWith('/api/')
    ? withoutTrailingSlash.replace(/^\/api/, '')
    : withoutTrailingSlash;
}

function normalizeMethod(method?: string) {
  return (method ?? 'GET').toUpperCase();
}

function isPostEndpoint(path: string, options: RequestOptions, endpoint: string) {
  return normalizeMethod(options.method) === 'POST' && normalizeApiPath(path) === endpoint;
}

function shouldAttemptRefresh(path: string, options: RequestOptions, hasRetried: boolean) {
  if (hasRetried || options.skipAuthRefresh) return false;
  if (normalizeMethod(options.method) !== 'POST') return true;

  return !AUTH_REFRESH_EXCLUDED_PATHS.has(normalizeApiPath(path));
}

function getErrorMessage(status: number, body?: ApiErrorBody) {
  if (Array.isArray(body?.message) && body.message.length > 0) {
    return body.message[0];
  }

  if (typeof body?.message === 'string' && body.message.length > 0) {
    return body.message;
  }

  if (typeof body?.error === 'string' && body.error.length > 0) {
    return body.error;
  }

  if (status === 401) return 'Your session has expired. Please sign in again.';

  if (status >= 500) return 'The server is unavailable. Please try again later.';

  return 'Unable to load data. Please try again.';
}

async function performApiFetch(
  path: string,
  options: RequestOptions = {},
  accessTokenOverride?: string | null,
): Promise<ApiFetchResult> {
  const token = await getAccessToken();
  const headers = new Headers(options.headers);

  if (!headers.has('Content-Type') && options.body !== undefined) {
    headers.set('Content-Type', 'application/json');
  }

  const accessToken = accessTokenOverride ?? token;
  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  let response: Response;
  const { body: requestBody, params, skipAuthRefresh: _skipAuthRefresh, ...fetchOptions } = options;

  try {
    response = await fetch(buildUrl(path, params), {
      ...fetchOptions,
      body: requestBody === undefined ? undefined : JSON.stringify(requestBody),
      credentials: 'include',
      headers,
    });
  } catch {
    throw new ApiClientError(
      'Unable to connect to the API. Please check the server or API URL.',
      0,
    );
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    body = undefined;
  }

  return { body, response };
}

async function handleSessionExpired() {
  if (!sessionExpirationPromise) {
    sessionExpirationPromise = (async () => {
      try {
        await performApiFetch(AUTH_LOGOUT_PATH, {
          method: 'POST',
          skipAuthRefresh: true,
        });
      } catch {
        // Best-effort logout: local session cleanup and navigation still happen below.
      }

      await clearSession();
      resetToLogin();
    })();
  }

  await sessionExpirationPromise;
}

async function requestFreshAccessToken() {
  const body = await apiRequest<RefreshResponse>(AUTH_REFRESH_PATH, {
    method: 'POST',
    skipAuthRefresh: true,
  });

  const accessToken = body.accessToken;
  if (typeof accessToken !== 'string' || !accessToken.trim()) {
    throw new ApiClientError('Invalid refresh session response.', 401);
  }

  await saveAccessToken(accessToken);
  return accessToken;
}

async function refreshSession() {
  if (!refreshPromise) {
    refreshPromise = requestFreshAccessToken().finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
}

async function requestWithAuth<T>(
  path: string,
  options: RequestOptions,
  hasRetried: boolean,
  accessTokenOverride?: string | null,
): Promise<T> {
  const { body, response } = await performApiFetch(path, options, accessTokenOverride);

  if (response.ok) {
    if (
      isPostEndpoint(path, options, '/auth/login') ||
      isPostEndpoint(path, options, AUTH_REFRESH_PATH)
    ) {
      sessionExpirationPromise = null;
    }

    return body as T;
  }

  if (isPostEndpoint(path, options, AUTH_REFRESH_PATH)) {
    await handleSessionExpired();
  }

  if (response.status === 401 && shouldAttemptRefresh(path, options, hasRetried)) {
    try {
      const refreshedAccessToken = await refreshSession();
      return requestWithAuth<T>(path, options, true, refreshedAccessToken);
    } catch {
      await handleSessionExpired();
      throw new ApiClientError(getErrorMessage(response.status, body as ApiErrorBody), response.status);
    }
  }

  if (response.status === 401 && hasRetried) {
    await handleSessionExpired();
  }

  throw new ApiClientError(getErrorMessage(response.status, body as ApiErrorBody), response.status);
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  return requestWithAuth<T>(path, options, false);
}

