import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import ApiStateView from '@/src/components/shared/ApiStateView';
import BottomNavBar from '@/src/components/shared/BottomNavBar';
import MaterialIcon from '@/src/components/shared/MaterialIcon';
import { Colors } from '@/src/constants/colors';
import { RootStackParamList } from '@/src/navigation/types';
import { fetchEditorBoardBundle } from '@/src/services/editorBoardApi';
import {
  ApplicationStatusBadge,
  ApplicationTypeBadge,
} from '@/src/screens/applications/components';
import { BoardMemberRow, BoardProjectRow } from '@/src/screens/editorBoards/components';
import {
  ProjectDetailMenuItem,
  ProjectDetailTopBar,
} from '@/src/screens/projectDetail/components';
import { ApplicationItem } from '@/src/types/applications';
import { EditorBoardItem, EditorBoardMember } from '@/src/types/editorBoards';
import { ProjectItem } from '@/src/types/projects';

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

function SectionTitle({ title, count }: { title: string; count: number }) {
  return (
    <View className="flex-row items-center justify-between px-4 pb-3 pt-6">
      <Text
        className="text-[13px] font-bold uppercase"
        style={{ color: Colors.textMuted, letterSpacing: 1 }}
      >
        {title}
      </Text>
      <Text className="text-[12px] font-bold" style={{ color: Colors.textFaint }}>
        {count}
      </Text>
    </View>
  );
}

function PublishRequestRow({
  application,
  onPress,
}: {
  application: ApplicationItem;
  onPress: () => void;
}) {
  return (
    <View className="px-4">
      <View
        className="rounded-xl p-4"
        style={{
          backgroundColor: Colors.surface,
          borderWidth: 1,
          borderColor: Colors.borderSubtle,
        }}
      >
        <View className="flex-row items-start justify-between gap-3">
          <View className="flex-1 gap-2">
            <ApplicationTypeBadge type={application.type} />
            <Text
              className="text-[15px] font-bold"
              style={{ color: Colors.text }}
              numberOfLines={2}
            >
              {application.title}
            </Text>
          </View>
          <ApplicationStatusBadge status={application.status} />
        </View>
        <Text
          className="mt-3 text-[13px] leading-5"
          style={{ color: Colors.textMuted }}
          numberOfLines={2}
        >
          {application.description}
        </Text>
        <TouchableOpacity
          activeOpacity={0.75}
          onPress={onPress}
          accessibilityRole="button"
          accessibilityLabel={`Open application ${application.title}`}
          className="mt-4 flex-row items-center justify-between rounded-lg px-3 py-2"
          style={{ backgroundColor: Colors.overlayLight }}
        >
          <View className="flex-row items-center gap-2">
            <MaterialIcon name="apps" color={Colors.accent} size={18} />
            <Text className="text-[13px] font-bold" style={{ color: Colors.text }}>
              Open application
            </Text>
          </View>
          <MaterialIcon name="chevron_right" color={Colors.textFaint} size={21} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function EditorBoardDetailScreen({
  navigation,
  route,
}: EditorBoardDetailScreenProps) {
  const [board, setBoard] = useState<EditorBoardItem | null>(null);
  const [members, setMembers] = useState<EditorBoardMember[]>([]);
  const [boardProjects, setBoardProjects] = useState<ProjectItem[]>([]);
  const [publishRequests, setPublishRequests] = useState<ApplicationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const loadBoard = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const bundle = await fetchEditorBoardBundle(route.params.boardId);
      setBoard(bundle.board);
      setMembers(bundle.members);
      setBoardProjects(bundle.projects);
      setPublishRequests(bundle.applications);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Không thể tải editor board.');
    } finally {
      setIsLoading(false);
    }
  }, [route.params.boardId]);

  useEffect(() => {
    void loadBoard();
  }, [loadBoard]);

  if (isLoading) {
    return (
      <View className="flex-1" style={{ backgroundColor: Colors.bg }}>
        <ProjectDetailTopBar onBack={() => navigation.goBack()} />
        <ApiStateView type="loading" />
      </View>
    );
  }

  if (errorMessage || !board) {
    return (
      <View className="flex-1" style={{ backgroundColor: Colors.bg }}>
        <ProjectDetailTopBar onBack={() => navigation.goBack()} />
        <ApiStateView
          type="error"
          message={errorMessage || 'Editor board not found'}
          onRetry={loadBoard}
        />
      </View>
    );
  }

  const lead = members.find((member) => member.role === 'Lead');

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

        <SectionTitle title="Projects" count={boardProjects.length} />
        <View className="gap-3 px-4">
          {boardProjects.map((project) => (
            <BoardProjectRow
              key={project.id}
              project={project}
              onPress={() => navigation.navigate('ProjectDetail', { projectId: project.id })}
            />
          ))}
        </View>

        <SectionTitle title="Members" count={members.length} />
        <View className="gap-3 px-4">
          {members.map((member) => (
            <BoardMemberRow key={member.id} member={member} />
          ))}
        </View>

        <SectionTitle title="Publish Requests" count={publishRequests.length} />
        <View className="gap-3">
          {publishRequests.map((application) => (
            <PublishRequestRow
              key={application.id}
              application={application}
              onPress={() =>
                navigation.navigate('ApplicationDetail', {
                  applicationId: application.id,
                  projectId: application.projectId,
                })
              }
            />
          ))}
        </View>
      </ScrollView>

      <BottomNavBar activeTab="home" />
    </View>
  );
}
