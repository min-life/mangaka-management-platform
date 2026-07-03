import { CommonActions, createNavigationContainerRef } from '@react-navigation/native';

import { RootStackParamList } from './types';

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

let pendingLoginReset = false;

export function resetToLogin() {
  if (!navigationRef.isReady()) {
    pendingLoginReset = true;
    return;
  }

  pendingLoginReset = false;
  navigationRef.dispatch(
    CommonActions.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    }),
  );
}

export function flushPendingNavigationReset() {
  if (pendingLoginReset) {
    resetToLogin();
  }
}
