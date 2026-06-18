import { Platform } from 'react-native';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
}

export interface ForgotPasswordResponse {
  data?: {
    success?: boolean;
  };
}

interface ApiErrorBody {
  message?: string | string[];
}

const DEFAULT_API_BASE_URL =
  Platform.OS === 'android' ? 'http://10.0.2.2:3000/api' : 'http://localhost:3000/api';

const API_BASE_URL = (
  process.env.EXPO_PUBLIC_API_BASE_URL?.trim() || DEFAULT_API_BASE_URL
).replace(/\/+$/, '');

function getApiErrorMessage(status: number, body?: ApiErrorBody): string {
  if (status === 401) {
    return 'Email hoặc mật khẩu không đúng.';
  }

  if (Array.isArray(body?.message) && body.message.length > 0) {
    return body.message[0];
  }

  if (typeof body?.message === 'string' && body.message.length > 0) {
    return body.message;
  }

  if (status >= 500) {
    return 'Máy chủ đang gặp sự cố. Vui lòng thử lại sau.';
  }

  return 'Không thể đăng nhập. Vui lòng kiểm tra lại thông tin.';
}

export async function login(payload: LoginPayload): Promise<LoginResponse> {
  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(payload),
    });
  } catch {
    throw new Error('Không thể kết nối tới API. Vui lòng kiểm tra server hoặc cấu hình URL.');
  }

  let body: ApiErrorBody | LoginResponse | undefined;
  try {
    body = (await response.json()) as ApiErrorBody | LoginResponse;
  } catch {
    body = undefined;
  }

  if (!response.ok) {
    throw new Error(getApiErrorMessage(response.status, body as ApiErrorBody | undefined));
  }

  const accessToken = (body as LoginResponse | undefined)?.accessToken;
  if (!accessToken) {
    throw new Error('Phản hồi đăng nhập không hợp lệ.');
  }

  return { accessToken };
}

export async function forgotPassword(email: string): Promise<void> {
  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}/auth/forgot`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });
  } catch {
    throw new Error('Không thể kết nối tới API. Vui lòng kiểm tra server hoặc cấu hình URL.');
  }

  let body: ApiErrorBody | ForgotPasswordResponse | undefined;
  try {
    body = (await response.json()) as ApiErrorBody | ForgotPasswordResponse;
  } catch {
    body = undefined;
  }

  if (!response.ok) {
    throw new Error(getApiErrorMessage(response.status, body as ApiErrorBody | undefined));
  }
}

export async function logout(accessToken?: string | null): Promise<void> {
  const headers: Record<string, string> = {};

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      headers,
      credentials: 'include',
    });
  } catch {
    throw new Error('Không thể kết nối tới API để đăng xuất.');
  }

  if (!response.ok) {
    throw new Error('Không thể đăng xuất phiên trên máy chủ.');
  }
}
