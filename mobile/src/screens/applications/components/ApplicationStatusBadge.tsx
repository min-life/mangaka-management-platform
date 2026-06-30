import React from 'react';
import { Text, View } from 'react-native';

import { ApplicationStatus } from '@/src/types/applications';

import { getApplicationStatusColor, getApplicationStatusLabel } from './applicationDisplay';

interface ApplicationStatusBadgeProps {
  status: ApplicationStatus;
}

export default function ApplicationStatusBadge({ status }: ApplicationStatusBadgeProps) {
  const color = getApplicationStatusColor(status);

  return (
    <View
      className="rounded-full px-2.5 py-1"
      style={{
        backgroundColor: `${color}22`,
        borderWidth: 1,
        borderColor: `${color}66`,
      }}
    >
      <Text className="text-[11px] font-bold" style={{ color }}>
        {getApplicationStatusLabel(status)}
      </Text>
    </View>
  );
}
