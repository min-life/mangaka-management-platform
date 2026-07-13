import React from 'react';
import { Text, View } from 'react-native';

import ActivityRow from '@/src/components/sub-component/ActivityRow';
import { Colors } from '@/src/constants/colors';
import { ActivityItem } from '@/src/types/home';

export default function TodayActivitySection({
  activities,
  onActivityPress,
}: {
  activities: ActivityItem[];
  onActivityPress?: (activity: ActivityItem) => void;
}) {
  return (
    <View className="mt-8 gap-6">
      <Text className="text-xl font-bold" style={{ color: Colors.text }}>
        Today
      </Text>

      {activities.map((activity, index) => (
        <ActivityRow
          key={`${activity.id}-${index}`}
          item={activity}
          onPress={activity.target ? () => onActivityPress?.(activity) : undefined}
        />
      ))}
    </View>
  );
}
