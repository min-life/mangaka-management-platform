import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

import MaterialIcon from '@/src/components/shared/MaterialIcon';
import { Colors } from '@/src/constants/colors';

interface DevGoHomeButtonProps {
  onPress: () => void;
}

export default function DevGoHomeButton({ onPress }: DevGoHomeButtonProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={onPress}
      accessibilityRole="button"
      className="mt-4 h-12 items-center justify-center rounded-xl"
      style={{
        backgroundColor: 'rgba(237,241,251,0.06)',
        borderWidth: 1,
        borderColor: Colors.borderSubtle,
      }}
    >
      <View className="flex-row items-center gap-2">
        <MaterialIcon name="home" color={Colors.textMuted} size={18} />
        <Text className="font-semibold text-[14px]" style={{ color: Colors.textMuted }}>
          Preview home
        </Text>
      </View>
    </TouchableOpacity>
  );
}
