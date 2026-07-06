import React from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';

import MaterialIcon from '@/src/components/shared/MaterialIcon';
import { Colors } from '@/src/constants/colors';
import { ProjectMaterialFile } from '@/src/services/resourceApi';

import { formatResourceDate } from './resourceFormatters';

interface ResourceMaterialListItemProps {
  isLast: boolean;
  material: ProjectMaterialFile;
  onPress: () => void;
}

export default function ResourceMaterialListItem({
  isLast,
  material,
  onPress,
}: ResourceMaterialListItemProps) {
  const { file, latestVersion } = material;
  const imageUri = latestVersion.materials.imageUri;

  return (
    <TouchableOpacity
      activeOpacity={0.78}
      accessibilityLabel={`Open material ${latestVersion.materials.title}`}
      accessibilityRole="button"
      className="flex-row px-4 py-3"
      onPress={onPress}
      style={{
        borderBottomColor: Colors.borderFaint,
        borderBottomWidth: isLast ? 0 : 1,
      }}
    >
      <View
        className="h-[76px] w-[76px] items-center justify-center overflow-hidden rounded-xl"
        style={{ backgroundColor: Colors.iconBg }}
      >
        {imageUri ? (
          <Image source={{ uri: imageUri }} className="h-full w-full" resizeMode="cover" />
        ) : (
          <MaterialIcon name="image" color={Colors.textFaint} size={28} />
        )}
      </View>

      <View className="ml-4 flex-1 justify-center">
        <Text className="text-[16px] font-bold" numberOfLines={1} style={{ color: Colors.text }}>
          {file.name}
        </Text>
        <Text
          className="mt-1 text-[13px] font-semibold"
          numberOfLines={1}
          style={{ color: 'rgba(237,241,251,0.72)' }}
        >
          {latestVersion.materials.title}
        </Text>
        <Text className="mt-1 text-[12px]" numberOfLines={1} style={{ color: Colors.textMuted }}>
          {latestVersion.createdByName ?? 'Unknown creator'} -{' '}
          {formatResourceDate(latestVersion.createdAt)}
        </Text>
      </View>

      <View className="justify-center pl-2">
        <MaterialIcon name="chevron_right" color={Colors.textFaint} size={20} />
      </View>
    </TouchableOpacity>
  );
}
