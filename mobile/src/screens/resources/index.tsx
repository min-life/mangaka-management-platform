import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import ApiStateView from '@/src/components/shared/ApiStateView';
import AppRefreshControl from '@/src/components/shared/AppRefreshControl';
import BottomNavBar from '@/src/components/shared/BottomNavBar';
import { Colors } from '@/src/constants/colors';
import { RootStackParamList } from '@/src/navigation/types';
import { fetchProjectRootFolders } from '@/src/services/resourceApi';
import { ResourceFolderNode } from '@/src/types/resources';

import {
  ResourceFolderCardItem,
  ResourceFolderListItem,
  ResourceSearchBar,
  ResourceTopBar,
  ResourceViewMode,
  ResourcesEmptyState,
} from './components';

type ResourcesScreenProps = NativeStackScreenProps<RootStackParamList, 'Resources'>;

export default function ResourcesScreen({ navigation, route }: ResourcesScreenProps) {
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<ResourceViewMode>('list');
  const [rootFolders, setRootFolders] = useState<ResourceFolderNode[]>([]);
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
        const folders = await fetchProjectRootFolders(route.params.projectId);
        setRootFolders(folders);
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
        <View className="px-4 pb-4">
          <View className="relative z-20 mt-4 flex-row items-center">
            <ResourceSearchBar search={search} onSearchChange={setSearch} />
          </View>
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
            {visibleFolders.length > 0 ? (
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
            ) : (
              <ResourcesEmptyState
                title="No resource folders"
                message="Story arcs and chapter folders will appear here."
              />
            )}
          </View>
        )}
      </ScrollView>

      <BottomNavBar activeTab="home" />
    </View>
  );
}
