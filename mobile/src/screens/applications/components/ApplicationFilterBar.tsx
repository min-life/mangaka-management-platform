import React from 'react';
import { ScrollView, Text, TouchableOpacity } from 'react-native';

import { Colors } from '@/src/constants/colors';

interface FilterOption<T extends string> {
  label: string;
  value: T;
}

interface ApplicationFilterBarProps<T extends string> {
  activeValue: T;
  options: Array<FilterOption<T>>;
  onChange: (value: T) => void;
}

export default function ApplicationFilterBar<T extends string>({
  activeValue,
  options,
  onChange,
}: ApplicationFilterBarProps<T>) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 8, paddingHorizontal: 16, paddingVertical: 4 }}
    >
      {options.map((option) => {
        const isActive = option.value === activeValue;
        return (
          <TouchableOpacity
            key={option.value}
            activeOpacity={0.72}
            onPress={() => onChange(option.value)}
            className="rounded-full px-4 py-2"
            style={{
              backgroundColor: isActive ? Colors.accent : Colors.surface,
              borderWidth: 1,
              borderColor: isActive ? Colors.accent : Colors.borderSubtle,
            }}
          >
            <Text
              className="text-[12px] font-bold"
              style={{ color: isActive ? Colors.bg : Colors.textMuted }}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

