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
  const [openFilter, setOpenFilter] = React.useState<'status' | 'type' | null>(null);
  const activeStatus = statusOptions.find((option) => option.value === statusValue);
  const activeType = typeOptions.find((option) => option.value === typeValue);
  const isStatusFiltered = statusValue !== statusOptions[0]?.value;
  const isTypeFiltered = typeValue !== typeOptions[0]?.value;
  const statusLabel = isStatusFiltered
    ? (activeStatus?.shortLabel ?? activeStatus?.label ?? 'Status')
    : 'Status';
  const typeLabel = isTypeFiltered
    ? (activeType?.shortLabel ?? activeType?.label ?? 'Type')
    : 'Type';

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
          setOpenFilter(null);
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

  const renderFilterButton = ({
    isFiltered,
    isOpen,
    label,
    type,
  }: {
    isFiltered: boolean;
    isOpen: boolean;
    label: string;
    type: 'status' | 'type';
  }) => (
    <TouchableOpacity
      activeOpacity={0.76}
      onPress={() => setOpenFilter((current) => (current === type ? null : type))}
      accessibilityRole="button"
      accessibilityLabel={`Select application ${type} filter`}
      accessibilityState={{ expanded: isOpen, selected: isFiltered }}
      accessibilityValue={{ text: label }}
      className="h-10 flex-row items-center rounded-full px-3"
      style={{
        backgroundColor: isOpen || isFiltered ? Colors.surfaceContainer : Colors.surface,
        borderWidth: 1,
        borderColor: isFiltered ? 'rgba(255,211,105,0.42)' : Colors.borderFaint,
      }}
    >
      <MaterialIcon
        name="filter_list"
        color={isFiltered ? Colors.accent : Colors.textMuted}
        size={19}
      />
      <Text
        className="ml-2 text-[13px] font-bold"
        numberOfLines={1}
        style={{ color: isFiltered ? Colors.accent : Colors.text }}
      >
        {label}
      </Text>
      <MaterialIcon
        name={isOpen ? 'expand_less' : 'expand_more'}
        color={Colors.textMuted}
        size={18}
      />
    </TouchableOpacity>
  );

  return (
    <View
      className="relative flex-row gap-2 py-1"
      style={{
        borderBottomColor: Colors.borderSubtle,
        borderBottomWidth: 1,
        zIndex: openFilter ? 30 : 1,
      }}
    >
      <View className="relative">
        {renderFilterButton({
          isFiltered: isStatusFiltered,
          isOpen: openFilter === 'status',
          label: statusLabel,
          type: 'status',
        })}
        {openFilter === 'status' ? (
          <View
            className="absolute left-0 top-12 w-52 overflow-hidden rounded-2xl"
            style={{
              backgroundColor: Colors.surface,
              borderWidth: 1,
              borderColor: Colors.borderFaint,
            }}
          >
            {statusOptions.map((option) =>
              renderOption('status', option, statusValue, onStatusChange),
            )}
          </View>
        ) : null}
      </View>

      <View className="relative">
        {renderFilterButton({
          isFiltered: isTypeFiltered,
          isOpen: openFilter === 'type',
          label: typeLabel,
          type: 'type',
        })}
        {openFilter === 'type' ? (
          <View
            className="absolute left-0 top-12 w-56 overflow-hidden rounded-2xl"
            style={{
              backgroundColor: Colors.surface,
              borderWidth: 1,
              borderColor: Colors.borderFaint,
            }}
          >
            {typeOptions.map((option) => renderOption('type', option, typeValue, onTypeChange))}
          </View>
        ) : null}
      </View>
    </View>
  );
}
