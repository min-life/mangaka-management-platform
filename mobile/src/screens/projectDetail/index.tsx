import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import BottomNavBar from '@/src/components/shared/BottomNavBar';
import { Colors } from '@/src/constants/colors';
import { getProjectApplications } from '@/src/constants/applicationsData';
import { EDITOR_BOARDS } from '@/src/constants/editorBoardsData';
import { PROJECTS } from '@/src/constants/projectsData';
import { RootStackParamList } from '@/src/navigation/types';

import {
  ProjectDetailHero,
  ProjectDetailMenuItem,
  ProjectDetailTopBar,
} from './components';

type ProjectDetailScreenProps = NativeStackScreenProps<RootStackParamList, 'ProjectDetail'>;

export default function ProjectDetailScreen({ navigation, route }: ProjectDetailScreenProps) {
  const project = PROJECTS.find((item) => item.id === route.params.projectId);
  const projectApplications = getProjectApplications(route.params.projectId);
  const editorBoard = EDITOR_BOARDS.find((board) =>
    board.projectIds.includes(route.params.projectId),
  );

  if (!project) {
    return (
      <View className="flex-1" style={{ backgroundColor: Colors.bg }}>
        <ProjectDetailTopBar onBack={() => navigation.goBack()} />
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-center text-[15px] font-medium" style={{ color: Colors.text }}>
            Project not found
          </Text>
        </View>
      </View>
    );
  }

  const menuItems = [
    {
      label: 'Resource',
      count: project.files,
      icon: 'folder',
      iconColor: '#FFFFFF',
      iconBg: '#22C55E',
      onPress: () => navigation.navigate('Resources', { projectId: project.id }),
    },
    {
      label: 'Application',
      count: projectApplications.length,
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
      icon: 'groups',
      iconColor: '#FFFFFF',
      iconBg: '#14B8A6',
      onPress: () =>
        editorBoard
          ? navigation.navigate('EditorBoardDetail', { boardId: editorBoard.id })
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
