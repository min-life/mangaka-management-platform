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

      <Text
        className="mt-3 text-[13px] leading-5"
        style={{ color: Colors.textMuted }}
        numberOfLines={2}
      >
        {application.description}
      </Text>

      {contextLabel && (
        <View className="mt-3 flex-row items-center gap-2">
          <MaterialIcon name="folder" color={Colors.iconFolder} size={15} />
          <Text className="text-[12px] font-semibold" style={{ color: Colors.textMuted }}>
            {contextLabel}
          </Text>
        </View>
      )}

      <View className="mt-4 flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <MaterialIcon name="attach" color={Colors.textMuted} size={16} />
          <Text className="text-[12px] font-medium" style={{ color: Colors.textMuted }}>
            {application.materials.pages.length} material
            {application.materials.pages.length === 1 ? '' : 's'}
          </Text>
        </View>
        <Text className="text-[12px]" style={{ color: Colors.textFaint }}>
          {application.updatedAtLabel}
        </Text>
      </View>
    </TouchableOpacity>
  );
}
