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
      <Text
        className="text-[11px] font-bold uppercase"
        style={{ color: C.textMuted, letterSpacing: 1.1 }}
      >
        Actions
      </Text>

      <TouchableOpacity
        activeOpacity={0.85}
        className="h-14 w-full flex-row items-center justify-center gap-2 rounded-xl"
        style={{ backgroundColor: C.accent }}
      >
        <MaterialIcon name="check_circle" color="#222831" size={22} />
        <Text className="font-bold text-[15px]" style={{ color: '#222831' }}>
          {approveLabel}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        activeOpacity={0.85}
        className="h-14 w-full flex-row items-center justify-center gap-2 rounded-xl"
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
