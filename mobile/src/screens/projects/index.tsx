import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
  ProjectListItem,
  ProjectsEmptyState,
  ProjectsSearchBar,
  ProjectsTopBar,
  ProjectTypeFilter,
  ProjectTypeFilterValue,
  ProjectViewMode,
  ProjectViewModeToggle,
} from './components';

export default function ProjectsScreen() {
  const navigation = useNavigation<RootStackNavProp>();
  const [search, setSearch] = useState('');
  const [activeType, setActiveType] = useState<ProjectTypeFilterValue>('All');
  const [viewMode, setViewMode] = useState<ProjectViewMode>('list');
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const loadProjects = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const result = await fetchProjects({ name: search.trim() || undefined });
      setProjects(result.projects);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Không thể tải projects.');
    } finally {
      setIsLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      void loadProjects();
    }, 250);

    return () => clearTimeout(timeout);
  }, [loadProjects]);

  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      const matchesType = activeType === 'All' || project.type === activeType;

      return matchesType;
    });
  }, [activeType, projects]);

  return (
    <View className="flex-1" style={{ backgroundColor: Colors.bg }}>
      <ProjectsTopBar onBack={() => navigation.goBack()} />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 24 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className="px-4">
          <ProjectsSearchBar search={search} onSearchChange={setSearch} />
          <View className="flex-row items-center gap-3">
            <View className="flex-1">
              <ProjectTypeFilter activeType={activeType} onTypeChange={setActiveType} />
            </View>
            <ProjectViewModeToggle viewMode={viewMode} onViewModeChange={setViewMode} />
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
            {filteredProjects.length > 0 ? (
              filteredProjects.map((project, index) =>
                viewMode === 'list' ? (
                  <ProjectListItem
                    key={project.id}
                    project={project}
                    isLast={index === filteredProjects.length - 1}
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
