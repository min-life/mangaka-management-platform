import React from 'react';
import { Image, Text, View } from 'react-native';

import MaterialIcon from '@/src/components/shared/MaterialIcon';
import { Colors } from '@/src/constants/colors';
import { relativeDate } from '@/src/services/formatters';
import { ResourceFolderNode } from '@/src/types/resources';

import { formatResourceDate } from './resourceFormatters';

interface ResourceFolderDetailHeroProps {
  folder: ResourceFolderNode;
  itemCount: number;
}

export default function ResourceFolderDetailHero({
  folder,
  itemCount,
}: ResourceFolderDetailHeroProps) {
  const isArc = folder.parentId === null;
  const statusLabel = isArc ? 'In progress' : 'Chapter';
  const itemLabel = itemCount === 1 ? '1 item' : `${itemCount} items`;

  return (
    <View className="px-4 pb-5 pt-2">
      <View
        className="h-[260px] w-full items-center justify-center overflow-hidden rounded-2xl"
        style={{ backgroundColor: folder.coverUri ? Colors.surfaceContainer : Colors.surface }}
      >
        {folder.coverUri ? (
          <Image source={{ uri: folder.coverUri }} className="h-full w-full" resizeMode="cover" />
        ) : (
          <View className="items-center gap-2">
            <MaterialIcon
              name={isArc ? 'folder' : 'description'}
              color={isArc ? Colors.iconFolder : Colors.statusProgress}
              size={42}
            />
            <Text className="text-[12px] font-bold uppercase" style={{ color: Colors.textFaint }}>
              No thumbnail
            </Text>
          </View>
        )}

        <View
          className="absolute right-3 top-3 flex-row items-center rounded-full px-3 py-1.5"
          style={{ backgroundColor: 'rgba(34,40,49,0.78)' }}
        >
          <View
            className="mr-2 h-2 w-2 rounded-full"
            style={{ backgroundColor: isArc ? Colors.statusProgress : Colors.iconFolder }}
          />
          <Text className="text-[10px] font-black uppercase" style={{ color: Colors.text }}>
            {statusLabel}
          </Text>
        </View>
      </View>

      <Text
        className="mt-4 text-[26px] font-black leading-tight"
        style={{ color: Colors.text }}
        numberOfLines={3}
      >
        {folder.name}
      </Text>

      <Text className="mt-2 text-[13px] leading-5" style={{ color: Colors.textMuted }}>
        {folder.description ?? 'Manga production content for this section.'}
      </Text>

      <View className="mt-4 flex-row flex-wrap gap-3">
        <View className="flex-row items-center">
          <MaterialIcon name="folder" color={Colors.textFaint} size={14} />
          <Text className="ml-1.5 text-[11px] font-semibold" style={{ color: Colors.textMuted }}>
            {isArc ? 'Story arc' : 'Chapter'} - {itemLabel}
          </Text>
        </View>

        <View className="flex-row items-center">
          <MaterialIcon name="calendar_today" color={Colors.textFaint} size={13} />
          <Text className="ml-1.5 text-[11px] font-semibold" style={{ color: Colors.textMuted }}>
            Created {formatResourceDate(folder.createdAt)}
          </Text>
        </View>

        <View className="flex-row items-center">
          <MaterialIcon name="edit" color={Colors.textFaint} size={14} />
          <Text className="ml-1.5 text-[11px] font-semibold" style={{ color: Colors.textMuted }}>
            Updated {relativeDate(folder.updatedAt)}
          </Text>
        </View>
      </View>
    </View>
  );
}
