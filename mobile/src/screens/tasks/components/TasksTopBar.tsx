import React from 'react';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import HeaderBackButton from '@/src/components/shared/HeaderBackButton';
import { Colors } from '@/src/constants/colors';

interface TasksTopBarProps {
  onBack: () => void;
  title?: string;
}

export default function TasksTopBar({ onBack, title = 'Tasks' }: TasksTopBarProps) {
  return (
    <SafeAreaView edges={['top']} style={{ backgroundColor: Colors.bg }}>
      <View
        className="h-16 flex-row items-center px-4"
        style={{
          borderBottomWidth: 1,
          borderBottomColor: 'rgba(255,255,255,0.05)',
        }}
      >
        <HeaderBackButton className="mr-1" onPress={onBack} />

        <Text
          className="text-2xl font-bold flex-1"
          style={{ color: Colors.text }}
          numberOfLines={1}
        >
          {title}
        </Text>
      </View>
    </SafeAreaView>
  );
}
