import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import MaterialIcon from '@/src/components/shared/MaterialIcon';
import { Colors } from '@/src/constants/colors';

interface TasksTopBarProps {
  onBack: () => void;
  title?: string;
}

export default function TasksTopBar({ onBack, title = 'Tasks' }: TasksTopBarProps) {
  return (
    <SafeAreaView edges={['top']} style={{ backgroundColor: Colors.bg }}>
      <View
        className="flex-row justify-between items-center px-4 h-16"
        style={{
          borderBottomWidth: 1,
          borderBottomColor: 'rgba(255,255,255,0.05)',
        }}
      >
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onBack}
          className="w-10 h-10 items-center justify-center rounded-full mr-1"
        >
          <MaterialIcon name="arrow_back" color={Colors.text} size={22} />
        </TouchableOpacity>

        <Text
          className="text-2xl font-bold flex-1"
          style={{ color: Colors.text }}
          numberOfLines={1}
        >
          {title}
        </Text>
        <TouchableOpacity
          activeOpacity={0.7}
          className="w-10 h-10 items-center justify-center rounded-full"
        >
          <MaterialIcon name="filter_list" color={Colors.text} size={24} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
