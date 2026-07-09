import * as WebBrowser from 'expo-web-browser';

import { API_BASE_URL, apiRequest } from './apiClient';
import { saveAccessToken } from './tokenStorage';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
}

export interface RefreshAccessTokenResponse {
  accessToken: string;
}

export interface ForgotPasswordResponse {
  data?: {
    success?: boolean;
  };
}

const GOOGLE_AUTH_PATH = '/auth/google';
const OAUTH_SUCCESS_PATH = '/auth/oauth-success';
const OAUTH_ERROR_PATH = '/auth/oauth-error';

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, '');
}

function getGoogleAuthUrl() {
  return `${API_BASE_URL}${GOOGLE_AUTH_PATH}`;
}

function getAuthWebOrigin() {
  const configuredOrigin =
    process.env.EXPO_PUBLIC_AUTH_WEB_ORIGIN?.trim() || process.env.EXPO_PUBLIC_WEB_ORIGIN?.trim();

  if (configuredOrigin) {
    return trimTrailingSlash(configuredOrigin);
  }

  const apiUrl = new URL(API_BASE_URL);
  apiUrl.pathname = '';
  apiUrl.search = '';
  apiUrl.hash = '';

  if (apiUrl.port === '3000') {
    apiUrl.port = '3001';
  }

  return trimTrailingSlash(apiUrl.toString());
}

function getGoogleOauthErrorMessage(reason: string | null) {
  switch (reason) {
    case 'invalid_state':
      return 'Invalid Google sign-in session. Please try again.';
    case 'invalid_google_account':
      return 'Invalid Google account.';
    case 'email_mismatch':
      return 'The Google email does not match the current account.';
    case 'google_account_already_linked':
      return 'This Google account is already linked.';
    default:
      return 'Unable to sign in with Google. Please try again.';
  }
}

export async function login(payload: LoginPayload): Promise<LoginResponse> {
  const body = await apiRequest<LoginResponse>('/auth/login', {
    body: payload,
    method: 'POST',
  });

  const accessToken = body.accessToken;
  if (!accessToken) {
    throw new Error('Invalid login response.');
  }

  return { accessToken };
}

export async function loginWithGoogle(): Promise<LoginResponse> {
  const authUrl = getGoogleAuthUrl();
  const authWebOrigin = getAuthWebOrigin();

  const result = await WebBrowser.openAuthSessionAsync(authUrl, authWebOrigin, {
    dismissButtonStyle: 'cancel',
    preferEphemeralSession: false,
  });

  if (result.type !== 'success') {
    throw new Error('Google sign-in was cancelled.');
  }

  const redirectUrl = new URL(result.url);

  if (redirectUrl.pathname === OAUTH_ERROR_PATH) {
    throw new Error(getGoogleOauthErrorMessage(redirectUrl.searchParams.get('reason')));
  }

  if (redirectUrl.pathname !== OAUTH_SUCCESS_PATH) {
    throw new Error('Invalid Google sign-in response.');
  }

  const accessToken = redirectUrl.searchParams.get('access_token');
  if (!accessToken) {
    throw new Error('Google sign-in response is missing an access token.');
  }

  return { accessToken };
}

export async function forgotPassword(email: string): Promise<void> {
  await apiRequest<ForgotPasswordResponse>('/auth/forgot', {
    body: { email },
    method: 'POST',
  });
}

export async function refreshAccessToken(): Promise<string> {
  const body = await apiRequest<RefreshAccessTokenResponse>('/auth/refresh', {
    method: 'POST',
    skipAuthRefresh: true,
  });

  const accessToken = body.accessToken;
  if (typeof accessToken !== 'string' || !accessToken.trim()) {
    throw new Error('Invalid refresh session response.');
  }

  await saveAccessToken(accessToken);
  return accessToken;
}

export async function logout(accessToken?: string | null): Promise<void> {
  await apiRequest<void>('/auth/logout', {
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
    method: 'POST',
  });
}
