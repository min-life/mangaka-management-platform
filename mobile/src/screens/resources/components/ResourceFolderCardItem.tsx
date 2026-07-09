import React from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';

import MaterialIcon from '@/src/components/shared/MaterialIcon';
import { Colors } from '@/src/constants/colors';
import { ResourceFolderNode } from '@/src/types/resources';

import {
  getResourceDateRange,
  getResourceInitials,
} from './resourceFormatters';

interface ResourceFolderCardItemProps {
  folder: ResourceFolderNode;
  onPress: () => void;
}

export default function ResourceFolderCardItem({
  folder,
  onPress,
}: ResourceFolderCardItemProps) {
  const dateRange = getResourceDateRange(folder);

  return (
    <TouchableOpacity
      activeOpacity={0.78}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={folder.name}
      className="overflow-hidden rounded-[18px]"
      style={{
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.borderFaint,
      }}
    >
      <View
        className="h-[178px] w-full items-center justify-center"
        style={{ backgroundColor: folder.coverUri ? Colors.surfaceContainer : Colors.iconFolder }}
      >
        {folder.coverUri ? (
          <Image
            source={{ uri: folder.coverUri }}
            className="h-full w-full"
            resizeMode="cover"
          />
        ) : (
          <View className="items-center">
            <Text className="text-[42px] font-black" style={{ color: Colors.bg }}>
              {getResourceInitials(folder.name)}
            </Text>
            <Text className="mt-1 text-[12px] font-bold uppercase" style={{ color: Colors.bg }}>
              Story Arc
            </Text>
          </View>
        )}
      </View>

      <View className="px-4 py-4">
        <Text className="text-[20px] font-black" style={{ color: Colors.text }} numberOfLines={2}>
          {folder.name}
        </Text>
        <Text
          className="mt-2 text-[13px] leading-5"
          style={{ color: Colors.textMuted }}
          numberOfLines={2}
        >
          {folder.description ?? 'Story arc materials and chapter pages.'}
        </Text>

        <Text className="mt-4 text-[12px]" style={{ color: Colors.textFaint }} numberOfLines={1}>
          {dateRange}
        </Text>
      </View>
    </TouchableOpacity>
  );
}
