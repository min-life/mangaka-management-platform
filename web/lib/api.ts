import axios from 'axios';

import { clearAccessToken, getAccessToken, setAccessToken } from '@/lib/auth-storage';
import { AUTH_LOGOUT_EVENT } from '@/types/auth';

type RefreshResponse = {
  accessToken?: string;
  access_token?: string;
  data?: {
    accessToken?: string;
    access_token?: string;
  };
};

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

api.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

let refreshPromise: Promise<string> | null = null;

api.interceptors.response.use(
  (response) => response?.data,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        if (!refreshPromise) {
          refreshPromise = axios
            .post(
              `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api'}/auth/refresh`,
              {},
              { withCredentials: true },
            )
            .then((res) => {
              const nextToken =
                res.data.accessToken ??
                res.data.access_token ??
                res.data.data?.accessToken ??
                res.data.data?.access_token;

              if (!nextToken) {
                throw new Error('Refresh response did not include an access token.');
              }

              return nextToken;
            })
            .finally(() => {
              refreshPromise = null;
            });
        }
        const accessToken = await refreshPromise;
        setAccessToken(accessToken);
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (rfError) {
        if (typeof window !== 'undefined') {
          clearAccessToken();
          window.dispatchEvent(new CustomEvent(AUTH_LOGOUT_EVENT));
        }
        return Promise.reject(rfError);
      }
    }

    return Promise.reject(error);
  },
);

export default api;
