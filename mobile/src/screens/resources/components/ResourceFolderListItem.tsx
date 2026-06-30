import React from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';

import { Colors } from '@/src/constants/colors';
import { ResourceFolderNode } from '@/src/types/resources';

import {
  getResourceCreatorName,
  getResourceDateRange,
  getResourceInitials,
} from './resourceFormatters';

interface ResourceFolderListItemProps {
  folder: ResourceFolderNode;
  isLast: boolean;
  onPress: () => void;
}

export default function ResourceFolderListItem({
  folder,
  isLast,
  onPress,
}: ResourceFolderListItemProps) {
  const creatorName = getResourceCreatorName(folder);
  const dateRange = getResourceDateRange(folder);

  return (
    <TouchableOpacity
      activeOpacity={0.78}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${folder.name}, created by ${creatorName}, ${dateRange}`}
      className="flex-row px-4 py-3"
      style={{
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: Colors.borderFaint,
      }}
    >
      <View
        className="h-[76px] w-[76px] items-center justify-center overflow-hidden rounded-xl"
        style={{ backgroundColor: Colors.iconFolder }}
      >
        {folder.coverUri ? (
          <Image
            source={{ uri: folder.coverUri }}
            className="h-full w-full"
            resizeMode="cover"
          />
        ) : (
          <Text className="text-xl font-black" style={{ color: Colors.bg }}>
            {getResourceInitials(folder.name)}
          </Text>
        )}
      </View>

      <View className="ml-4 flex-1 justify-center">
        <Text className="text-[16px] font-bold" style={{ color: Colors.text }} numberOfLines={1}>
          {folder.name}
        </Text>
        <Text
          className="mt-1 text-[13px] font-semibold"
          style={{ color: 'rgba(237,241,251,0.72)' }}
          numberOfLines={1}
        >
          {creatorName}
        </Text>
        <Text className="mt-1 text-[12px]" style={{ color: Colors.textMuted }} numberOfLines={1}>
          {dateRange}
        </Text>
      </View>
    </TouchableOpacity>
  );
}
