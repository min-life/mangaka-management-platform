import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

import MaterialIcon from '@/src/components/shared/MaterialIcon';

import { C } from './theme';

interface ActionTabProps {
  approveLabel?: string;
  rejectLabel?: string;
}

export default function ActionTab({
  approveLabel = 'Approve Page',
  rejectLabel = 'Reject Page',
}: ActionTabProps) {
  return (
    <View className="mt-6 gap-3">
      {/* Approve */}
      <TouchableOpacity
        activeOpacity={0.85}
        className="w-full h-14 rounded-xl items-center justify-center flex-row gap-2"
        style={{ backgroundColor: C.accent }}
      >
        <MaterialIcon name="check_circle" color="#222831" size={22} />
        <Text className="font-bold text-[15px]" style={{ color: '#222831' }}>
          {approveLabel}
        </Text>
      </TouchableOpacity>

      {/* Reject */}
      <TouchableOpacity
        activeOpacity={0.85}
        className="w-full h-14 rounded-xl items-center justify-center flex-row gap-2"
        style={{ backgroundColor: C.error }}
      >
        <MaterialIcon name="cancel" color={C.onError} size={22} />
        <Text className="font-bold text-[15px]" style={{ color: C.onError }}>
          {rejectLabel}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
