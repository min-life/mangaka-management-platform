import React from 'react';
import { Image, Text, View } from 'react-native';

import { Colors } from '@/src/constants/colors';

import { BRANDING } from '@/src/constants/branding';

export default function LoginBrandHeader() {
  const BRAND_LOGO = require('../../../../assets/brand/inkly-logo.png');

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
        <Image
          accessibilityLabel={`${BRANDING.appName} logo`}
          resizeMode="contain"
          source={BRAND_LOGO}
          style={{ height: 34, width: 34 }}
        />
      </View>

      <Text className="mt-4 text-center text-[24px] font-bold" style={{ color: Colors.text }}>
        {BRANDING.appName}
      </Text>
      <Text className="mt-2 text-center text-[14px]" style={{ color: Colors.textMuted }}>
        Sign in to continue
      </Text>
    </View>
  );
}
