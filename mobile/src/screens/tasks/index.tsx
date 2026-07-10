import React, { useCallback, useEffect, useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import ApiStateView from '@/src/components/shared/ApiStateView';
import AppRefreshControl from '@/src/components/shared/AppRefreshControl';
import BottomNavBar from '@/src/components/shared/BottomNavBar';
import { Colors } from '@/src/constants/colors';
import { RootStackParamList } from '@/src/navigation/types';
import { fetchProjectBundle } from '@/src/services/projectApi';
import { fetchTaskResourceTarget, fetchTasks } from '@/src/services/taskApi';
import {
  FilterChip,
  TaskCard,
  TaskFilterSelect,
  TasksSearchBar,
  TasksSectionHeader,
  TasksTopBar,
} from './components';
import { Task } from './components/types';

type TasksScreenProps = NativeStackScreenProps<RootStackParamList, 'Tasks'>;

export default function TasksScreen({ navigation, route }: TasksScreenProps) {
  const [activeFilter, setActiveFilter] = useState<FilterChip>('All');
  const [search, setSearch] = useState('');
  const projectId = route.params?.projectId;
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projectName, setProjectName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const loadTasks = useCallback(
    async (options: { showLoading?: boolean } = {}) => {
      const showLoading = options.showLoading ?? true;
      if (showLoading) setIsLoading(true);
      else setIsRefreshing(true);
      setErrorMessage('');

      try {
        const [tasksResult, projectResult] = await Promise.all([
          fetchTasks({ projectId, search: search.trim() || undefined }),
          projectId ? fetchProjectBundle(projectId).catch(() => null) : Promise.resolve(null),
        ]);
        setTasks(tasksResult.tasks);
        setProjectName(projectResult?.project.name ?? null);
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : 'Unable to load tasks.');
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [projectId, search],
  );

  useEffect(() => {
    const timeout = setTimeout(() => {
      void loadTasks();
    }, 250);

    return () => clearTimeout(timeout);
  }, [loadTasks]);

  const handleRefresh = useCallback(() => {
    void loadTasks({ showLoading: false });
  }, [loadTasks]);

  const handleOpenTask = useCallback(
    async (task: Task) => {
      try {
        const target =
          task.fileId && (task.projectId || projectId)
            ? { fileId: task.fileId, projectId: task.projectId || projectId! }
            : await fetchTaskResourceTarget(task.id);

        navigation.navigate('ResourceFile', {
          fileId: target.fileId,
          initialTab: 'Tasks',
          initialTaskId: task.id,
          projectId: target.projectId,
        });
      } catch (error) {
        Alert.alert(
          'Unable to open task',
          error instanceof Error ? error.message : 'Unable to open this task.',
        );
      }
    },
    [navigation, projectId],
  );

  const filteredTasks = tasks.filter((t) => {
    const matchFilter =
      activeFilter === 'All' || activeFilter === 'Assigned' || t.status === activeFilter;

    return matchFilter;
  });

  return (
    <View className="flex-1" style={{ backgroundColor: Colors.bg }}>
      <TasksTopBar
        onBack={() => navigation.goBack()}
        title={projectName ? `${projectName} Tasks` : 'Tasks'}
      />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 112 }}
        // refreshControl={
        //   <AppRefreshControl onRefresh={handleRefresh} refreshing={isRefreshing} />
        // }
        showsVerticalScrollIndicator={false}
      >
        <View className="relative z-20 mt-4 flex-row items-center gap-3">
          <TasksSearchBar search={search} onSearchChange={setSearch} />
          <TaskFilterSelect activeFilter={activeFilter} onFilterChange={setActiveFilter} />
        </View>
        {isLoading ? (
          <ApiStateView type="loading" />
        ) : errorMessage ? (
          <ApiStateView type="error" message={errorMessage} onRetry={loadTasks} />
        ) : (
          <>
            <TasksSectionHeader
              count={filteredTasks.length}
              title={projectName ? 'Project Tasks' : 'My Tasks'}
            />

            {filteredTasks.length > 0 ? (
              filteredTasks.map((task) => (
                <TaskCard key={task.id} task={task} onPress={() => void handleOpenTask(task)} />
              ))
            ) : (
              <ApiStateView
                type="empty"
                title="No tasks"
                message="No tasks match the current filters."
              />
            )}
          </>
        )}
      </ScrollView>

      <BottomNavBar activeTab="home" />
    </View>
  );
}
