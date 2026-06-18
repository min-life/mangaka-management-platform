import React from 'react';
import { Text, View } from 'react-native';

interface TasksSectionHeaderProps {
  count: number;
}

export default function TasksSectionHeader({ count }: TasksSectionHeaderProps) {
  return (
    <View className="flex-row justify-between items-center mt-4 mb-3">
      <Text
        className="text-[12px] font-medium uppercase tracking-widest"
        style={{ color: 'rgba(237,241,251,0.6)', letterSpacing: 1 }}
      >
        My Tasks
      </Text>
      <Text className="text-[12px]" style={{ color: 'rgba(237,241,251,0.4)' }}>
        {count} Active
      </Text>
    </View>
  );
}

