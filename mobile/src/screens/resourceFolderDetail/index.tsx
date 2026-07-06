import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, TextInput, TouchableOpacity, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import ApiStateView from '@/src/components/shared/ApiStateView';
import BottomNavBar from '@/src/components/shared/BottomNavBar';
import MaterialIcon from '@/src/components/shared/MaterialIcon';
import { Colors } from '@/src/constants/colors';
import { RootStackParamList } from '@/src/navigation/types';
import { fetchFolderBundle } from '@/src/services/resourceApi';
import { ResourceFolderNode, ResourceNode } from '@/src/types/resources';
import {
  ResourceDetailCard,
  ResourceDetailRow,
  ResourceFolderDetailHero,
  ResourceFolderDetailTopBar,
  ResourceViewMode,
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
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<ResourceViewMode>('list');
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

  const visibleItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return folderItems;

    return folderItems.filter((node) =>
      [node.name, node.description, node.type === 'folder' ? 'chapter' : 'page']
        .filter(Boolean)
        .some((value) => value?.toLowerCase().includes(query)),
    );
  }, [folderItems, search]);

  const handleToggleViewMode = useCallback(() => {
    setViewMode((current) => (current === 'list' ? 'card' : 'list'));
  }, []);

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
        <ResourceFolderDetailTopBar onBack={() => navigation.goBack()} />
        <ApiStateView type="loading" />
      </View>
    );
  }

  if (errorMessage || !folder) {
    return (
      <View className="flex-1" style={{ backgroundColor: Colors.bg }}>
        <ResourceFolderDetailTopBar onBack={() => navigation.goBack()} />
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
      <ResourceFolderDetailTopBar onBack={() => navigation.goBack()} />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 112 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <ResourceFolderDetailHero folder={folder} itemCount={folderItems.length} />

        <View className="flex-row items-center gap-3 px-4 pb-4">
          <View className="relative flex-1">
            <View className="absolute bottom-0 left-4 top-0 z-10 justify-center">
              <MaterialIcon name="search" color={Colors.textPlaceholder} size={18} />
            </View>
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search chapters..."
              placeholderTextColor="rgba(237,241,251,0.58)"
              accessibilityLabel="Search chapters"
              className="h-12 rounded-xl pl-10 pr-4 text-[15px]"
              style={{ backgroundColor: Colors.surface, color: Colors.text }}
            />
          </View>

          <TouchableOpacity
            activeOpacity={0.72}
            accessibilityLabel={viewMode === 'list' ? 'Switch to grid view' : 'Switch to list view'}
            accessibilityRole="button"
            className="h-12 w-12 items-center justify-center rounded-xl"
            onPress={handleToggleViewMode}
            style={{
              backgroundColor: Colors.surface,
              borderColor: Colors.borderFaint,
              borderWidth: 1,
            }}
          >
            <MaterialIcon
              name={viewMode === 'list' ? 'view_module' : 'view_list'}
              color={Colors.text}
              size={22}
            />
          </TouchableOpacity>
        </View>

        <View className="pb-2">
          {visibleItems.length > 0 ? (
            viewMode === 'list' ? (
              visibleItems.map((node, index) => (
                <ResourceDetailRow
                  key={`${node.type}-${node.id}`}
                  node={node}
                  isLast={index === visibleItems.length - 1}
                  onPress={() => handleNodePress(node)}
                />
              ))
            ) : (
              <View className="flex-row flex-wrap justify-between px-4">
                {visibleItems.map((node) => (
                  <ResourceDetailCard
                    key={`${node.type}-${node.id}`}
                    node={node}
                    onPress={() => handleNodePress(node)}
                  />
                ))}
              </View>
            )
          ) : (
            <ResourcesEmptyState
              title={search.trim() ? 'No matching chapters' : 'This arc is empty'}
              message={
                search.trim()
                  ? 'Try another search term.'
                  : 'Chapter and page items will appear here.'
              }
            />
          )}
        </View>
      </ScrollView>

      <BottomNavBar activeTab="home" />
    </View>
  );
}
