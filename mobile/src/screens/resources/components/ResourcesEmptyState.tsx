import React from 'react';
import { Text, View } from 'react-native';

import MaterialIcon from '@/src/components/shared/MaterialIcon';
import { Colors } from '@/src/constants/colors';

interface ResourcesEmptyStateProps {
  title?: string;
  message?: string;
}

export default function ResourcesEmptyState({
  title = 'No resources found',
  message = 'Try another search term in this folder.',
}: ResourcesEmptyStateProps) {
  return (
    <View className="items-center justify-center px-6 py-16">
      <MaterialIcon name="folder" color={Colors.textFaint} size={28} />
      <Text className="mt-4 text-[15px] font-bold" style={{ color: Colors.text }}>
        {title}
      </Text>
      <Text className="mt-2 text-center text-[12px]" style={{ color: Colors.textMuted }}>
        {message}
      </Text>
    </View>
  );
}
