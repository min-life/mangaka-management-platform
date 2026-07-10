import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import ApiStateView from '@/src/components/shared/ApiStateView';
import BottomNavBar from '@/src/components/shared/BottomNavBar';
import { Colors } from '@/src/constants/colors';
import { RootStackNavProp } from '@/src/navigation/types';
import { fetchProjects } from '@/src/services/projectApi';
import { ProjectItem } from '@/src/types/projects';

import {
  ProjectCardItem,
  ProjectFilterSelect,
  ProjectListItem,
  ProjectsEmptyState,
  ProjectsSearchBar,
  ProjectsTopBar,
  ProjectViewMode,
} from './components';

export default function ProjectsScreen() {
  const navigation = useNavigation<RootStackNavProp>();
  const [search, setSearch] = useState('');
  const [isOwnerFilterActive, setIsOwnerFilterActive] = useState(false);
  const [viewMode, setViewMode] = useState<ProjectViewMode>('list');
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const loadProjects = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const result = await fetchProjects({
        me: isOwnerFilterActive,
        name: search.trim() || undefined,
      });
      setProjects(result.projects);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to load projects.');
    } finally {
      setIsLoading(false);
    }
  }, [isOwnerFilterActive, search]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      void loadProjects();
    }, 250);

    return () => clearTimeout(timeout);
  }, [loadProjects]);

  return (
    <View className="flex-1" style={{ backgroundColor: Colors.bg }}>
      <ProjectsTopBar
        onBack={() => navigation.goBack()}
        onViewModeChange={setViewMode}
        viewMode={viewMode}
      />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 112 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className="px-4 pb-4">
          <View className="relative z-20 mt-4 flex-row items-center gap-3">
            <ProjectsSearchBar search={search} onSearchChange={setSearch} />
            <ProjectFilterSelect
              isOwnerFilterActive={isOwnerFilterActive}
              onOwnerFilterChange={setIsOwnerFilterActive}
            />
          </View>
        </View>

        {isLoading ? (
          <ApiStateView type="loading" />
        ) : errorMessage ? (
          <ApiStateView type="error" message={errorMessage} onRetry={loadProjects} />
        ) : (
          <View
            className={
              viewMode === 'card'
                ? 'flex-row flex-wrap justify-between gap-y-5 px-4 pt-1'
                : undefined
            }
            style={
              viewMode === 'list'
                ? { borderTopWidth: 1, borderTopColor: Colors.borderFaint }
                : undefined
            }
          >
            {projects.length > 0 ? (
              projects.map((project, index) =>
                viewMode === 'list' ? (
                  <ProjectListItem
                    key={project.id}
                    project={project}
                    isLast={index === projects.length - 1}
                    onPress={() => navigation.navigate('ProjectDetail', { projectId: project.id })}
                  />
                ) : (
                  <ProjectCardItem
                    key={project.id}
                    project={project}
                    onPress={() => navigation.navigate('ProjectDetail', { projectId: project.id })}
                  />
                ),
              )
            ) : (
              <ProjectsEmptyState />
            )}
          </View>
        )}
      </ScrollView>

      <BottomNavBar activeTab="home" />
    </View>
  );
}
