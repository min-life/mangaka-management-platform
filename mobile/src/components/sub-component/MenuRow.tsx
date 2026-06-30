import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Colors } from '@/src/constants/colors';
import MaterialIcon from '@/src/components/shared/MaterialIcon';
import { WorkSummaryItem } from '@/src/types/profile';

interface MenuRowProps {
  icon: string;
  label: string;
  badge?: string;
  isLast?: boolean;
  isDestructive?: boolean;
  onPress?: () => void;
}

/**
 * MenuRow — Một hàng menu dùng chung cho cả Work Summary và Account sections.
 */
export default function MenuRow({
  icon,
  label,
  badge,
  isLast,
  isDestructive,
  onPress,
}: MenuRowProps) {
  const labelColor = isDestructive ? '#EF4444' : Colors.text;
  const iconColor  = isDestructive ? '#EF4444' : Colors.textMuted;

  return (
    <>
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={onPress}
        className="flex-row items-center justify-between p-4"
      >
        {/* Left: icon + label */}
        <View className="flex-row items-center gap-3">
          <MaterialIcon name={icon} color={iconColor} size={22} />
          <Text className="text-[16px]" style={{ color: labelColor }}>
            {label}
          </Text>
        </View>

        {/* Right: badge + chevron */}
        <View className="flex-row items-center gap-2">
          {badge && (
            <View
              className="px-2 py-0.5 rounded-full"
              style={{ backgroundColor: Colors.surfaceContainer }}
            >
              <Text className="text-[12px] font-medium" style={{ color: Colors.text }}>
                {badge}
              </Text>
            </View>
          )}
          {!isDestructive && (
            <MaterialIcon name="chevron_right" color={Colors.textMuted} size={18} />
          )}
        </View>
      </TouchableOpacity>

      {/* Divider */}
      {!isLast && (
        <View
          className="mx-4"
          style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.05)' }}
        />
      )}
    </>
  );
}
