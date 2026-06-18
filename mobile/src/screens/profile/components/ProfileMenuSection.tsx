import React from 'react';
import { Text, View } from 'react-native';

import MenuRow from '@/src/components/sub-component/MenuRow';
import { Colors } from '@/src/constants/colors';
import { AccountMenuItem, WorkSummaryItem } from '@/src/types/profile';

type ProfileMenuItem = WorkSummaryItem | AccountMenuItem;

interface ProfileMenuSectionProps {
  title: string;
  items: ProfileMenuItem[];
  onItemPress: (id: string) => void;
}

export default function ProfileMenuSection({
  title,
  items,
  onItemPress,
}: ProfileMenuSectionProps) {
  return (
    <View
      className="rounded-[18px] overflow-hidden"
      style={{
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.borderSubtle,
      }}
    >
      <View className="px-4 pt-4 pb-2">
        <Text
          className="text-[11px] font-bold uppercase tracking-widest"
          style={{ color: Colors.textMuted, letterSpacing: 1.2 }}
        >
          {title}
        </Text>
      </View>

      {items.map((item, index) => (
        <MenuRow
          key={item.id}
          icon={item.icon}
          label={item.label}
          badge={'badge' in item ? item.badge : undefined}
          isDestructive={'isDestructive' in item ? item.isDestructive : undefined}
          isLast={index === items.length - 1}
          onPress={() => onItemPress(item.id)}
        />
      ))}
    </View>
  );
}

