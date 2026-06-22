import React, { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import BottomNavBar from '@/src/components/shared/BottomNavBar';
import { Colors } from '@/src/constants/colors';
import {
  findParentFolderId,
  findResourceNode,
  getProjectResourceTree,
} from '@/src/constants/resourcesData';
import { RootStackParamList } from '@/src/navigation/types';
import { ResourceFolderNode } from '@/src/types/resources';

import {
  ResourceDetailRow,
  ResourceFolderDetailHero,
  ResourceFolderDetailTopBar,
  ResourceListRow,
  ResourceSearchBar,
  ResourceTopBar,
  ResourcesEmptyState,
} from './components';

type ResourcesScreenProps = NativeStackScreenProps<RootStackParamList, 'Resources'>;

export default function ResourcesScreen({ navigation, route }: ResourcesScreenProps) {
  const root = getProjectResourceTree(route.params.projectId);
  const [currentFolderId, setCurrentFolderId] = useState(root.id);
  const [search, setSearch] = useState('');

  const currentFolder = useMemo(() => {
    const node = findResourceNode(root, currentFolderId);
    return node?.type === 'folder' ? node : root;
  }, [currentFolderId, root]);

  const parentFolder = useMemo(() => {
    const parentId = findParentFolderId(root, currentFolder.id);
    const parent = parentId ? findResourceNode(root, parentId) : undefined;
    return parent?.type === 'folder' ? parent : undefined;
  }, [currentFolder.id, root]);

  const isRoot = currentFolder.id === root.id;

  const rootFolders = useMemo(
    () =>
      root.children.filter(
        (node) => node.type === 'folder' && node.parentId === null,
      ),
    [root.children],
  );

  const visibleRootFolders = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return rootFolders;

    return rootFolders.filter((node) =>
      node.name.toLowerCase().includes(query),
    );
  }, [rootFolders, search]);

  const handleBack = () => {
    if (isRoot) {
      navigation.goBack();
      return;
    }

    setSearch('');
    setCurrentFolderId(parentFolder?.id ?? root.id);
  };

  const handleNodePress = (node: ResourceFolderNode['children'][number]) => {
    setSearch('');

    if (node.type === 'folder') {
      setCurrentFolderId(node.id);
      return;
    }

    navigation.navigate('ResourceFile', {
      projectId: route.params.projectId,
      fileId: node.id,
      parentFolderId: currentFolder.id,
    });
  };

  const backLabel = 'Back';

  if (isRoot) {
    return (
      <View className="flex-1" style={{ backgroundColor: Colors.bg }}>
        <ResourceTopBar backLabel={backLabel} title="Resource" onBack={handleBack} />
        <ResourceSearchBar search={search} onSearchChange={setSearch} />

        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 24 }}
          showsVerticalScrollIndicator
        >
          <View
            style={{
              borderTopWidth: 1,
              borderBottomWidth: 1,
              borderColor: Colors.borderFaint,
            }}
          >
            {visibleRootFolders.length > 0 ? (
              visibleRootFolders.map((node, index) => (
                <ResourceListRow
                  key={node.id}
                  node={node}
                  isLast={index === visibleRootFolders.length - 1}
                  onPress={() => handleNodePress(node)}
                />
              ))
            ) : (
              <ResourcesEmptyState />
            )}
          </View>
        </ScrollView>

        <BottomNavBar activeTab="home" />
      </View>
    );
  }

  return (
    <View className="flex-1" style={{ backgroundColor: Colors.bg }}>
      <ResourceFolderDetailTopBar onBack={handleBack} />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        <ResourceFolderDetailHero folder={currentFolder} />

        <View
          style={{
            borderTopWidth: 1,
            borderBottomWidth: 1,
            borderColor: Colors.borderFaint,
          }}
        >
          {currentFolder.children.length > 0 ? (
            currentFolder.children.map((node, index) => (
              <ResourceDetailRow
                key={node.id}
                node={node}
                isLast={index === currentFolder.children.length - 1}
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
