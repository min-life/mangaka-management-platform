import React from 'react';
import { Text, View } from 'react-native';

import MaterialIcon from '@/src/components/shared/MaterialIcon';
import { Colors } from '@/src/constants/colors';
import { ResourceFolderNode } from '@/src/types/resources';

import {
  getDirectChapterCount,
  getPageCount,
  getResourceDateRange,
} from './resourceFormatters';

interface ResourceFolderDetailHeroProps {
  folder: ResourceFolderNode;
}

function DetailMetric({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string | number;
}) {
  return (
    <View
      className="flex-1 rounded-2xl px-3 py-3"
      style={{
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.borderFaint,
      }}
    >
      <MaterialIcon name={icon} color={Colors.accent} size={19} />
      <Text className="mt-2 text-[18px] font-black" style={{ color: Colors.text }}>
        {value}
      </Text>
      <Text className="mt-0.5 text-[11px] font-semibold" style={{ color: Colors.textMuted }}>
        {label}
      </Text>
    </View>
  );
}

export default function ResourceFolderDetailHero({
  folder,
}: ResourceFolderDetailHeroProps) {
  const chapterCount = getDirectChapterCount(folder);
  const pageCount = getPageCount(folder);
  const isArc = folder.parentId === null;

  return (
    <View className="px-4 pb-5 pt-4">
      <View className="flex-row items-center">
        <View
          className="h-11 w-11 items-center justify-center rounded-2xl"
          style={{ backgroundColor: isArc ? Colors.iconFolder : Colors.statusProgress }}
        >
          <MaterialIcon name={isArc ? 'folder' : 'description'} color={Colors.bg} size={23} />
        </View>
        <View className="ml-3 flex-1">
          <Text className="text-[12px] font-bold uppercase" style={{ color: Colors.textFaint }}>
            {isArc ? 'Story Arc' : 'Chapter'}
          </Text>
          <Text className="mt-0.5 text-[13px]" style={{ color: Colors.textMuted }}>
            {getResourceDateRange(folder)}
          </Text>
        </View>
      </View>

      <Text
        className="mt-5 text-[30px] font-black leading-tight"
        style={{ color: Colors.text }}
        numberOfLines={3}
      >
        {folder.name}
      </Text>

      <Text className="mt-3 text-[14px] leading-6" style={{ color: Colors.textMuted }}>
        {folder.description ?? 'Manga production content for this section.'}
      </Text>

      <View className="mt-5 flex-row gap-3">
        <DetailMetric icon="folder" label="Chapters" value={chapterCount} />
        <DetailMetric icon="image" label="Pages" value={pageCount} />
      </View>
    </View>
  );
}
