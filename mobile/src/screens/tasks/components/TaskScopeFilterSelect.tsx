import React, { useMemo, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

import MaterialIcon from '@/src/components/shared/MaterialIcon';
import { Colors } from '@/src/constants/colors';

import { TaskScopeFilter } from './types';

const SCOPE_FILTERS: Array<{ label: string; value: TaskScopeFilter }> = [
  { label: 'All tasks', value: 'All' },
  { label: 'My tasks', value: 'Mine' },
];

interface TaskScopeFilterSelectProps {
  activeFilter: TaskScopeFilter;
  onFilterChange: (filter: TaskScopeFilter) => void;
}

export default function TaskScopeFilterSelect({
  activeFilter,
  onFilterChange,
}: TaskScopeFilterSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const activeOption = useMemo(
    () => SCOPE_FILTERS.find((option) => option.value === activeFilter) ?? SCOPE_FILTERS[0],
    [activeFilter],
  );

  return (
    <View className="relative py-1">
      <TouchableOpacity
        activeOpacity={0.76}
        accessibilityLabel="Select task scope"
        accessibilityRole="button"
        className="h-10 flex-row items-center rounded-full px-3"
        onPress={() => setIsOpen((current) => !current)}
        style={{
          backgroundColor:
            isOpen || activeFilter !== 'All' ? Colors.surfaceContainer : Colors.surface,
          borderColor: activeFilter === 'All' ? Colors.borderFaint : 'rgba(255,211,105,0.42)',
          borderWidth: 1,
        }}
      >
        <MaterialIcon
          name="person"
          color={activeFilter === 'All' ? Colors.textMuted : Colors.accent}
          size={18}
        />
        <Text
          className="ml-2 text-[13px] font-bold"
          numberOfLines={1}
          style={{ color: activeFilter === 'All' ? Colors.text : Colors.accent }}
        >
          {activeOption.label}
        </Text>
        <MaterialIcon
          name={isOpen ? 'expand_less' : 'expand_more'}
          color={Colors.textMuted}
          size={18}
        />
      </TouchableOpacity>

      {isOpen ? (
        <View
          className="absolute left-0 top-12 z-30 w-44 overflow-hidden rounded-2xl"
          style={{
            backgroundColor: Colors.surface,
            borderColor: Colors.borderFaint,
            borderWidth: 1,
          }}
        >
          {SCOPE_FILTERS.map((filter, index) => {
            const isActive = filter.value === activeFilter;

            return (
              <TouchableOpacity
                key={filter.value}
                activeOpacity={0.72}
                accessibilityRole="button"
                accessibilityState={{ selected: isActive }}
                className="flex-row items-center px-3 py-3"
                onPress={() => {
                  onFilterChange(filter.value);
                  setIsOpen(false);
                }}
                style={{
                  borderBottomColor: Colors.borderFaint,
                  borderBottomWidth: index === SCOPE_FILTERS.length - 1 ? 0 : 1,
                }}
              >
                <Text
                  className="flex-1 text-[13px] font-semibold"
                  style={{ color: isActive ? Colors.accent : Colors.text }}
                >
                  {filter.label}
                </Text>
                {isActive ? <MaterialIcon name="check" color={Colors.accent} size={16} /> : null}
              </TouchableOpacity>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}
