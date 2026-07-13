import React from 'react';
import { Animated, Image, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BRANDING } from '@/src/constants/branding';
import { Colors } from '@/src/constants/colors';

interface HomeTopBarProps {
  headerBg: Animated.AnimatedInterpolation<string | number>;
}

const BRAND_LOGO = require('../../../../assets/brand/inkly-logo.png');

export default function HomeTopBar({ headerBg }: HomeTopBarProps) {
  return (
    <SafeAreaView edges={['top']} style={{ backgroundColor: Colors.bg }}>
      <Animated.View
        style={{
          backgroundColor: headerBg,
          borderBottomColor: Colors.borderFaint,
          borderBottomWidth: 1,
          height: 56,
        }}
      >
        <View className="h-full flex-row items-center px-4">
          <View className="h-10 w-10 items-center justify-center overflow-hidden rounded-xl">
            <Image
              accessibilityLabel={`${BRANDING.appName} logo`}
              resizeMode="contain"
              source={BRAND_LOGO}
              style={{ height: 34, width: 34 }}
            />
          </View>
          <View className="ml-3 justify-center">
            <Text className="text-[18px] font-black leading-5" style={{ color: Colors.text }}>
              {BRANDING.appName}
            </Text>
            <Text
              className="mt-0.5 text-[10px] font-bold uppercase"
              style={{ color: Colors.textMuted }}
            >
              {BRANDING.subtitle}
            </Text>
          </View>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}
