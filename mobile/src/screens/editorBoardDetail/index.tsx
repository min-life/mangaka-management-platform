import React, { useMemo } from 'react';
import { ScrollView, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import BottomNavBar from '@/src/components/shared/BottomNavBar';
import MaterialIcon from '@/src/components/shared/MaterialIcon';
import { Colors } from '@/src/constants/colors';
import {
  findEditorBoard,
  getBoardMembers,
  getBoardPublishRequests,
} from '@/src/constants/editorBoardsData';
import { PROJECTS } from '@/src/constants/projectsData';
import { RootStackParamList } from '@/src/navigation/types';
import {
  ProjectDetailMenuItem,
  ProjectDetailTopBar,
} from '@/src/screens/projectDetail/components';

type EditorBoardDetailScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'EditorBoardDetail'
>;

function getBoardInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

function EditorBoardDetailHero({
  description,
  leadName,
  name,
  role,
  updatedAtLabel,
}: {
  description: string;
  leadName?: string;
  name: string;
  role: string;
  updatedAtLabel: string;
}) {
  const subtitle = leadName ? `${role} - Lead: ${leadName}` : role;

  return (
    <View className="pb-6">
      <View
        className="h-[260px] items-center justify-center overflow-hidden"
        style={{ backgroundColor: Colors.iconBg }}
      >
        <View
          className="h-28 w-28 items-center justify-center rounded-3xl"
          style={{
            backgroundColor: Colors.overlayLight,
            borderWidth: 1,
            borderColor: Colors.borderFaint,
          }}
        >
          <MaterialIcon name="groups" color={Colors.accent} size={54} />
        </View>
        <Text className="mt-4 text-[22px] font-black" style={{ color: Colors.text }}>
          {getBoardInitials(name)}
        </Text>
      </View>

      <View className="px-4">
        <Text
          className="mt-5 text-[31px] font-black leading-tight"
          style={{ color: Colors.text }}
          numberOfLines={2}
        >
          {name}
        </Text>

        <Text className="mt-3 text-[14px] leading-6" style={{ color: Colors.textMuted }}>
          {description}
        </Text>

        <Text className="mt-4 text-[13px] leading-5" style={{ color: Colors.textFaint }}>
          {subtitle} - {updatedAtLabel}
        </Text>
      </View>
    </View>
  );
}

export default function EditorBoardDetailScreen({
  navigation,
  route,
}: EditorBoardDetailScreenProps) {
  const board = findEditorBoard(route.params.boardId);

  const members = useMemo(() => (board ? getBoardMembers(board) : []), [board]);
  const boardProjects = useMemo(
    () => (board ? PROJECTS.filter((project) => board.projectIds.includes(project.id)) : []),
    [board],
  );
  const publishRequests = useMemo(
    () => (board ? getBoardPublishRequests(board) : []),
    [board],
  );

  if (!board) {
    return (
      <View className="flex-1" style={{ backgroundColor: Colors.bg }}>
        <ProjectDetailTopBar onBack={() => navigation.goBack()} />
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-center text-[15px] font-medium" style={{ color: Colors.text }}>
            Editor board not found
          </Text>
        </View>
      </View>
    );
  }

  const lead = members.find((member) => member.id === board.leadMemberId);

  const menuItems = [
    {
      label: 'Project',
      count: boardProjects.length,
      icon: 'folder',
      iconColor: '#FFFFFF',
      iconBg: Colors.accent,
      onPress:
        boardProjects.length === 1
          ? () => navigation.navigate('ProjectDetail', { projectId: boardProjects[0].id })
          : undefined,
    },
    {
      label: 'Members',
      count: members.length,
      icon: 'group_add',
      iconColor: '#FFFFFF',
      iconBg: '#DB2777',
    },
    {
      label: 'Application',
      count: publishRequests.length,
      icon: 'apps',
      iconColor: '#FFFFFF',
      iconBg: '#22C55E',
      onPress:
        publishRequests.length === 1
          ? () =>
              navigation.navigate('ApplicationDetail', {
                applicationId: publishRequests[0].id,
                projectId: publishRequests[0].projectId,
              })
          : undefined,
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
        <EditorBoardDetailHero
          description={board.description}
          leadName={lead?.name}
          name={board.name}
          role={board.currentUserRole}
          updatedAtLabel={board.updatedAtLabel}
        />

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
              isLast={index === menuItems.length - 1}
            />
          ))}
        </View>
      </ScrollView>

      <BottomNavBar activeTab="home" />
    </View>
  );
}
