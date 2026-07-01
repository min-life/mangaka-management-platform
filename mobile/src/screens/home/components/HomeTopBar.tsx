import React from 'react';
import { Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors } from '@/src/constants/colors';

interface HomeTopBarProps {
  headerBg: Animated.AnimatedInterpolation<string | number>;
}

export default function HomeTopBar({ headerBg }: HomeTopBarProps) {
  return (
    <SafeAreaView edges={['top']} style={{ backgroundColor: Colors.bg }}>
      <Animated.View
        style={{
          backgroundColor: headerBg,
          borderBottomColor: Colors.borderFaint,
          borderBottomWidth: 1,
          height: 124,
        }}
      />
    </SafeAreaView>
  );
}

