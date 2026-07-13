import React from 'react';
import { Text, View } from 'react-native';

import { Colors } from '@/src/constants/colors';

interface NotificationSectionHeaderProps {
  label: string;
  sectionKey: string;
}

export default function NotificationSectionHeader({
  label,
  sectionKey,
}: NotificationSectionHeaderProps) {
  return (
    <View
      className="px-4 py-3"
      style={{
        backgroundColor: 'rgba(57,62,70,0.5)',
        borderBottomWidth: 1,
        borderBottomColor: Colors.borderSubtle,
        borderTopWidth: sectionKey !== 'today' ? 1 : 0,
        borderTopColor: Colors.borderSubtle,
      }}
    >
      <Text
        className="text-[12px] font-bold uppercase tracking-wider"
        style={{ color: Colors.textFaint, letterSpacing: 1.2 }}
      >
        {label}
      </Text>
    </View>
  );
}

