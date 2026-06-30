import { Platform } from 'react-native';

import { clearAccessToken, getAccessToken } from './tokenStorage';

interface ApiErrorBody {
  message?: string | string[];
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  params?: Record<string, boolean | number | string | undefined | null>;
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

function getErrorMessage(status: number, body?: ApiErrorBody) {
  if (status === 401) return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';

  if (Array.isArray(body?.message) && body.message.length > 0) {
    return body.message[0];
  }

  if (typeof body?.message === 'string' && body.message.length > 0) {
    return body.message;
  }

  if (status >= 500) return 'Máy chủ đang gặp sự cố. Vui lòng thử lại sau.';

  return 'Không thể tải dữ liệu. Vui lòng thử lại.';
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const token = await getAccessToken();
  const headers = new Headers(options.headers);

  if (!headers.has('Content-Type') && options.body !== undefined) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  let response: Response;

  try {
    response = await fetch(buildUrl(path, options.params), {
      ...options,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      credentials: 'include',
      headers,
    });
  } catch {
    throw new ApiClientError(
      'Không thể kết nối tới API. Vui lòng kiểm tra server hoặc cấu hình URL.',
      0,
    );
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    body = undefined;
  }

  if (!response.ok) {
    if (response.status === 401) {
      await clearAccessToken();
    }
    throw new ApiClientError(getErrorMessage(response.status, body as ApiErrorBody), response.status);
  }

  return body as T;
}

