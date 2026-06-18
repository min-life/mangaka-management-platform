import React from 'react';
import { Text, View } from 'react-native';

import { PRIORITY_STYLES } from './badgeStyles';
import { Priority } from './types';

interface PriorityBadgeProps {
  priority: Priority;
}

export default function PriorityBadge({ priority }: PriorityBadgeProps) {
  const style = PRIORITY_STYLES[priority];
  const hasBorder = priority === 'LOW';

  return (
    <View
      className="px-2 py-0.5 rounded"
      style={{
        backgroundColor: style.bg,
        borderWidth: hasBorder ? 1 : 0,
        borderColor: 'rgba(255,255,255,0.15)',
      }}
    >
      <Text className="text-[10px] font-bold" style={{ color: style.text }}>
        {priority}
      </Text>
    </View>
  );
}

