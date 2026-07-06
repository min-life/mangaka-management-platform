import React, { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import MaterialIcon from '@/src/components/shared/MaterialIcon';
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

interface NotificationsTopBarProps {
  activeFilter: NotifFilter;
  unreadCount: number;
  onFilterChange: (filter: NotifFilter) => void;
  onMarkAllRead: () => void;
}

export default function NotificationsTopBar({
  activeFilter,
  unreadCount,
  onFilterChange,
  onMarkAllRead,
}: NotificationsTopBarProps) {
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const handleSelectFilter = (filter: NotifFilter) => {
    onFilterChange(filter);
    setIsFilterOpen(false);
  };

  return (
    <SafeAreaView
      edges={['top']}
      style={{ backgroundColor: Colors.bg, position: 'relative', zIndex: 20 }}
    >
      <View
        className="flex-row justify-between items-center px-4 h-16"
        style={{ borderBottomWidth: 1, borderBottomColor: Colors.borderSubtle }}
      >
        <View className="flex-row items-center gap-3">
          <Text className="text-[32px] font-bold tracking-tight" style={{ color: Colors.text }}>
            Inbox
          </Text>

          {unreadCount > 0 && (
            <View className="px-2 py-0.5 rounded-full" style={{ backgroundColor: Colors.accent }}>
              <Text className="text-[12px] font-bold" style={{ color: Colors.bg }}>
                {unreadCount}
              </Text>
            </View>
          )}
        </View>

        <View className="flex-row items-center gap-1">
          <TouchableOpacity
            activeOpacity={0.7}
            className="w-10 h-10 items-center justify-center rounded-full"
            disabled={unreadCount === 0}
            onPress={() => {
              setIsFilterOpen(false);
              onMarkAllRead();
            }}
            aria-label="Mark all as read"
          >
            <MaterialIcon
              name="done_all"
              color={unreadCount > 0 ? Colors.text : Colors.textFaint}
              size={22}
            />
          </TouchableOpacity>

          <View style={{ position: 'relative', zIndex: 30 }}>
            <TouchableOpacity
              activeOpacity={0.7}
              className="w-10 h-10 items-center justify-center rounded-full"
              style={{
                backgroundColor: isFilterOpen ? Colors.surfaceContainer : 'transparent',
              }}
              onPress={() => setIsFilterOpen((current) => !current)}
              aria-label="Filter notifications"
            >
              <MaterialIcon
                name="filter_list"
                color={activeFilter === 'All' ? Colors.text : Colors.accent}
                size={23}
              />
            </TouchableOpacity>

            {isFilterOpen && (
              <View
                className="absolute right-0 top-12 w-52 rounded-2xl overflow-hidden"
                style={{
                  backgroundColor: Colors.surface,
                  borderWidth: 1,
                  borderColor: Colors.borderFaint,
                }}
              >
                {NOTIF_FILTERS.map((filter, index) => {
                  const isActive = activeFilter === filter;
                  return (
                    <TouchableOpacity
                      key={filter}
                      activeOpacity={0.75}
                      className="flex-row items-center justify-between px-4 py-3"
                      style={{
                        backgroundColor: isActive ? Colors.surfaceContainer : Colors.surface,
                        borderTopWidth: index === 0 ? 0 : 1,
                        borderTopColor: Colors.borderSubtle,
                      }}
                      onPress={() => handleSelectFilter(filter)}
                    >
                      <Text
                        className="text-[14px] font-semibold"
                        style={{ color: isActive ? Colors.accent : Colors.text }}
                      >
                        {filter}
                      </Text>
                      {isActive && <MaterialIcon name="check" color={Colors.accent} size={18} />}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
