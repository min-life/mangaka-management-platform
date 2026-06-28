import React from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';

import MaterialIcon from '@/src/components/shared/MaterialIcon';
import { Colors } from '@/src/constants/colors';
import { ResourceFolderNode } from '@/src/types/resources';

import {
  getDirectChapterCount,
  getPageCount,
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
  const chapterCount = getDirectChapterCount(folder);
  const pageCount = getPageCount(folder);

  return (
    <TouchableOpacity
      activeOpacity={0.78}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${folder.name}, ${chapterCount} chapters, ${pageCount} pages`}
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

        <View className="mt-4 flex-row items-center">
          <View className="flex-row items-center">
            <MaterialIcon name="folder" color={Colors.iconFolder} size={17} />
            <Text className="ml-1.5 text-[12px] font-semibold" style={{ color: Colors.text }}>
              {chapterCount} chapter{chapterCount === 1 ? '' : 's'}
            </Text>
          </View>
          <View className="ml-4 flex-row items-center">
            <MaterialIcon name="image" color={Colors.statusProgress} size={17} />
            <Text className="ml-1.5 text-[12px] font-semibold" style={{ color: Colors.text }}>
              {pageCount} page{pageCount === 1 ? '' : 's'}
            </Text>
          </View>
        </View>

        <Text className="mt-3 text-[12px]" style={{ color: Colors.textFaint }} numberOfLines={1}>
          {dateRange}
        </Text>
      </View>
    </TouchableOpacity>
  );
}
