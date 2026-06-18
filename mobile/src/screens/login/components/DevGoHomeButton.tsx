import React from 'react';
import { Text, TouchableOpacity } from 'react-native';

import { Colors } from '@/src/constants/colors';

interface DevGoHomeButtonProps {
  onPress: () => void;
}

export default function DevGoHomeButton({ onPress }: DevGoHomeButtonProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={onPress}
      className="mt-4 h-12 rounded-xl items-center justify-center"
      style={{
        backgroundColor: Colors.surfaceContainer,
        borderWidth: 1,
        borderColor: Colors.borderSubtle,
      }}
    >
      <Text className="font-semibold text-[15px]" style={{ color: Colors.text }}>
        Go Home
      </Text>
    </TouchableOpacity>
  );
}

