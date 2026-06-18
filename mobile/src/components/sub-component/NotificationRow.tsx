import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Colors } from '@/src/constants/colors';
import MaterialIcon from '@/src/components/shared/MaterialIcon';
import { NotificationItem } from '@/src/types/notifications';

interface NotificationRowProps {
  item: NotificationItem;
  onPress?: () => void;
}

/**
 * NotificationRow — Một hàng notification trong Classic List.
 * Hiển thị: icon avatar, project label + unread dot, title, subtitle, time + chevron.
 * Unread items có độ sáng cao hơn và dấu chấm màu vàng.
 */
export default function NotificationRow({ item, onPress }: NotificationRowProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      className="flex-row items-start gap-3 px-4 py-4"
      style={{
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
        opacity: item.isUnread ? 1 : 0.75,
      }}
    >
      {/* Icon avatar */}
      <View
        className="w-10 h-10 rounded-full items-center justify-center shrink-0"
        style={{
          backgroundColor: item.isUnread
            ? 'rgba(255,211,105,0.15)'
            : Colors.surface,
          borderWidth: item.isUnread ? 1 : 0,
          borderColor: 'rgba(255,211,105,0.3)',
        }}
      >
        <MaterialIcon
          name={item.icon}
          color={item.isUnread ? Colors.accent : Colors.textMuted}
          size={20}
        />
      </View>

      {/* Content */}
      <View className="flex-1 gap-1" style={{ minWidth: 0 }}>
        {/* Project label + unread dot */}
        <View className="flex-row items-center gap-2">
          <Text className="text-[12px]" style={{ color: Colors.textMuted }}>
            {item.project}
          </Text>
          {item.isUnread && (
            <View
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: Colors.accent }}
            />
          )}
        </View>

        {/* Title */}
        <Text
          className="text-[16px] font-medium"
          style={{ color: Colors.text }}
          numberOfLines={1}
        >
          {item.title}
        </Text>

        {/* Subtitle */}
        <Text
          className="text-[14px]"
          style={{ color: Colors.textMuted }}
          numberOfLines={2}
        >
          {item.subtitle}
        </Text>
      </View>

      {/* Time + chevron */}
      <View className="items-end gap-1 shrink-0">
        <Text className="text-[12px]" style={{ color: Colors.textFaint }}>
          {item.time}
        </Text>
        <MaterialIcon
          name="chevron_right"
          color={Colors.textFaint}
          size={20}
        />
      </View>
    </TouchableOpacity>
  );
}
