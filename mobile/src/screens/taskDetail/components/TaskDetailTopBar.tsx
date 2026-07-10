import React from 'react';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import HeaderBackButton from '@/src/components/shared/HeaderBackButton';

import { C } from './theme';

interface TaskDetailTopBarProps {
  onBack: () => void;
  subtitle?: string;
  title?: string;
}

export default function TaskDetailTopBar({
  onBack,
  subtitle = 'Detail',
  title = 'Resource',
}: TaskDetailTopBarProps) {
  return (
    <SafeAreaView edges={['top']} style={{ backgroundColor: C.bg }}>
      <View
        className="flex-row justify-between items-center px-4 h-[56px]"
        style={{ borderBottomWidth: 1, borderBottomColor: C.border }}
      >
        <View className="flex-1 flex-row items-center gap-3 pr-3">
          <HeaderBackButton iconSize={20} onPress={onBack} />

          <View className="flex-1">
            {/* <Text
              className="text-[11px] font-medium uppercase tracking-widest"
              style={{ color: C.textMuted, letterSpacing: 1.5 }}
              numberOfLines={1}
            >
              {subtitle}
            </Text> */}
            <Text className="text-[16px] font-bold" style={{ color: C.text }} numberOfLines={1}>
              {title}
            </Text>
          </View>
        </View>

        <View className="flex-row items-center gap-1">
          {/* <TouchableOpacity
            activeOpacity={0.7}
            className="w-9 h-9 items-center justify-center rounded-full"
          >
            <MaterialIcon name="more_vert" color={C.text} size={20} />
          </TouchableOpacity> */}
        </View>
      </View>
    </SafeAreaView>
  );
}
