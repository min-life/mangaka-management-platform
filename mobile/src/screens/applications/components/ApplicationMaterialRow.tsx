import React from 'react';
import { Text, View } from 'react-native';

import MaterialIcon from '@/src/components/shared/MaterialIcon';
import { Colors } from '@/src/constants/colors';
import { ApplicationMaterialPage } from '@/src/types/applications';

interface ApplicationMaterialRowProps {
  material: ApplicationMaterialPage;
}

function getMaterialStatusColor(status: ApplicationMaterialPage['status']) {
  if (status === 'Ready') return Colors.statusDone;
  if (status === 'Blocked') return '#EF4444';
  return Colors.statusReview;
}

export default function ApplicationMaterialRow({ material }: ApplicationMaterialRowProps) {
  const color = getMaterialStatusColor(material.status);

  return (
    <View
      className="flex-row items-center gap-3 rounded-xl p-3"
      style={{
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.borderSubtle,
      }}
    >
      <View
        className="h-10 w-10 items-center justify-center rounded-lg"
        style={{ backgroundColor: Colors.overlayLight }}
      >
        <MaterialIcon name="file" color={Colors.textMuted} size={20} />
      </View>
      <View className="flex-1">
        <Text className="text-[14px] font-bold" style={{ color: Colors.text }} numberOfLines={1}>
          {material.title}
        </Text>
        <Text className="mt-0.5 text-[12px]" style={{ color: Colors.textMuted }} numberOfLines={1}>
          {material.fileName}
        </Text>
      </View>
      <View className="rounded-full px-2 py-1" style={{ backgroundColor: `${color}22` }}>
        <Text className="text-[10px] font-bold" style={{ color }}>
          {material.status}
        </Text>
      </View>
    </View>
  );
}

