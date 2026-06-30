import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

import MaterialIcon from '@/src/components/shared/MaterialIcon';
import { Colors } from '@/src/constants/colors';

interface FilterOption<T extends string> {
  label: string;
  value: T;
}

interface ApplicationFilterSelectProps<T extends string> {
  activeValue: T;
  accessibilityLabel: string;
  icon: string;
  isOpen: boolean;
  options: Array<FilterOption<T>>;
  onChange: (value: T) => void;
  onOpenChange: (isOpen: boolean) => void;
}

export default function ApplicationFilterSelect<T extends string>({
  activeValue,
  accessibilityLabel,
  icon,
  isOpen,
  options,
  onChange,
  onOpenChange,
}: ApplicationFilterSelectProps<T>) {
  const activeOption = options.find((option) => option.value === activeValue) ?? options[0];
  const isFiltered = activeValue !== options[0]?.value;

  return (
    <View className="items-end" style={{ position: 'relative', zIndex: isOpen ? 30 : 1 }}>
      <TouchableOpacity
        activeOpacity={0.76}
        onPress={() => onOpenChange(!isOpen)}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityValue={{ text: activeOption.label }}
        className="h-12 w-12 items-center justify-center rounded-xl"
        style={{
          backgroundColor: isFiltered ? Colors.surfaceContainer : Colors.surface,
          borderWidth: 1,
          borderColor: isOpen || isFiltered ? Colors.accent : Colors.borderFaint,
        }}
      >
        <MaterialIcon name={icon} color={isFiltered ? Colors.text : Colors.textFaint} size={20} />
        {isFiltered && (
          <View
            className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: Colors.accent }}
          />
        )}
      </TouchableOpacity>

      {isOpen && (
        <View
          className="absolute right-0 top-14 w-48 overflow-hidden rounded-xl"
          style={{
            backgroundColor: Colors.surface,
            borderWidth: 1,
            borderColor: Colors.borderSubtle,
            boxShadow: '0 8px 22px rgba(0, 0, 0, 0.28)',
          }}
        >
          {options.map((option, index) => {
            const isActive = option.value === activeValue;

            return (
              <TouchableOpacity
                key={option.value}
                activeOpacity={0.72}
                onPress={() => {
                  onChange(option.value);
                  onOpenChange(false);
                }}
                accessibilityRole="button"
                accessibilityState={{ selected: isActive }}
                className="flex-row items-center px-4 py-3"
                style={{
                  borderBottomWidth: index === options.length - 1 ? 0 : 1,
                  borderBottomColor: Colors.borderFaint,
                }}
              >
                <Text
                  className="flex-1 text-[13px] font-semibold"
                  style={{ color: isActive ? Colors.accent : Colors.textMuted }}
                  numberOfLines={1}
                >
                  {option.label}
                </Text>
                {isActive && <MaterialIcon name="check" color={Colors.accent} size={18} />}
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
}
