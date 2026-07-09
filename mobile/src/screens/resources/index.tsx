import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import ApiStateView from '@/src/components/shared/ApiStateView';
import AppRefreshControl from '@/src/components/shared/AppRefreshControl';
import BottomNavBar from '@/src/components/shared/BottomNavBar';
import { Colors } from '@/src/constants/colors';
import { RootStackParamList } from '@/src/navigation/types';
import {
  fetchProjectMaterials,
  fetchProjectRootFolders,
  ProjectMaterialFile,
} from '@/src/services/resourceApi';
import { ResourceFolderNode } from '@/src/types/resources';

import {
  ResourceFolderCardItem,
  ResourceFolderListItem,
  ResourceMaterialCardItem,
  ResourceMaterialListItem,
  ResourceSearchBar,
  ResourceTopBar,
  ResourceViewMode,
  ResourcesEmptyState,
} from './components';

type ResourcesScreenProps = NativeStackScreenProps<RootStackParamList, 'Resources'>;
type ResourceLibraryMode = 'arcs' | 'materials';

const RESOURCE_LIBRARY_MODES: Array<{
  label: string;
  mode: ResourceLibraryMode;
}> = [
  { label: 'Story arcs', mode: 'arcs' },
  { label: 'Materials', mode: 'materials' },
];

function ResourceLibraryToggle({
  activeMode,
  onModeChange,
}: {
  activeMode: ResourceLibraryMode;
  onModeChange: (mode: ResourceLibraryMode) => void;
}) {
  return (
    <View
      className="mt-4 flex-row rounded-full p-1"
      style={{
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.borderFaint,
      }}
    >
      {RESOURCE_LIBRARY_MODES.map((item) => {
        const isActive = activeMode === item.mode;

        return (
          <TouchableOpacity
            key={item.mode}
            activeOpacity={0.76}
            onPress={() => onModeChange(item.mode)}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
            className="flex-1 items-center rounded-full px-3 py-2.5"
            style={{ backgroundColor: isActive ? Colors.surfaceContainer : 'transparent' }}
          >
            <Text
              className="text-[13px] font-bold"
              style={{ color: isActive ? Colors.text : Colors.textMuted }}
              numberOfLines={1}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function ResourcesScreen({ navigation, route }: ResourcesScreenProps) {
  const [search, setSearch] = useState('');
  const [activeMode, setActiveMode] = useState<ResourceLibraryMode>('arcs');
  const [viewMode, setViewMode] = useState<ResourceViewMode>('list');
  const [rootFolders, setRootFolders] = useState<ResourceFolderNode[]>([]);
  const [materialFiles, setMaterialFiles] = useState<ProjectMaterialFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const loadResources = useCallback(
    async (options: { showLoading?: boolean } = {}) => {
      const showLoading = options.showLoading ?? true;
      if (showLoading) setIsLoading(true);
      else setIsRefreshing(true);
      setErrorMessage('');

      try {
        const [folders, materials] = await Promise.all([
          fetchProjectRootFolders(route.params.projectId),
          fetchProjectMaterials(route.params.projectId),
        ]);
        setRootFolders(folders);
        setMaterialFiles(materials);
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : 'Không thể tải resources.');
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [route.params.projectId],
  );

  useEffect(() => {
    void loadResources();
  }, [loadResources]);

  const handleRefresh = useCallback(() => {
    void loadResources({ showLoading: false });
  }, [loadResources]);

  const visibleFolders = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return rootFolders;

    return rootFolders.filter((folder) =>
      [folder.name, folder.description, folder.createdByName]
        .filter(Boolean)
        .some((value) => value?.toLowerCase().includes(query)),
    );
  }, [rootFolders, search]);

  const visibleMaterials = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return materialFiles;

    return materialFiles.filter(({ file, latestVersion }) =>
      [
        file.name,
        file.description,
        latestVersion.materials.title,
        latestVersion.materials.note,
        latestVersion.createdByName,
      ]
        .filter(Boolean)
        .some((value) => value?.toLowerCase().includes(query)),
    );
  }, [materialFiles, search]);

  return (
    <View className="flex-1" style={{ backgroundColor: Colors.bg }}>
      <ResourceTopBar
        backLabel="Back"
        onBack={() => navigation.goBack()}
        onViewModeChange={setViewMode}
        title="Resource"
        viewMode={viewMode}
      />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 112 }}
        keyboardShouldPersistTaps="handled"
        // refreshControl={
        //   <AppRefreshControl onRefresh={handleRefresh} refreshing={isRefreshing} />
        // }
        showsVerticalScrollIndicator={false}
      >
        <View className="px-4">
          <ResourceSearchBar search={search} onSearchChange={setSearch} />
        </View>

        {isLoading ? (
          <ApiStateView type="loading" />
        ) : errorMessage ? (
          <ApiStateView type="error" message={errorMessage} onRetry={loadResources} />
        ) : (
          <View
            className={viewMode === 'card' ? 'gap-4 px-4 pt-4' : 'pt-2'}
            style={
              viewMode === 'list'
                ? { borderTopColor: Colors.borderFaint, borderTopWidth: 1 }
                : undefined
            }
          >
            {activeMode === 'arcs' && visibleFolders.length > 0 ? (
              visibleFolders.map((folder, index) =>
                viewMode === 'list' ? (
                  <ResourceFolderListItem
                    key={folder.id}
                    folder={folder}
                    isLast={index === visibleFolders.length - 1}
                    onPress={() =>
                      navigation.navigate('ResourceFolderDetail', {
                        projectId: route.params.projectId,
                        folderId: folder.id,
                      })
                    }
                  />
                ) : (
                  <ResourceFolderCardItem
                    key={folder.id}
                    folder={folder}
                    onPress={() =>
                      navigation.navigate('ResourceFolderDetail', {
                        projectId: route.params.projectId,
                        folderId: folder.id,
                      })
                    }
                  />
                ),
              )
            ) : activeMode === 'materials' && visibleMaterials.length > 0 ? (
              visibleMaterials.map((material, index) =>
                viewMode === 'list' ? (
                  <ResourceMaterialListItem
                    key={material.latestVersion.id}
                    isLast={index === visibleMaterials.length - 1}
                    material={material}
                    onPress={() =>
                      navigation.navigate('ResourceFile', {
                        projectId: route.params.projectId,
                        fileId: material.file.id,
                        parentFolderId: material.folderId,
                        initialTab: 'Materials',
                      })
                    }
                  />
                ) : (
                  <ResourceMaterialCardItem
                    key={material.latestVersion.id}
                    material={material}
                    onPress={() =>
                      navigation.navigate('ResourceFile', {
                        projectId: route.params.projectId,
                        fileId: material.file.id,
                        parentFolderId: material.folderId,
                        initialTab: 'Materials',
                      })
                    }
                  />
                ),
              )
            ) : (
              <ResourcesEmptyState
                title={activeMode === 'arcs' ? 'No resource folders' : 'No materials found'}
                message={
                  activeMode === 'arcs'
                    ? 'Story arcs and chapter folders will appear here.'
                    : 'Try another search term or add project materials.'
                }
              />
            )}
          </View>
        )}
      </ScrollView>

      <BottomNavBar activeTab="home" />
    </View>
  );
}
