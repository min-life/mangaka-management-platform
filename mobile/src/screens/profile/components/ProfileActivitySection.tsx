import React, { useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';

import ActivityRow from '@/src/components/sub-component/ActivityRow';
import MaterialIcon from '@/src/components/shared/MaterialIcon';
import { Colors } from '@/src/constants/colors';
import { ActivityLogFilterOption, ActivityLogFilterType } from '@/src/services/activityLogApi';
import { ActivityItem } from '@/src/types/home';

interface ProfileActivitySectionProps {
  activities: ActivityItem[];
  errorMessage?: string;
  filterOptions: ActivityLogFilterOption[];
  filterType: ActivityLogFilterType | null;
  isFilterLoading?: boolean;
  isLoading?: boolean;
  onActivityPress?: (activity: ActivityItem) => void;
  onFilterOptionChange: (optionId: string | null) => void;
  onFilterTypeChange: (type: ActivityLogFilterType | null) => void;
  selectedFilterId?: string | null;
}

const FILTERS: Array<{ icon: string; label: string; type: ActivityLogFilterType }> = [
  { icon: 'file', label: 'File', type: 'file' },
  { icon: 'folder', label: 'Project', type: 'project' },
  { icon: 'groups', label: 'Board', type: 'editorBoard' },
];

function filterTypeLabel(type: ActivityLogFilterType | null) {
  if (type === 'file') return 'file';
  if (type === 'project') return 'project';
  if (type === 'editorBoard') return 'editor board';
  return 'item';
}

export default function ProfileActivitySection({
  activities,
  errorMessage,
  filterOptions,
  filterType,
  isFilterLoading,
  isLoading,
  onActivityPress,
  onFilterOptionChange,
  onFilterTypeChange,
  selectedFilterId,
}: ProfileActivitySectionProps) {
  const [isSelectOpen, setIsSelectOpen] = useState(false);
  const selectedOption = useMemo(
    () => filterOptions.find((option) => option.id === selectedFilterId),
    [filterOptions, selectedFilterId],
  );
  const activeFilter = FILTERS.find((filter) => filter.type === filterType);
  const selectLabel =
    selectedOption?.label ??
    (isFilterLoading ? 'Loading...' : `Select ${filterTypeLabel(filterType)}`);

  return (
    <View
      className="rounded-[18px] p-4"
      style={{
        backgroundColor: Colors.surface,
        borderColor: Colors.borderSubtle,
        borderWidth: 1,
      }}
    >
      <View className="flex-row items-center justify-between gap-3">
        <Text
          className="text-[11px] font-bold uppercase tracking-widest"
          style={{ color: Colors.textMuted, letterSpacing: 1.2 }}
        >
          Activity Log
        </Text>

        <View className="flex-row gap-2">
          {FILTERS.map((filter) => {
            const isActive = filter.type === filterType;

            return (
              <TouchableOpacity
                key={filter.type}
                activeOpacity={0.75}
                accessibilityLabel={`Filter activity logs by ${filter.label}`}
                accessibilityRole="button"
                accessibilityState={{ selected: isActive }}
                className="h-9 w-9 items-center justify-center rounded-xl"
                onPress={() => {
                  setIsSelectOpen(filter.type !== filterType);
                  onFilterTypeChange(isActive ? null : filter.type);
                }}
                style={{
                  backgroundColor: isActive ? Colors.surfaceContainer : Colors.iconBg,
                  borderColor: isActive ? Colors.accent : Colors.borderFaint,
                  borderWidth: 1,
                }}
              >
                <MaterialIcon
                  name={filter.icon}
                  color={isActive ? Colors.accent : Colors.textMuted}
                  size={18}
                />
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {filterType ? (
        <View className="mt-3">
          <TouchableOpacity
            activeOpacity={0.76}
            accessibilityLabel={`Select ${activeFilter?.label ?? 'activity'} filter`}
            accessibilityRole="button"
            className="h-11 flex-row items-center rounded-xl px-3"
            onPress={() => setIsSelectOpen((current) => !current)}
            style={{
              backgroundColor: Colors.surfaceContainer,
              borderColor: selectedFilterId ? Colors.accent : Colors.borderFaint,
              borderWidth: 1,
            }}
          >
            <MaterialIcon
              name={activeFilter?.icon ?? 'filter'}
              color={selectedFilterId ? Colors.accent : Colors.textMuted}
              size={18}
            />
            <Text className="ml-2 flex-1 text-[13px] font-semibold" style={{ color: Colors.text }} numberOfLines={1}>
              {selectLabel}
            </Text>
            {isFilterLoading ? (
              <ActivityIndicator color={Colors.accent} size="small" />
            ) : (
              <MaterialIcon
                name={isSelectOpen ? 'expand_less' : 'expand_more'}
                color={Colors.textMuted}
                size={20}
              />
            )}
          </TouchableOpacity>

          {isSelectOpen ? (
            <View
              className="mt-2 overflow-hidden rounded-xl"
              style={{
                backgroundColor: Colors.surfaceContainer,
                borderColor: Colors.borderSubtle,
                borderWidth: 1,
              }}
            >
              <ScrollView style={{ maxHeight: 220 }} nestedScrollEnabled>
                <TouchableOpacity
                  activeOpacity={0.72}
                  className="flex-row items-center px-3 py-3"
                  onPress={() => {
                    onFilterOptionChange(null);
                    setIsSelectOpen(false);
                  }}
                  style={{ borderBottomColor: Colors.borderFaint, borderBottomWidth: 1 }}
                >
                  <Text className="flex-1 text-[13px] font-semibold" style={{ color: !selectedFilterId ? Colors.accent : Colors.textMuted }}>
                    {`All ${filterTypeLabel(filterType)}s`}
                  </Text>
                  {!selectedFilterId ? <MaterialIcon name="check" color={Colors.accent} size={16} /> : null}
                </TouchableOpacity>

                {filterOptions.map((option, index) => {
                  const isActive = option.id === selectedFilterId;

                  return (
                    <TouchableOpacity
                      key={option.id}
                      activeOpacity={0.72}
                      accessibilityRole="button"
                      accessibilityState={{ selected: isActive }}
                      className="flex-row items-center px-3 py-3"
                      onPress={() => {
                        onFilterOptionChange(option.id);
                        setIsSelectOpen(false);
                      }}
                      style={{
                        borderBottomColor: Colors.borderFaint,
                        borderBottomWidth: index === filterOptions.length - 1 ? 0 : 1,
                      }}
                    >
                      <View className="flex-1">
                        <Text
                          className="text-[13px] font-semibold"
                          numberOfLines={1}
                          style={{ color: isActive ? Colors.accent : Colors.text }}
                        >
                          {option.label}
                        </Text>
                        {option.subtitle ? (
                          <Text className="mt-0.5 text-[11px]" numberOfLines={1} style={{ color: Colors.textMuted }}>
                            {option.subtitle}
                          </Text>
                        ) : null}
                      </View>
                      {isActive ? <MaterialIcon name="check" color={Colors.accent} size={16} /> : null}
                    </TouchableOpacity>
                  );
                })}

                {!isFilterLoading && filterOptions.length === 0 ? (
                  <Text className="px-3 py-3 text-[13px]" style={{ color: Colors.textMuted }}>
                    No options found.
                  </Text>
                ) : null}
              </ScrollView>
            </View>
          ) : null}
        </View>
      ) : null}

      <View className="mt-4">
        {isLoading ? (
          <View className="h-20 items-center justify-center">
            <ActivityIndicator color={Colors.accent} size="small" />
          </View>
        ) : errorMessage ? (
          <Text className="text-[13px]" style={{ color: Colors.textMuted }}>
            {errorMessage}
          </Text>
        ) : activities.length > 0 ? (
          activities.map((activity, index) => (
            <ActivityRow
              key={`${activity.id}-${index}`}
              item={activity}
              onPress={
                activity.target && onActivityPress ? () => onActivityPress(activity) : undefined
              }
            />
          ))
        ) : (
          <Text className="text-[13px]" style={{ color: Colors.textMuted }}>
            No activity yet.
          </Text>
        )}
      </View>
    </View>
  );
}
