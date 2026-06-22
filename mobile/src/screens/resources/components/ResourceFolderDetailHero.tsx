import React from 'react';
import { Text, View } from 'react-native';

import MaterialIcon from '@/src/components/shared/MaterialIcon';
import { Colors } from '@/src/constants/colors';
import { ResourceFolderNode } from '@/src/types/resources';

interface ResourceFolderDetailHeroProps {
  folder: ResourceFolderNode;
}

export default function ResourceFolderDetailHero({
  folder,
}: ResourceFolderDetailHeroProps) {
  const folderCount = folder.children.filter(
    (node) => node.type === 'folder',
  ).length;
  const fileCount = folder.children.filter((node) => node.type === 'file').length;

  return (
    <View className="px-4 pb-6 pt-5">
      <View className="flex-row items-center">
        <View
          className="h-9 w-9 items-center justify-center rounded-full"
          style={{ backgroundColor: 'rgba(77,166,255,0.16)' }}
        >
          <MaterialIcon name="folder" color={Colors.statusProgress} size={22} />
        </View>
        <Text
          className="ml-3 flex-1 text-[15px]"
          style={{ color: 'rgba(237,241,251,0.68)' }}
          numberOfLines={1}
        >
          Resource folder
        </Text>
      </View>

      <Text
        className="mt-5 text-3xl font-bold leading-tight"
        style={{ color: Colors.text }}
        numberOfLines={2}
      >
        {folder.name}
      </Text>

      <Text
        className="mt-5 text-[15px]"
        style={{ color: Colors.text }}
        numberOfLines={3}
      >
        {folder.description ?? 'No description'}
      </Text>

      <View className="mt-5 flex-row">
        <Text className="text-[12px]" style={{ color: Colors.textMuted }}>
          {folderCount} folder{folderCount === 1 ? '' : 's'}
        </Text>
        <Text className="mx-2 text-[12px]" style={{ color: Colors.textFaint }}>
          /
        </Text>
        <Text className="text-[12px]" style={{ color: Colors.textMuted }}>
          {fileCount} file{fileCount === 1 ? '' : 's'}
        </Text>
      </View>
    </View>
  );
}
