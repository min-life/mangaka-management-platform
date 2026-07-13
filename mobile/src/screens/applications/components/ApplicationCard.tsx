import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

import MaterialIcon from '@/src/components/shared/MaterialIcon';
import { Colors } from '@/src/constants/colors';
import { ApplicationItem } from '@/src/types/applications';

import ApplicationStatusBadge from './ApplicationStatusBadge';
import ApplicationTypeBadge from './ApplicationTypeBadge';

interface ApplicationCardProps {
  application: ApplicationItem;
  contextLabel?: string;
  onPress: () => void;
}

function ApplicationMetaItem({ icon, label }: { icon: string; label: string }) {
  return (
    <View className="min-w-0 flex-row items-center">
      <MaterialIcon name={icon} color={Colors.textMuted} size={15} />
      <Text
        className="ml-1.5 text-[12px] font-medium"
        style={{ color: Colors.textMuted }}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
}

export default function ApplicationCard({
  application,
  contextLabel,
  onPress,
}: ApplicationCardProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.82}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Open application ${application.title}`}
      className="rounded-xl p-4"
      style={{
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.borderSubtle,
      }}
    >
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1 gap-2">
          <ApplicationTypeBadge type={application.type} />
          <Text className="text-[16px] font-bold" style={{ color: Colors.text }} numberOfLines={2}>
            {application.title}
          </Text>
        </View>
        <ApplicationStatusBadge status={application.status} />
      </View>

      {application.description ? (
        <Text
          className="mt-3 text-[13px] leading-5"
          style={{ color: Colors.textMuted }}
          numberOfLines={2}
        >
          {application.description}
        </Text>
      ) : null}

      <View className="mt-4 flex-row flex-wrap gap-x-4 gap-y-2">
        {contextLabel ? <ApplicationMetaItem icon="folder" label={contextLabel} /> : null}
        <ApplicationMetaItem icon="person" label={application.createdBy || 'Unknown creator'} />
        <ApplicationMetaItem icon="calendar_today" label={application.createdAtLabel} />
        {application.verifyBy ? (
          <ApplicationMetaItem icon="verified" label={application.verifyBy} />
        ) : null}
      </View>

      <View className="mt-4 flex-row justify-end">
        <Text className="text-[12px]" style={{ color: Colors.textFaint }}>
          {application.updatedAtLabel}
        </Text>
      </View>
    </TouchableOpacity>
  );
}
