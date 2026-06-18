import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import MaterialIcon from '@/src/components/shared/MaterialIcon';
import { TASK_INFO } from '@/src/constants/taskDetailData';

import { C } from './theme';

interface TaskDetailTopBarProps {
  onBack: () => void;
}

export default function TaskDetailTopBar({ onBack }: TaskDetailTopBarProps) {
  return (
    <SafeAreaView edges={['top']} style={{ backgroundColor: C.bg }}>
      <View
        className="flex-row justify-between items-center px-4 h-[56px]"
        style={{ borderBottomWidth: 1, borderBottomColor: C.border }}
      >
        <View className="flex-row items-center gap-3">
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onBack}
            className="w-9 h-9 items-center justify-center rounded-full"
            style={{ backgroundColor: C.surfaceHighest }}
          >
            <MaterialIcon name="arrow_back" color={C.text} size={20} />
          </TouchableOpacity>

          <View>
            <Text
              className="text-[11px] font-medium uppercase tracking-widest"
              style={{ color: C.textMuted, letterSpacing: 1.5 }}
            >
              {TASK_INFO.chapter}
            </Text>
            <Text className="text-[16px] font-bold" style={{ color: C.text }}>
              {TASK_INFO.pageCode}
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
