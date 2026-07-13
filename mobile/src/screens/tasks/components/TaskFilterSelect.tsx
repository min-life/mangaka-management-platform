import React, { useMemo, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

import MaterialIcon from '@/src/components/shared/MaterialIcon';
import { Colors } from '@/src/constants/colors';

import { FILTER_CHIPS } from './taskData';
import { FilterChip } from './types';

interface TaskFilterSelectProps {
  activeFilter: FilterChip;
  onFilterChange: (filter: FilterChip) => void;
}

export default function TaskFilterSelect({ activeFilter, onFilterChange }: TaskFilterSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const activeLabel = useMemo(() => activeFilter, [activeFilter]);

  return (
    <View
      className="relative py-1"
      style={{
        borderBottomColor: Colors.borderSubtle,
        borderBottomWidth: 1,
      }}
    >
      <TouchableOpacity
        activeOpacity={0.76}
        accessibilityLabel="Select task filter"
        accessibilityRole="button"
        className="h-10 flex-row items-center self-start rounded-full px-3"
        onPress={() => setIsOpen((current) => !current)}
        style={{
          backgroundColor:
            isOpen || activeFilter !== 'All' ? Colors.surfaceContainer : Colors.surface,
          borderColor: activeFilter === 'All' ? Colors.borderFaint : 'rgba(255,211,105,0.42)',
          borderWidth: 1,
        }}
      >
        <MaterialIcon
          name="filter_list"
          color={activeFilter === 'All' ? Colors.textMuted : Colors.accent}
          size={19}
        />
        <Text
          className="ml-2 text-[13px] font-bold"
          numberOfLines={1}
          style={{ color: activeFilter === 'All' ? Colors.text : Colors.accent }}
        >
          {activeLabel}
        </Text>
        <MaterialIcon
          name={isOpen ? 'expand_less' : 'expand_more'}
          color={Colors.textMuted}
          size={18}
        />
      </TouchableOpacity>

      {isOpen ? (
        <View
          className="absolute left-0 top-12 z-30 w-48 overflow-hidden rounded-2xl"
          style={{
            backgroundColor: Colors.surface,
            borderColor: Colors.borderFaint,
            borderWidth: 1,
          }}
        >
          {FILTER_CHIPS.map((filter, index) => {
            const isActive = filter === activeFilter;

            return (
              <TouchableOpacity
                key={filter}
                activeOpacity={0.72}
                accessibilityRole="button"
                accessibilityState={{ selected: isActive }}
                className="flex-row items-center px-3 py-3"
                onPress={() => {
                  onFilterChange(filter);
                  setIsOpen(false);
                }}
                style={{
                  borderBottomColor: Colors.borderFaint,
                  borderBottomWidth: index === FILTER_CHIPS.length - 1 ? 0 : 1,
                }}
              >
                <Text
                  className="flex-1 text-[13px] font-semibold"
                  style={{ color: isActive ? Colors.accent : Colors.text }}
                >
                  {filter}
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
