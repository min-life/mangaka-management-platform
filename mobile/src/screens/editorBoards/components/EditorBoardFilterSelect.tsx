import React, { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

import MaterialIcon from '@/src/components/shared/MaterialIcon';
import { Colors } from '@/src/constants/colors';

interface FilterOption<T extends string> {
  label: string;
  value: T;
}

interface EditorBoardFilterSelectProps<T extends string> {
  activeValue: T;
  options: Array<FilterOption<T>>;
  onChange: (value: T) => void;
}

export default function EditorBoardFilterSelect<T extends string>({
  activeValue,
  options,
  onChange,
}: EditorBoardFilterSelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const activeOption = options.find((option) => option.value === activeValue) ?? options[0];

  return (
    <View>
      <TouchableOpacity
        activeOpacity={0.76}
        onPress={() => setIsOpen((value) => !value)}
        accessibilityRole="button"
        accessibilityLabel="Select editor board filter"
        className="h-12 flex-row items-center rounded-xl px-4"
        style={{
          backgroundColor: Colors.surface,
          borderWidth: 1,
          borderColor: Colors.borderSubtle,
        }}
      >
        <Text className="flex-1 text-[13px] font-semibold" style={{ color: Colors.text }} numberOfLines={1}>
          {activeOption.label}
        </Text>
        <MaterialIcon
          name={isOpen ? 'expand_less' : 'expand_more'}
          color={Colors.textMuted}
          size={22}
        />
      </TouchableOpacity>

      {isOpen && (
        <View
          className="mt-2 overflow-hidden rounded-xl"
          style={{
            backgroundColor: Colors.surface,
            borderWidth: 1,
            borderColor: Colors.borderSubtle,
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
                  setIsOpen(false);
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
