import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import MaterialIcon from '@/src/components/shared/MaterialIcon';
import { Colors } from '@/src/constants/colors';

interface NotificationsTopBarProps {
  unreadCount: number;
  onMarkAllRead: () => void;
}

export default function NotificationsTopBar({
  unreadCount,
  onMarkAllRead,
}: NotificationsTopBarProps) {
  return (
    <SafeAreaView
      edges={['top']}
      style={{ backgroundColor: Colors.bg, position: 'relative', zIndex: 20 }}
    >
      <View
        className="flex-row justify-between items-center px-4 h-16"
        style={{ borderBottomWidth: 1, borderBottomColor: Colors.borderSubtle }}
      >
        <View className="flex-row items-center gap-3">
          <Text className="text-[32px] font-bold tracking-tight" style={{ color: Colors.text }}>
            Inbox
          </Text>

          {unreadCount > 0 && (
            <View className="px-2 py-0.5 rounded-full" style={{ backgroundColor: Colors.accent }}>
              <Text className="text-[12px] font-bold" style={{ color: Colors.bg }}>
                {unreadCount}
              </Text>
            </View>
          )}
        </View>

        <View className="flex-row items-center gap-1">
          <TouchableOpacity
            activeOpacity={0.7}
            className="w-10 h-10 items-center justify-center rounded-full"
            disabled={unreadCount === 0}
            onPress={onMarkAllRead}
            aria-label="Mark all as read"
          >
            <MaterialIcon
              name="done_all"
              color={unreadCount > 0 ? Colors.text : Colors.textFaint}
              size={22}
            />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
