import React from 'react';
import { Text, View } from 'react-native';

import { ApplicationType } from '@/src/types/applications';

import { getApplicationTypeColor, getApplicationTypeLabel } from './applicationDisplay';

interface ApplicationTypeBadgeProps {
  type: ApplicationType;
}

export default function ApplicationTypeBadge({ type }: ApplicationTypeBadgeProps) {
  const color = getApplicationTypeColor(type);

  return (
    <View
      className="rounded-md px-2 py-1"
      style={{
        backgroundColor: `${color}1F`,
        borderWidth: 1,
        borderColor: `${color}55`,
      }}
    >
      <Text className="text-[10px] font-bold uppercase" style={{ color }}>
        {getApplicationTypeLabel(type)}
      </Text>
    </View>
  );
}

