import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import MaterialIcon from '@/src/components/shared/MaterialIcon';
import { Colors } from '@/src/constants/colors';
import { ActivityItem } from '@/src/types/home';

interface ActivityRowProps {
  item: ActivityItem;
  onPress?: () => void;
}

/**
 * ActivityRow — Một dòng trong feed "Today" ở Home.
 * Hiển thị icon màu status, đường dọc nối (nếu không phải cuối), tiêu đề, mô tả và thời gian.
 */
export default function ActivityRow({ item, onPress }: ActivityRowProps) {
  const content = (
    <>
      <View className="items-center">
        <View
          className="w-8 h-8 rounded-full items-center justify-center"
          style={{ backgroundColor: item.bgColor }}
        >
          <MaterialIcon name={item.icon} color={item.iconColor} size={16} />
        </View>
        {item.hasLine && (
          <View
            className="flex-1 mt-2"
            style={{ width: 1, backgroundColor: Colors.borderFaint }}
          />
        )}
      </View>

      <View className="pb-2 flex-1">
        <Text className="text-[15px]" style={{ color: Colors.text }}>
          {item.title}
        </Text>
        <Text className="text-[14px] mt-0.5" style={{ color: Colors.textMuted }}>
          {item.subtitle}
        </Text>
        <Text className="text-[12px] mt-1" style={{ color: Colors.textFaint }}>
          {item.time}
        </Text>
      </View>
    </>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        activeOpacity={0.76}
        accessibilityRole="button"
        className="flex-row gap-4"
        onPress={onPress}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return (
    <View className="flex-row gap-4">
      {content}
    </View>
  );
}
