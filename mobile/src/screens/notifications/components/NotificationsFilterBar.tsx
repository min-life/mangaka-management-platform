import React, { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

import MaterialIcon from '@/src/components/shared/MaterialIcon';
import { Colors } from '@/src/constants/colors';
import { NotifFilter } from '@/src/types/notifications';

type NotificationCategoryFilter = Exclude<NotifFilter, 'Unread'>;

const NOTIF_FILTERS: NotificationCategoryFilter[] = [
  'All',
  'Tasks',
  'Reviews',
  'Projects',
  'Applications',
];

interface NotificationsFilterBarProps {
  activeFilter: NotificationCategoryFilter;
  unreadCount: number;
  unreadOnly: boolean;
  onFilterChange: (filter: NotificationCategoryFilter) => void;
  onUnreadOnlyChange: (active: boolean) => void;
}

export default function NotificationsFilterBar({
  activeFilter,
  unreadCount,
  unreadOnly,
  onFilterChange,
  onUnreadOnlyChange,
}: NotificationsFilterBarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const hasActiveFilter = activeFilter !== 'All';

  const handleSelectFilter = (filter: NotificationCategoryFilter) => {
    onFilterChange(filter);
    setIsOpen(false);
  };

  return (
    <View
      className="px-4 py-3"
      style={{
        borderBottomWidth: 1,
        borderBottomColor: Colors.borderSubtle,
        position: 'relative',
        zIndex: isOpen ? 30 : 5,
      }}
    >
      <View className="flex-row items-center gap-2">
        <TouchableOpacity
          activeOpacity={0.76}
          accessibilityRole="button"
          accessibilityLabel="Filter notifications"
          accessibilityState={{ expanded: isOpen, selected: hasActiveFilter }}
          className="h-10 flex-row items-center rounded-full px-3"
          onPress={() => setIsOpen((current) => !current)}
          style={{
            backgroundColor: isOpen || hasActiveFilter ? Colors.surfaceContainer : Colors.surface,
            borderColor: hasActiveFilter ? 'rgba(255,211,105,0.42)' : Colors.borderFaint,
            borderWidth: 1,
          }}
        >
          <MaterialIcon
            name="filter_list"
            color={hasActiveFilter ? Colors.accent : Colors.textMuted}
            size={19}
          />
          <Text
            className="ml-2 text-[13px] font-bold"
            style={{ color: hasActiveFilter ? Colors.accent : Colors.text }}
            numberOfLines={1}
          >
            {activeFilter}
          </Text>
          <MaterialIcon
            name={isOpen ? 'expand_less' : 'expand_more'}
            color={Colors.textMuted}
            size={18}
          />
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.76}
          accessibilityRole="button"
          accessibilityLabel="Show unread notifications"
          accessibilityState={{ selected: unreadOnly }}
          className="h-10 flex-row items-center rounded-full px-3"
          onPress={() => onUnreadOnlyChange(!unreadOnly)}
          style={{
            backgroundColor: unreadOnly ? Colors.surfaceContainer : Colors.surface,
            borderColor: unreadOnly ? 'rgba(255,211,105,0.42)' : Colors.borderFaint,
            borderWidth: 1,
          }}
        >
          <MaterialIcon
            name="mail"
            color={unreadOnly ? Colors.accent : Colors.textMuted}
            size={18}
          />
          <Text
            className="ml-2 text-[13px] font-bold"
            numberOfLines={1}
            style={{ color: unreadOnly ? Colors.accent : Colors.text }}
          >
            Unread
          </Text>
          {unreadCount > 0 ? (
            <View
              className="ml-2 items-center justify-center rounded-full px-1.5"
              style={{
                backgroundColor: unreadOnly ? Colors.accent : Colors.surfaceContainer,
                minWidth: 20,
                height: 20,
              }}
            >
              <Text
                className="text-[10px] font-bold"
                numberOfLines={1}
                style={{
                  color: unreadOnly ? Colors.bg : Colors.textMuted,
                  fontVariant: ['tabular-nums'],
                }}
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </Text>
            </View>
          ) : null}
        </TouchableOpacity>
      </View>

      {isOpen ? (
        <View
          className="absolute left-4 top-[56px] w-52 overflow-hidden rounded-2xl"
          style={{
            backgroundColor: Colors.surface,
            borderWidth: 1,
            borderColor: Colors.borderFaint,
            zIndex: 40,
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
                {isActive ? <MaterialIcon name="check" color={Colors.accent} size={18} /> : null}
              </TouchableOpacity>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}
