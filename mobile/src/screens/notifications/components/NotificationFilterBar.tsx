import React from 'react';
import { ScrollView, Text, TouchableOpacity } from 'react-native';

import { Colors } from '@/src/constants/colors';
import { NotifFilter } from '@/src/types/notifications';

const NOTIF_FILTERS: NotifFilter[] = [
  'All',
  'Unread',
  'Tasks',
  'Reviews',
  'Projects',
  'Applications',
];

interface NotificationFilterBarProps {
  activeFilter: NotifFilter;
  onFilterChange: (filter: NotifFilter) => void;
}

export default function NotificationFilterBar({
  activeFilter,
  onFilterChange,
}: NotificationFilterBarProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 16, gap: 8, paddingVertical: 12 }}
      style={{
        borderBottomWidth: 1,
        borderBottomColor: Colors.borderSubtle,
      }}
    >
      {NOTIF_FILTERS.map((filter) => {
        const isActive = activeFilter === filter;
        return (
          <TouchableOpacity
            key={filter}
            activeOpacity={0.75}
            onPress={() => onFilterChange(filter)}
            className="px-4 py-1.5 rounded-full"
            style={{
              backgroundColor: isActive ? Colors.surfaceContainer : Colors.surface,
              borderWidth: isActive ? 1 : 0,
              borderColor: Colors.accent,
            }}
          >
            <Text
              className="text-[12px] font-medium"
              style={{
                color: isActive ? Colors.accent : Colors.textMuted,
                fontFamily: 'monospace',
                letterSpacing: 0.5,
              }}
            >
              {filter}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

