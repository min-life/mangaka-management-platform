import React from 'react';
import { Animated, Image, Text, View } from 'react-native';

import MaterialIcon from '@/src/components/shared/MaterialIcon';
import { Colors } from '@/src/constants/colors';

import { LOGO_URI } from './loginConstants';

interface LoginBrandHeaderProps {
  opacity: Animated.Value;
  translateY: Animated.Value;
}

export default function LoginBrandHeader({ opacity, translateY }: LoginBrandHeaderProps) {
  return (
    <Animated.View className="pt-2" style={{ opacity, transform: [{ translateY }] }}>
      <View className="flex-row items-center justify-between">
        <View
          className="h-14 w-14 items-center justify-center overflow-hidden rounded-2xl"
          style={{
            backgroundColor: Colors.surface,
            borderColor: Colors.borderFaint,
            borderWidth: 1,
          }}
        >
          <Image source={{ uri: LOGO_URI }} className="h-full w-full" resizeMode="cover" />
        </View>

        <View
          className="flex-row items-center rounded-full px-3 py-2"
          style={{
            backgroundColor: Colors.overlayLight,
            borderColor: Colors.borderFaint,
            borderWidth: 1,
          }}
        >
          <MaterialIcon name="security" color={Colors.statusDone} size={16} />
          <Text className="ml-1.5 text-[12px] font-semibold" style={{ color: Colors.text }}>
            Secure studio
          </Text>
        </View>
      </View>

      <Text className="mt-8 text-[34px] font-bold leading-[40px]" style={{ color: Colors.text }}>
        Welcome back to{'\n'}Mangaka Studio
      </Text>
      <Text className="mt-4 text-[15px] leading-6" style={{ color: Colors.textMuted }}>
        Review pages, manage assignments, and keep production moving from one workspace.
      </Text>

      <View className="mt-7 flex-row gap-3">
        <View
          className="flex-1 rounded-2xl px-4 py-3"
          style={{
            backgroundColor: Colors.surface,
            borderColor: Colors.borderSubtle,
            borderWidth: 1,
          }}
        >
          <Text className="text-[20px] font-bold" style={{ color: Colors.accent }}>
            24
          </Text>
          <Text className="mt-1 text-[12px]" style={{ color: Colors.textMuted }}>
            active frames
          </Text>
        </View>
        <View
          className="flex-1 rounded-2xl px-4 py-3"
          style={{
            backgroundColor: Colors.surface,
            borderColor: Colors.borderSubtle,
            borderWidth: 1,
          }}
        >
          <Text className="text-[20px] font-bold" style={{ color: Colors.statusDone }}>
            8
          </Text>
          <Text className="mt-1 text-[12px]" style={{ color: Colors.textMuted }}>
            reviews today
          </Text>
        </View>
      </View>
    </Animated.View>
  );
}
