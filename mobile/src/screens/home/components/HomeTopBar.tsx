import React from 'react';
import { Animated, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import MaterialIcon from '@/src/components/shared/MaterialIcon';
import { Colors } from '@/src/constants/colors';

interface HomeTopBarProps {
  headerBg: Animated.AnimatedInterpolation<string | number>;
}

export default function HomeTopBar({ headerBg }: HomeTopBarProps) {
  return (
    <SafeAreaView edges={['top']} style={{ backgroundColor: Colors.bg }}>
      <Animated.View style={{ backgroundColor: headerBg }} className="px-4 pb-3 border-b">
        <View className="flex-row items-center justify-between mb-4 pt-2">
          <View
            className="w-10 h-10 rounded-full items-center justify-center overflow-hidden"
            style={{
              backgroundColor: Colors.overlayLight,
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.2)',
            }}
          >
            <MaterialIcon name="image" color="rgba(237,241,251,0.4)" size={20} />
          </View>

          <TouchableOpacity
            activeOpacity={0.7}
            className="w-10 h-10 items-center justify-center rounded-full"
          >
            <MaterialIcon name="add" color={Colors.text} size={22} />
          </TouchableOpacity>
        </View>

        <View className="relative">
          <View className="absolute left-3 top-0 bottom-0 justify-center z-10">
            <MaterialIcon name="search" color={Colors.textPlaceholder} size={18} />
          </View>
          <TextInput
            placeholder="Search tasks, projects, chapters"
            placeholderTextColor={Colors.textPlaceholder}
            className="h-12 rounded-xl pl-10 pr-4 text-[15px]"
            style={{
              backgroundColor: Colors.overlayLight,
              borderWidth: 1,
              borderColor: Colors.borderFaint,
              color: Colors.text,
            }}
          />
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}

