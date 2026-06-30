import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import ApiStateView from '@/src/components/shared/ApiStateView';
import BottomNavBar from '@/src/components/shared/BottomNavBar';
import { Colors } from '@/src/constants/colors';
import { RootStackParamList } from '@/src/navigation/types';
import { fetchProjectBundle } from '@/src/services/projectApi';
import { ProjectItem } from '@/src/types/projects';

import {
  ProjectDetailHero,
  ProjectDetailMenuItem,
  ProjectDetailTopBar,
} from './components';

type ProjectDetailScreenProps = NativeStackScreenProps<RootStackParamList, 'ProjectDetail'>;

export default function ProjectDetailScreen({ navigation, route }: ProjectDetailScreenProps) {
  const [project, setProject] = useState<ProjectItem | null>(null);
  const [boardId, setBoardId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const loadProject = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const bundle = await fetchProjectBundle(route.params.projectId);
      setProject(bundle.project);
      setBoardId(bundle.board ? String(bundle.board.id) : null);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Không thể tải project.');
    } finally {
      setIsLoading(false);
    }
  }, [route.params.projectId]);

  useEffect(() => {
    void loadProject();
  }, [loadProject]);

  if (isLoading) {
    return (
      <View className="flex-1" style={{ backgroundColor: Colors.bg }}>
        <ProjectDetailTopBar onBack={() => navigation.goBack()} />
        <ApiStateView type="loading" />
      </View>
    );
  }

  if (errorMessage || !project) {
    return (
      <View className="flex-1" style={{ backgroundColor: Colors.bg }}>
        <ProjectDetailTopBar onBack={() => navigation.goBack()} />
        <ApiStateView
          type="error"
          message={errorMessage || 'Project not found'}
          onRetry={loadProject}
        />
      </View>
    );
  }

  const menuItems = [
    {
      label: 'Resource',
      subtitle: `${project.files} files - ${project.materials} materials`,
      count: project.files,
      icon: 'folder',
      iconColor: '#FFFFFF',
      iconBg: '#22C55E',
      onPress: () => navigation.navigate('Resources', { projectId: project.id }),
    },
    {
      label: 'Application',
      count:
        project.applications.pending +
        project.applications.approved +
        project.applications.rejected +
        project.applications.cancelled,
      icon: 'apps',
      iconColor: '#FFFFFF',
      iconBg: Colors.statusProgress,
      onPress: () => navigation.navigate('Applications', { projectId: project.id }),
    },
    {
      label: 'Task',
      count:
        project.tasks.pending +
        project.tasks.inProgress +
        project.tasks.review +
        project.tasks.done,
      icon: 'checklist',
      iconColor: '#FFFFFF',
      iconBg: Colors.accent,
      onPress: () => navigation.navigate('Tasks', { projectId: project.id }),
    },
    {
      label: 'Editor Board',
      subtitle: project.editorBoard,
      count: boardId ? 1 : 0,
      icon: 'groups',
      iconColor: '#FFFFFF',
      iconBg: '#14B8A6',
      onPress: () =>
        boardId
          ? navigation.navigate('EditorBoardDetail', { boardId })
          : navigation.navigate('EditorBoards'),
    },
    {
      label: 'Contribute',
      count: project.contributors,
      icon: 'group_add',
      iconColor: '#FFFFFF',
      iconBg: '#DB2777',
    },
    {
      label: 'Report',
      subtitle: `${project.stats.completionRate}% complete - ${project.stats.lastUpdated}`,
      icon: 'assessment',
      iconColor: '#FFFFFF',
      iconBg: '#8B5CF6',
      onPress: () => navigation.navigate('ProjectReport', { projectId: project.id }),
    },
    {
      label: 'More',
      icon: 'more_vert',
      iconColor: Colors.textMuted,
      iconBg: 'rgba(237,241,251,0.08)',
      trailingIcon: 'expand_less',
    },
  ];

  return (
    <View className="flex-1" style={{ backgroundColor: Colors.bg }}>
      <ProjectDetailTopBar onBack={() => navigation.goBack()} />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        <ProjectDetailHero project={project} />

        <View
          style={{
            borderTopWidth: 1,
            borderBottomWidth: 1,
            borderColor: Colors.borderFaint,
          }}
        >
          {menuItems.map((item, index) => (
            <ProjectDetailMenuItem
              key={item.label}
              icon={item.icon}
              iconColor={item.iconColor}
              iconBg={item.iconBg}
              label={item.label}
              subtitle={item.subtitle}
              count={item.count}
              onPress={item.onPress}
              trailingIcon={item.trailingIcon}
              isLast={index === menuItems.length - 1}
            />
          ))}
        </View>
      </ScrollView>

      <BottomNavBar activeTab="home" />
    </View>
  );
}
