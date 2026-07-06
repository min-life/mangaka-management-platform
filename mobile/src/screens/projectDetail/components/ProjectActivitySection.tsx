import React from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';

import ActivityRow from '@/src/components/sub-component/ActivityRow';
import { Colors } from '@/src/constants/colors';
import { ActivityItem } from '@/src/types/home';

interface ProjectActivitySectionProps {
  activities: ActivityItem[];
  errorMessage?: string;
  isLoading?: boolean;
  onActivityPress?: (activity: ActivityItem) => void;
}

export default function ProjectActivitySection({
  activities,
  errorMessage,
  isLoading,
  onActivityPress,
}: ProjectActivitySectionProps) {
  return (
    <View
      className="mx-4 mt-5 rounded-[18px] p-4"
      style={{
        backgroundColor: Colors.surface,
        borderColor: Colors.borderSubtle,
        borderWidth: 1,
      }}
    >
      <View className="flex-row items-center justify-between">
        <Text
          className="text-[11px] font-bold uppercase tracking-widest"
          style={{ color: Colors.textMuted, letterSpacing: 1.2 }}
        >
          Project Activity
        </Text>
      </View>

      <View className="mt-4" style={{ maxHeight: 292 }}>
        {isLoading ? (
          <View className="h-24 items-center justify-center">
            <ActivityIndicator color={Colors.accent} size="small" />
          </View>
        ) : errorMessage ? (
          <Text className="text-[13px]" style={{ color: Colors.textMuted }}>
            {errorMessage}
          </Text>
        ) : activities.length > 0 ? (
          <ScrollView
            nestedScrollEnabled
            showsVerticalScrollIndicator={activities.length > 4}
          >
            {activities.map((activity, index) => (
              <ActivityRow
                key={`${activity.id}-${index}`}
                item={activity}
                onPress={
                  activity.target && onActivityPress
                    ? () => onActivityPress(activity)
                    : undefined
                }
              />
            ))}
          </ScrollView>
        ) : (
          <Text className="text-[13px]" style={{ color: Colors.textMuted }}>
            No activity yet.
          </Text>
        )}
      </View>
    </View>
  );
}
