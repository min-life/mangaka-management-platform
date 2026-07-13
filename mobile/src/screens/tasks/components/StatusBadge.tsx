import React from 'react';
import { Text, View } from 'react-native';

import { STATUS_STYLES } from './badgeStyles';
import { TaskStatus } from './types';

interface StatusBadgeProps {
  status: TaskStatus;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const style = STATUS_STYLES[status];

  return (
    <View
      className="px-3 py-1 rounded-full"
      style={{
        backgroundColor: style.bg,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
      }}
    >
      <Text className="text-[12px]" style={{ color: style.text }}>
        {status}
      </Text>
    </View>
  );
}

