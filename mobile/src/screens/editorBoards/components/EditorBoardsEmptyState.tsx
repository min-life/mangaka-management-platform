import React from 'react';
import { Text, View } from 'react-native';

import MaterialIcon from '@/src/components/shared/MaterialIcon';
import { Colors } from '@/src/constants/colors';

export default function EditorBoardsEmptyState() {
  return (
    <View
      className="items-center justify-center px-6 py-16"
      accessibilityRole="summary"
      accessibilityLabel="No editor boards found"
    >
      <View
        className="h-14 w-14 items-center justify-center rounded-full"
        style={{ backgroundColor: Colors.overlayLight }}
      >
        <MaterialIcon name="groups" color={Colors.textMuted} size={28} />
      </View>
      <Text className="mt-4 text-[15px] font-medium" style={{ color: Colors.text }}>
        No editor boards found
      </Text>
      <Text className="mt-2 text-center text-[14px]" style={{ color: Colors.textMuted }}>
        Try another search term or role filter.
      </Text>
    </View>
  );
}
