import React, { useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import BottomNavBar from '@/src/components/shared/BottomNavBar';
import { Colors } from '@/src/constants/colors';
import { getProjectRootFolders } from '@/src/constants/resourcesData';
import { RootStackParamList } from '@/src/navigation/types';

import {
  ResourceFolderCardItem,
  ResourceSearchBar,
  ResourceTopBar,
  ResourcesEmptyState,
} from './components';

type ResourcesScreenProps = NativeStackScreenProps<RootStackParamList, 'Resources'>;

export default function ResourcesScreen({ navigation, route }: ResourcesScreenProps) {
  const [search, setSearch] = useState('');

  const rootFolders = useMemo(
    () => getProjectRootFolders(route.params.projectId),
    [route.params.projectId],
  );

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
      <ResourceTopBar backLabel="Back" title="Resource" onBack={() => navigation.goBack()} />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 24 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className="px-4">
          <View className="pb-2 pt-3">
            <Text className="text-[30px] font-black" style={{ color: Colors.text }}>
              Story arcs
            </Text>
            <Text className="mt-2 text-[14px] leading-6" style={{ color: Colors.textMuted }}>
              Browse this project by arc, then open chapters and manga pages.
            </Text>
          </View>
          <ResourceSearchBar search={search} onSearchChange={setSearch} />
        </View>

        <View className="gap-4 px-4 pt-4">
          {visibleFolders.length > 0 ? (
            visibleFolders.map((folder) => (
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
