import React from 'react';
import { Text, View } from 'react-native';

import { Colors } from '@/src/constants/colors';

export default function NotificationsEmptyState() {
  return (
    <View className="flex-1 items-center justify-center gap-3">
      <Text style={{ fontSize: 48 }}>🔔</Text>
      <Text className="text-[18px] font-semibold" style={{ color: Colors.textMuted }}>
        No notifications
      </Text>
      <Text
        className="text-[14px] text-center"
        style={{ color: Colors.textFaint, maxWidth: 240 }}
      >
        You're all caught up! Check back later.
      </Text>
    </View>
  );
}

