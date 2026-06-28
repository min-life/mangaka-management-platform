import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import BottomNavBar from '@/src/components/shared/BottomNavBar';
import { Colors } from '@/src/constants/colors';
import { PROJECTS } from '@/src/constants/projectsData';
import { RootStackParamList } from '@/src/navigation/types';
import {
  CreateTaskFab,
  FilterChip,
  FilterChipBar,
  TASKS,
  TaskCard,
  TasksSearchBar,
  TasksSectionHeader,
  TasksTopBar,
} from './components';

type TasksScreenProps = NativeStackScreenProps<RootStackParamList, 'Tasks'>;

export default function TasksScreen({ navigation, route }: TasksScreenProps) {
  const [activeFilter, setActiveFilter] = useState<FilterChip>('All');
  const [search, setSearch] = useState('');
  const projectId = route.params?.projectId;
  const project = projectId ? PROJECTS.find((item) => item.id === projectId) : undefined;
  const projectScopedTasks = projectId
    ? TASKS.filter((task) => task.projectId === projectId)
    : TASKS;

  const filteredTasks = projectScopedTasks.filter((t) => {
    const matchSearch =
      search.trim() === '' ||
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.project.toLowerCase().includes(search.toLowerCase());

    const matchFilter =
      activeFilter === 'All' ||
      activeFilter === 'Assigned' ||
      t.status === activeFilter;

    return matchSearch && matchFilter;
  });

  return (
    <View className="flex-1" style={{ backgroundColor: Colors.bg }}>
      <TasksTopBar
        onBack={() => navigation.goBack()}
        title={project ? `${project.name} Tasks` : 'Tasks'}
      />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        <TasksSearchBar search={search} onSearchChange={setSearch} />
        <FilterChipBar activeFilter={activeFilter} onFilterChange={setActiveFilter} />
        <TasksSectionHeader
          count={filteredTasks.length}
          title={project ? 'Project Tasks' : 'My Tasks'}
        />

        {filteredTasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onPress={() => navigation.navigate('TaskDetail')}
          />
        ))}
      </ScrollView>

      <CreateTaskFab />
      <BottomNavBar activeTab="inbox" />
    </View>
  );
}
