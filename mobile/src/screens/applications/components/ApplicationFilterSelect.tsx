import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

import MaterialIcon from '@/src/components/shared/MaterialIcon';
import { Colors } from '@/src/constants/colors';

interface FilterOption<T extends string> {
  label: string;
  shortLabel?: string;
  value: T;
}

interface ApplicationFilterSelectProps<TStatus extends string, TType extends string> {
  statusValue: TStatus;
  typeValue: TType;
  statusOptions: Array<FilterOption<TStatus>>;
  typeOptions: Array<FilterOption<TType>>;
  onStatusChange: (value: TStatus) => void;
  onTypeChange: (value: TType) => void;
}

export default function ApplicationFilterSelect<TStatus extends string, TType extends string>({
  statusValue,
  typeValue,
  statusOptions,
  typeOptions,
  onStatusChange,
  onTypeChange,
}: ApplicationFilterSelectProps<TStatus, TType>) {
  const [isOpen, setIsOpen] = React.useState(false);
  const activeStatus = statusOptions.find((option) => option.value === statusValue);
  const activeType = typeOptions.find((option) => option.value === typeValue);
  const isStatusFiltered = statusValue !== statusOptions[0]?.value;
  const isTypeFiltered = typeValue !== typeOptions[0]?.value;
  const isFiltered = isStatusFiltered || isTypeFiltered;
  const activeLabel =
    isStatusFiltered && isTypeFiltered
      ? '2 filters'
      : isStatusFiltered
        ? (activeStatus?.shortLabel ?? activeStatus?.label ?? 'Status')
        : isTypeFiltered
          ? (activeType?.shortLabel ?? activeType?.label ?? 'Type')
          : 'All';

  const renderOption = <T extends string>(
    group: string,
    option: FilterOption<T>,
    activeValue: T,
    onChange: (value: T) => void,
  ) => {
    const isActive = option.value === activeValue;

    return (
      <TouchableOpacity
        key={`${group}-${option.value}`}
        activeOpacity={0.72}
        onPress={() => {
          onChange(option.value);
          setIsOpen(false);
        }}
        accessibilityRole="button"
        accessibilityState={{ selected: isActive }}
        className="flex-row items-center px-3 py-3"
      >
        <Text
          className="flex-1 text-[13px] font-semibold"
          style={{ color: isActive ? Colors.accent : Colors.text }}
          numberOfLines={1}
        >
          {option.label}
        </Text>
        {isActive ? <MaterialIcon name="check" color={Colors.accent} size={16} /> : null}
      </TouchableOpacity>
    );
  };

  return (
    <View className="relative" style={{ zIndex: isOpen ? 30 : 1 }}>
      <TouchableOpacity
        activeOpacity={0.76}
        onPress={() => setIsOpen((current) => !current)}
        accessibilityRole="button"
        accessibilityLabel="Select application filter"
        accessibilityValue={{ text: activeLabel }}
        className="h-11 flex-row items-center justify-center rounded-lg px-3"
        style={{
          backgroundColor: Colors.surface,
          borderWidth: 1,
          borderColor: isFiltered ? Colors.accent : Colors.borderFaint,
          minWidth: 118,
        }}
      >
        <MaterialIcon
          name="filter"
          color={isFiltered ? Colors.accent : Colors.textMuted}
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

      {isOpen && (
        <View
          className="absolute right-0 top-12 overflow-hidden rounded-xl"
          style={{
            backgroundColor: Colors.surface,
            borderWidth: 1,
            borderColor: Colors.borderFaint,
            minWidth: 220,
          }}
        >
          <View className="px-3 pt-3">
            <Text
              className="text-[10px] font-bold uppercase"
              style={{ color: Colors.textFaint, letterSpacing: 1 }}
            >
              Status
            </Text>
          </View>
          {statusOptions.map((option) =>
            renderOption('status', option, statusValue, onStatusChange),
          )}

          <View
            className="px-3 pt-3"
            style={{ borderTopWidth: 1, borderTopColor: Colors.borderFaint }}
          >
            <Text
              className="text-[10px] font-bold uppercase"
              style={{ color: Colors.textFaint, letterSpacing: 1 }}
            >
              Type
            </Text>
          </View>
          {typeOptions.map((option) => renderOption('type', option, typeValue, onTypeChange))}
        </View>
      )}
    </View>
  );
}
