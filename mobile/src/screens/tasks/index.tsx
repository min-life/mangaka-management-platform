import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { RootStackNavProp } from '@/src/navigation/types';
import BottomNavBar from '@/src/components/shared/BottomNavBar';
import { Colors } from '@/src/constants/colors';
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

export default function TasksScreen() {
  const navigation = useNavigation<RootStackNavProp>();
  const [activeFilter, setActiveFilter] = useState<FilterChip>('All');
  const [search, setSearch] = useState('');

  const filteredTasks = TASKS.filter((t) => {
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
      <TasksTopBar onBack={() => navigation.goBack()} />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        <TasksSearchBar search={search} onSearchChange={setSearch} />
        <FilterChipBar activeFilter={activeFilter} onFilterChange={setActiveFilter} />
        <TasksSectionHeader count={filteredTasks.length} />

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
