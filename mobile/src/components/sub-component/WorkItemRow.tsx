import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import MaterialIcon from '@/src/components/shared/MaterialIcon';
import { Colors } from '@/src/constants/colors';
import { WorkItem } from '@/src/types/home';

interface WorkItemRowProps {
  item: WorkItem;
  isLast: boolean;
  onPress?: () => void;
}

/**
 * WorkItemRow — Một hàng trong bento card "My Work" ở Home.
 * Hiển thị icon, label, badge (tuỳ chọn) và mũi tên nếu có onPress.
 */
export default function WorkItemRow({ item, isLast, onPress }: WorkItemRowProps) {
  return (
    <>
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={onPress}
        className="flex-row items-center gap-4 px-4 py-[18px]"
        style={{ backgroundColor: Colors.surface }}
      >
        {/* Icon box */}
        <View
          className="w-10 h-10 rounded-lg items-center justify-center"
          style={{ backgroundColor: Colors.iconBg }}
        >
          <MaterialIcon name={item.icon} color={item.iconColor} size={20} />
        </View>

        {/* Label */}
        <Text className="flex-1 font-medium text-[15px]" style={{ color: Colors.text }}>
          {item.label}
        </Text>

        {/* Badge */}
        {item.badge && (
          <View
            className="px-2 py-0.5 rounded-full"
            style={{ backgroundColor: Colors.overlayLight }}
          >
            <Text
              className="text-[12px]"
              style={{ color: Colors.textMuted, fontFamily: 'monospace' }}
            >
              {item.badge}
            </Text>
          </View>
        )}

        {/* Arrow khi có onPress */}
        {onPress && (
          <MaterialIcon name="arrow_forward" color={Colors.textFaint} size={16} />
        )}
      </TouchableOpacity>

      {/* Divider */}
      {!isLast && (
        <View
          className="mx-4"
          style={{ height: 1, backgroundColor: Colors.borderSubtle }}
        />
      )}
    </>
  );
}
