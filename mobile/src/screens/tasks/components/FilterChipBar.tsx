import React from 'react';
import { ScrollView, Text, TouchableOpacity } from 'react-native';

import { Colors } from '@/src/constants/colors';

import { FILTER_CHIPS } from './taskData';
import { FilterChip } from './types';

interface FilterChipBarProps {
  activeFilter: FilterChip;
  onFilterChange: (filter: FilterChip) => void;
}

export default function FilterChipBar({ activeFilter, onFilterChange }: FilterChipBarProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      className="mt-3 mb-2"
      contentContainerStyle={{ gap: 8, paddingVertical: 4 }}
    >
      {FILTER_CHIPS.map((chip) => {
        const isActive = activeFilter === chip;
        return (
          <TouchableOpacity
            key={chip}
            activeOpacity={0.7}
            onPress={() => onFilterChange(chip)}
            className="px-4 py-1.5 rounded-full"
            style={{
              backgroundColor: isActive ? '#EEEEEE' : Colors.surface,
            }}
          >
            <Text
              className="text-[12px] font-medium"
              style={{
                color: isActive ? '#161c25' : Colors.text,
                fontFamily: 'monospace',
              }}
            >
              {chip}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

