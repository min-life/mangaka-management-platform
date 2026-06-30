import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

import MaterialIcon from '@/src/components/shared/MaterialIcon';
import { Colors } from '@/src/constants/colors';

interface ProjectDetailMenuItemProps {
  icon: string;
  iconColor: string;
  iconBg: string;
  label: string;
  subtitle?: string;
  count?: number;
  isLast?: boolean;
  onPress?: () => void;
  trailingIcon?: string;
}

export default function ProjectDetailMenuItem({
  icon,
  iconColor,
  iconBg,
  label,
  subtitle,
  count,
  isLast = false,
  onPress,
  trailingIcon = 'chevron_right',
}: ProjectDetailMenuItemProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${label}${count === undefined ? '' : `, ${count}`}`}
      className="flex-row items-center pl-4"
      style={{ minHeight: 58 }}
    >
      <View
        className="h-10 w-10 items-center justify-center rounded-lg"
        style={{ backgroundColor: iconBg }}
      >
        <MaterialIcon name={icon} color={iconColor} size={22} />
      </View>

      <View
        className="ml-4 flex-1 flex-row items-center py-3"
        style={{
          borderBottomWidth: isLast ? 0 : 1,
          borderBottomColor: Colors.borderFaint,
        }}
      >
        <View className="flex-1 pr-3">
          <Text
            className="text-[15px] font-medium"
            style={{ color: Colors.text }}
            numberOfLines={1}
          >
            {label}
          </Text>
          {subtitle && (
            <Text
              className="mt-0.5 text-[12px]"
              style={{ color: Colors.textMuted }}
              numberOfLines={1}
            >
              {subtitle}
            </Text>
          )}
        </View>

        {count !== undefined && (
          <Text
            className="mr-4 text-[12px]"
            style={{ color: Colors.textMuted, fontFamily: 'monospace' }}
          >
            {count}
          </Text>
        )}
        <View className="mr-4">
          <MaterialIcon name={trailingIcon} color={Colors.textFaint} size={23} />
        </View>
      </View>
    </TouchableOpacity>
  );
}
