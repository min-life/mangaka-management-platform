import React from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';

import MaterialIcon from '@/src/components/shared/MaterialIcon';
import { Colors } from '@/src/constants/colors';
import { ProjectMaterialFile } from '@/src/services/resourceApi';

import { formatResourceDate } from './resourceFormatters';

interface ResourceMaterialCardItemProps {
  material: ProjectMaterialFile;
  onPress: () => void;
}

export default function ResourceMaterialCardItem({
  material,
  onPress,
}: ResourceMaterialCardItemProps) {
  const { file, latestVersion, versionCount } = material;
  const layerCount = latestVersion.materials.layers?.length ?? 0;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Open material ${latestVersion.materials.title}`}
      className="overflow-hidden rounded-2xl"
      style={{
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.borderFaint,
      }}
    >
      <View className="h-[176px] w-full overflow-hidden" style={{ backgroundColor: Colors.iconBg }}>
        <Image
          source={{ uri: latestVersion.materials.imageUri }}
          className="h-full w-full"
          resizeMode="cover"
        />
      </View>

      <View className="p-4">
        <View className="flex-row items-start justify-between gap-3">
          <View className="flex-1">
            <Text
              className="text-[17px] font-black"
              style={{ color: Colors.text }}
              numberOfLines={1}
            >
              {file.name}
            </Text>
            <Text
              className="mt-1 text-[13px] font-semibold"
              style={{ color: 'rgba(237,241,251,0.72)' }}
              numberOfLines={1}
            >
              {latestVersion.materials.title}
            </Text>
          </View>
          <MaterialIcon name="chevron_right" color={Colors.textFaint} size={23} />
        </View>

        {latestVersion.materials.note ? (
          <Text
            className="mt-3 text-[13px] leading-5"
            style={{ color: Colors.textMuted }}
            numberOfLines={2}
          >
            {latestVersion.materials.note}
          </Text>
        ) : null}

        <View className="mt-4 flex-row flex-wrap gap-x-4 gap-y-2">
          <View className="flex-row items-center gap-1.5">
            <MaterialIcon name="image" color={Colors.statusProgress} size={16} />
            <Text className="text-[12px] font-semibold" style={{ color: Colors.textMuted }}>
              {versionCount} version{versionCount === 1 ? '' : 's'}
            </Text>
          </View>
          <View className="flex-row items-center gap-1.5">
            <MaterialIcon name="description" color={Colors.iconFolder} size={16} />
            <Text className="text-[12px] font-semibold" style={{ color: Colors.textMuted }}>
              {layerCount} layer{layerCount === 1 ? '' : 's'}
            </Text>
          </View>
        </View>

        <Text className="mt-3 text-[12px]" style={{ color: Colors.textFaint }} numberOfLines={1}>
          {latestVersion.createdByName ?? 'Unknown creator'} -{' '}
          {formatResourceDate(latestVersion.createdAt)}
        </Text>
      </View>
    </TouchableOpacity>
  );
}
