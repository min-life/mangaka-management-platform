import React, { useMemo } from 'react';
import { ScrollView, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import BottomNavBar from '@/src/components/shared/BottomNavBar';
import { Colors } from '@/src/constants/colors';
import { PROJECTS } from '@/src/constants/projectsData';
import {
  findResourceFolder,
  getFolderChildren,
  getFolderFiles,
  getProjectResourceTree,
} from '@/src/constants/resourcesData';
import { RootStackParamList } from '@/src/navigation/types';
import { ResourceNode } from '@/src/types/resources';
import { ProjectDetailTopBar } from '@/src/screens/projectDetail/components';
import {
  ResourceDetailRow,
  ResourceFolderDetailHero,
  ResourcesEmptyState,
} from '@/src/screens/resources/components';

type ResourceFolderDetailScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'ResourceFolderDetail'
>;

export default function ResourceFolderDetailScreen({
  navigation,
  route,
}: ResourceFolderDetailScreenProps) {
  const project = PROJECTS.find((item) => item.id === route.params.projectId);
  const root = getProjectResourceTree(route.params.projectId);
  const folder = findResourceFolder(root, route.params.folderId);

  const folderItems = useMemo<ResourceNode[]>(() => {
    if (!folder) return [];
    return [...getFolderChildren(folder), ...getFolderFiles(folder)];
  }, [folder]);

  const handleNodePress = (node: ResourceNode) => {
    if (node.type === 'folder') {
      navigation.push('ResourceFolderDetail', {
        projectId: route.params.projectId,
        folderId: node.id,
      });
      return;
    }

    navigation.navigate('ResourceFile', {
      projectId: route.params.projectId,
      fileId: node.id,
      parentFolderId: route.params.folderId,
    });
  };

  if (!project || !folder) {
    return (
      <View className="flex-1" style={{ backgroundColor: Colors.bg }}>
        <ProjectDetailTopBar onBack={() => navigation.goBack()} />
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-center text-[15px] font-medium" style={{ color: Colors.text }}>
            Resource folder not found
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1" style={{ backgroundColor: Colors.bg }}>
      <ProjectDetailTopBar onBack={() => navigation.goBack()} />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        <ResourceFolderDetailHero folder={folder} />

        <View className="pb-2 pt-1">
          {folderItems.length > 0 ? (
            folderItems.map((node, index) => (
              <ResourceDetailRow
                key={node.id}
                node={node}
                isLast={index === folderItems.length - 1}
                onPress={() => handleNodePress(node)}
              />
            ))
          ) : (
            <ResourcesEmptyState
              title="This folder is empty"
              message="Folder and file items will appear here."
            />
          )}
        </View>
      </ScrollView>

      <BottomNavBar activeTab="home" />
    </View>
  );
}
