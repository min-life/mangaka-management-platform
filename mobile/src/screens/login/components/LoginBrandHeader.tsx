import React from 'react';
import { Animated, Image, Text, View } from 'react-native';

import { Colors } from '@/src/constants/colors';

import { LOGO_URI } from './loginConstants';

interface LoginBrandHeaderProps {
  opacity: Animated.Value;
  translateY: Animated.Value;
}

export default function LoginBrandHeader({ opacity, translateY }: LoginBrandHeaderProps) {
  return (
    <Animated.View
      className="items-center mb-10"
      style={{ opacity, transform: [{ translateY }] }}
    >
      <View
        className="w-16 h-16 rounded-2xl overflow-hidden mb-4 items-center justify-center"
        style={{ backgroundColor: Colors.surface }}
      >
        <Image source={{ uri: LOGO_URI }} className="w-full h-full" resizeMode="cover" />
      </View>

      <Text className="text-[24px] font-bold tracking-tight" style={{ color: Colors.text }}>
        Mangaka Studio
      </Text>
      <Text className="text-[14px] mt-2 text-center" style={{ color: Colors.textMuted }}>
        Professional Manga Workflow Management
      </Text>
    </Animated.View>
  );
}

