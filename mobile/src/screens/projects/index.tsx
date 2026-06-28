import React, { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import BottomNavBar from '@/src/components/shared/BottomNavBar';
import { Colors } from '@/src/constants/colors';
import { PROJECTS } from '@/src/constants/projectsData';
import { RootStackNavProp } from '@/src/navigation/types';

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

  const filteredProjects = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return PROJECTS.filter((project) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        project.name.toLowerCase().includes(normalizedSearch) ||
        project.owner.toLowerCase().includes(normalizedSearch) ||
        project.language.toLowerCase().includes(normalizedSearch);

      const matchesType = activeType === 'All' || project.type === activeType;

      return matchesSearch && matchesType;
    });
  }, [activeType, search]);

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

        <View
          className={viewMode === 'card' ? 'gap-4 px-4 pt-1' : undefined}
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
      </ScrollView>

      <BottomNavBar activeTab="home" />
    </View>
  );
}
