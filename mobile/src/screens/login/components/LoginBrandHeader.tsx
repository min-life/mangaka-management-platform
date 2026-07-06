import React from 'react';
import { Image, Text, View } from 'react-native';

import { Colors } from '@/src/constants/colors';

import { LOGO_URI } from './loginConstants';

export default function LoginBrandHeader() {
  return (
    <View className="items-center">
      <View
        className="h-16 w-16 items-center justify-center overflow-hidden rounded-xl"
        style={{
          backgroundColor: Colors.surface,
          borderColor: Colors.borderFaint,
          borderWidth: 1,
        }}
      >
        <Image source={{ uri: LOGO_URI }} className="h-full w-full" resizeMode="cover" />
      </View>

      <Text className="mt-4 text-center text-[24px] font-bold" style={{ color: Colors.text }}>
        Mangaka Studio
      </Text>
      <Text className="mt-2 text-center text-[14px]" style={{ color: Colors.textMuted }}>
        Sign in to continue
      </Text>
    </View>
  );
}
