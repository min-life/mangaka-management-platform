import React from 'react';
import { Text, View } from 'react-native';

import ActivityRow from '@/src/components/sub-component/ActivityRow';
import { Colors } from '@/src/constants/colors';
import { ACTIVITIES } from '@/src/constants/homeData';
import { ActivityItem } from '@/src/types/home';

export default function TodayActivitySection({
  activities = ACTIVITIES,
}: {
  activities?: ActivityItem[];
}) {
  return (
    <View className="mt-8 gap-6">
      <Text className="text-xl font-bold" style={{ color: Colors.text }}>
        Today
      </Text>

      {activities.map((activity) => (
        <ActivityRow key={activity.id} item={activity} />
      ))}
    </View>
  );
}
