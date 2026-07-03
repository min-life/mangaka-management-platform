import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ACCESS_TOKEN_KEY = 'mangaka.accessToken';

export async function saveAccessToken(token: string): Promise<void> {
  if (Platform.OS === 'web') {
    window.localStorage.setItem(ACCESS_TOKEN_KEY, token);
    return;
  }

  await AsyncStorage.setItem(ACCESS_TOKEN_KEY, token);
}

export async function getAccessToken(): Promise<string | null> {
  if (Platform.OS === 'web') {
    return window.localStorage.getItem(ACCESS_TOKEN_KEY);
  }

  return AsyncStorage.getItem(ACCESS_TOKEN_KEY);
}

export async function clearAccessToken(): Promise<void> {
  if (Platform.OS === 'web') {
    window.localStorage.removeItem(ACCESS_TOKEN_KEY);
    return;
  }

  await AsyncStorage.removeItem(ACCESS_TOKEN_KEY);
}

export async function clearSession(): Promise<void> {
  await clearAccessToken();
}
