import React from 'react';
import { Text, View } from 'react-native';

interface TasksSectionHeaderProps {
  count: number;
  title?: string;
}

export default function TasksSectionHeader({ count, title = 'My Tasks' }: TasksSectionHeaderProps) {
  return (
    <View className="mb-3 mt-3 flex-row items-center justify-between">
      <Text
        className="text-[12px] font-medium uppercase tracking-widest"
        style={{ color: 'rgba(237,241,251,0.6)', letterSpacing: 1 }}
      >
        {title}
      </Text>
      <Text className="text-[12px]" style={{ color: 'rgba(237,241,251,0.4)' }}>
        {count} Active
      </Text>
    </View>
  );
}
