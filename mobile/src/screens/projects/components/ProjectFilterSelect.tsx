import React, { useMemo, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

import MaterialIcon from '@/src/components/shared/MaterialIcon';
import { Colors } from '@/src/constants/colors';

interface ProjectFilterOption {
  label: string;
  value: boolean;
}

interface ProjectFilterSelectProps {
  isOwnerFilterActive: boolean;
  onOwnerFilterChange: (active: boolean) => void;
}

const PROJECT_FILTER_OPTIONS: ProjectFilterOption[] = [
  { label: 'All', value: false },
  { label: 'Mine', value: true },
];

export default function ProjectFilterSelect({
  isOwnerFilterActive,
  onOwnerFilterChange,
}: ProjectFilterSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const activeLabel = useMemo(
    () =>
      PROJECT_FILTER_OPTIONS.find((option) => option.value === isOwnerFilterActive)?.label ?? 'All',
    [isOwnerFilterActive],
  );

  return (
    <View className="relative">
      <TouchableOpacity
        activeOpacity={0.76}
        accessibilityLabel="Select project filter"
        accessibilityRole="button"
        className="h-11 flex-row items-center justify-center rounded-lg px-3"
        onPress={() => setIsOpen((current) => !current)}
        style={{
          backgroundColor: Colors.surface,
          borderColor: isOwnerFilterActive ? Colors.accent : Colors.borderFaint,
          borderWidth: 1,
          minWidth: 118,
        }}
      >
        <MaterialIcon
          name="filter"
          color={isOwnerFilterActive ? Colors.accent : Colors.textMuted}
          size={18}
        />
        <Text
          className="ml-2 max-w-[72px] text-[12px] font-bold"
          numberOfLines={1}
          style={{ color: Colors.text }}
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
          className="absolute right-0 top-12 z-30 overflow-hidden rounded-xl"
          style={{
            backgroundColor: Colors.surface,
            borderColor: Colors.borderFaint,
            borderWidth: 1,
            minWidth: 142,
          }}
        >
          {PROJECT_FILTER_OPTIONS.map((option, index) => {
            const isActive = option.value === isOwnerFilterActive;

            return (
              <TouchableOpacity
                key={option.label}
                activeOpacity={0.72}
                accessibilityRole="button"
                accessibilityState={{ selected: isActive }}
                className="flex-row items-center px-3 py-3"
                onPress={() => {
                  onOwnerFilterChange(option.value);
                  setIsOpen(false);
                }}
                style={{
                  borderBottomColor: Colors.borderFaint,
                  borderBottomWidth: index === PROJECT_FILTER_OPTIONS.length - 1 ? 0 : 1,
                }}
              >
                <Text
                  className="flex-1 text-[13px] font-semibold"
                  style={{ color: isActive ? Colors.accent : Colors.text }}
                >
                  {option.label}
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
