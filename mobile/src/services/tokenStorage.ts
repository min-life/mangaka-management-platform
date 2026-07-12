import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ACCESS_TOKEN_KEY = 'mangaka.accessToken';
const REFRESH_TOKEN_KEY = 'mangaka.refreshToken';

async function saveToken(key: string, token: string): Promise<void> {
  if (Platform.OS === 'web') {
    window.localStorage.setItem(key, token);
    return;
  }

  await AsyncStorage.setItem(key, token);
}

async function getToken(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    return window.localStorage.getItem(key);
  }

  return AsyncStorage.getItem(key);
}

async function clearToken(key: string): Promise<void> {
  if (Platform.OS === 'web') {
    window.localStorage.removeItem(key);
    return;
  }

  await AsyncStorage.removeItem(key);
}

export async function saveAccessToken(token: string): Promise<void> {
  await saveToken(ACCESS_TOKEN_KEY, token);
}

export async function saveRefreshToken(token?: string | null): Promise<void> {
  if (!token?.trim()) {
    await clearToken(REFRESH_TOKEN_KEY);
    return;
  }

  await saveToken(REFRESH_TOKEN_KEY, token);
}

export async function saveSession(accessToken: string, refreshToken?: string | null): Promise<void> {
  await saveAccessToken(accessToken);
  await saveRefreshToken(refreshToken);
}

export async function getAccessToken(): Promise<string | null> {
  return getToken(ACCESS_TOKEN_KEY);
}

export async function getRefreshToken(): Promise<string | null> {
  return getToken(REFRESH_TOKEN_KEY);
}

export async function clearAccessToken(): Promise<void> {
  await clearToken(ACCESS_TOKEN_KEY);
}

export async function clearRefreshToken(): Promise<void> {
  await clearToken(REFRESH_TOKEN_KEY);
}

export async function clearSession(): Promise<void> {
  await Promise.all([clearAccessToken(), clearRefreshToken()]);
}
