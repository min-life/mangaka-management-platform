import React from 'react';
import { RefreshControl } from 'react-native';

import { Colors } from '@/src/constants/colors';

interface AppRefreshControlProps {
  onRefresh: () => void;
  refreshing: boolean;
}

export default function AppRefreshControl({
  onRefresh,
  refreshing,
}: AppRefreshControlProps) {
  return (
    <RefreshControl
      colors={[Colors.accent]}
      onRefresh={onRefresh}
      progressBackgroundColor={Colors.surface}
      refreshing={refreshing}
      tintColor={Colors.accent}
    />
  );
}
