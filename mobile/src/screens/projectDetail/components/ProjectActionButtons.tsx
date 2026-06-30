import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

import MaterialIcon from '@/src/components/shared/MaterialIcon';
import { Colors } from '@/src/constants/colors';

export default function ProjectActionButtons() {
  return (
    <View className="flex-row gap-3 px-4 pb-5">
      <TouchableOpacity
        activeOpacity={0.75}
        accessibilityRole="button"
        accessibilityLabel="Star project"
        className="h-12 flex-1 flex-row items-center justify-center rounded-md"
        style={{ backgroundColor: Colors.surface }}
      >
        <MaterialIcon name="star" color={Colors.textMuted} size={21} />
        <Text className="ml-2 text-[15px] font-medium" style={{ color: Colors.text }}>
          Star
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        activeOpacity={0.75}
        accessibilityRole="button"
        accessibilityLabel="Fork project"
        className="h-12 w-14 items-center justify-center rounded-md"
        style={{ backgroundColor: Colors.surface }}
      >
        <MaterialIcon name="fork" color={Colors.textMuted} size={21} />
      </TouchableOpacity>

      <TouchableOpacity
        activeOpacity={0.75}
        accessibilityRole="button"
        accessibilityLabel="Watch project"
        className="h-12 w-14 items-center justify-center rounded-md"
        style={{ backgroundColor: Colors.surface }}
      >
        <MaterialIcon name="bell" color={Colors.textMuted} size={21} />
      </TouchableOpacity>
    </View>
  );
}
