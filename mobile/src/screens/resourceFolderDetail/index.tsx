import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import ApiStateView from '@/src/components/shared/ApiStateView';
import BottomNavBar from '@/src/components/shared/BottomNavBar';
import { Colors } from '@/src/constants/colors';
import { RootStackParamList } from '@/src/navigation/types';
import { fetchFolderBundle } from '@/src/services/resourceApi';
import { ResourceFolderNode, ResourceNode } from '@/src/types/resources';
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
  const [folder, setFolder] = useState<ResourceFolderNode | null>(null);
  const [folderItems, setFolderItems] = useState<ResourceNode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const loadFolder = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const bundle = await fetchFolderBundle(route.params.folderId);
      setFolder(bundle.folder);
      setFolderItems(bundle.items);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Không thể tải folder.');
    } finally {
      setIsLoading(false);
    }
  }, [route.params.folderId]);

  useEffect(() => {
    void loadFolder();
  }, [loadFolder]);

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

  if (isLoading) {
    return (
      <View className="flex-1" style={{ backgroundColor: Colors.bg }}>
        <ProjectDetailTopBar onBack={() => navigation.goBack()} />
        <ApiStateView type="loading" />
      </View>
    );
  }

  if (errorMessage || !folder) {
    return (
      <View className="flex-1" style={{ backgroundColor: Colors.bg }}>
        <ProjectDetailTopBar onBack={() => navigation.goBack()} />
        <ApiStateView
          type="error"
          message={errorMessage || 'Resource folder not found'}
          onRetry={loadFolder}
        />
      </View>
    );
  }

  return (
    <View className="flex-1" style={{ backgroundColor: Colors.bg }}>
      <ProjectDetailTopBar onBack={() => navigation.goBack()} />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 112 }}
        showsVerticalScrollIndicator={false}
      >
        <ResourceFolderDetailHero folder={folder} />

        <View className="pb-2 pt-1">
          {folderItems.length > 0 ? (
            folderItems.map((node, index) => (
              <ResourceDetailRow
                key={`${node.type}-${node.id}`}
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
