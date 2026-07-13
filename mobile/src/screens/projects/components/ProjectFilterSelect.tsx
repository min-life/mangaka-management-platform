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
    <View
      className="relative py-1"
      style={{
        borderBottomColor: Colors.borderSubtle,
        borderBottomWidth: 1,
      }}
    >
      <TouchableOpacity
        activeOpacity={0.76}
        accessibilityLabel="Select project filter"
        accessibilityRole="button"
        className="h-10 flex-row items-center self-start rounded-full px-3"
        onPress={() => setIsOpen((current) => !current)}
        style={{
          backgroundColor: isOpen || isOwnerFilterActive ? Colors.surfaceContainer : Colors.surface,
          borderColor: isOwnerFilterActive ? 'rgba(255,211,105,0.42)' : Colors.borderFaint,
          borderWidth: 1,
        }}
      >
        <MaterialIcon
          name="filter_list"
          color={isOwnerFilterActive ? Colors.accent : Colors.textMuted}
          size={19}
        />
        <Text
          className="ml-2 text-[13px] font-bold"
          numberOfLines={1}
          style={{ color: isOwnerFilterActive ? Colors.accent : Colors.text }}
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
          className="absolute left-0 top-12 z-30 w-44 overflow-hidden rounded-2xl"
          style={{
            backgroundColor: Colors.surface,
            borderColor: Colors.borderFaint,
            borderWidth: 1,
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
