import React, { useMemo, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import MaterialIcon from '@/src/components/shared/MaterialIcon';
import { Colors } from '@/src/constants/colors';
import {
  findEditorBoard,
  getBoardMembers,
  getBoardPublishRequests,
} from '@/src/constants/editorBoardsData';
import { PROJECTS } from '@/src/constants/projectsData';
import { RootStackParamList } from '@/src/navigation/types';
import ApplicationCard from '@/src/screens/applications/components/ApplicationCard';

import {
  BoardMemberRow,
  BoardProjectRow,
  BoardRoleBadge,
  BoardTab,
  BoardTabBar,
  EditorBoardTopBar,
} from '@/src/screens/editorBoards/components';

type EditorBoardDetailScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'EditorBoardDetail'
>;

function MetricCard({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <View
      className="flex-1 rounded-xl p-3"
      style={{
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.borderSubtle,
      }}
    >
      <Text className="text-[20px] font-bold" style={{ color: Colors.text }}>
        {value}
      </Text>
      <Text className="mt-1 text-[12px]" style={{ color: Colors.textMuted }}>
        {label}
      </Text>
    </View>
  );
}

function BoardActionButton({
  icon,
  label,
  onPress,
}: {
  icon: string;
  label: string;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.78}
      onPress={onPress}
      className="flex-1 items-center gap-2 rounded-xl p-3"
      style={{
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.borderSubtle,
      }}
    >
      <MaterialIcon name={icon} color={Colors.accent} size={22} />
      <Text className="text-center text-[12px] font-bold" style={{ color: Colors.text }}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

export default function EditorBoardDetailScreen({
  navigation,
  route,
}: EditorBoardDetailScreenProps) {
  const [activeTab, setActiveTab] = useState<BoardTab>('Overview');
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
        <EditorBoardTopBar onBack={() => navigation.goBack()} title="Editor Board" />
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-center text-[15px] font-bold" style={{ color: Colors.text }}>
            Editor board not found
          </Text>
        </View>
      </View>
    );
  }

  const lead = members.find((member) => member.id === board.leadMemberId);

  return (
    <View className="flex-1" style={{ backgroundColor: Colors.bg }}>
      <EditorBoardTopBar
        actionIcon="more_vert"
        onBack={() => navigation.goBack()}
        subtitle={board.currentUserRole}
        title={board.name}
      />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <View
          className="mt-4 rounded-xl p-4"
          style={{
            backgroundColor: Colors.surface,
            borderWidth: 1,
            borderColor: Colors.borderSubtle,
          }}
        >
          <View className="flex-row items-start justify-between gap-3">
            <View className="flex-1">
              <Text className="text-[22px] font-bold" style={{ color: Colors.text }}>
                {board.name}
              </Text>
              <Text className="mt-2 text-[14px] leading-6" style={{ color: Colors.textMuted }}>
                {board.description}
              </Text>
            </View>
            <BoardRoleBadge role={board.currentUserRole} />
          </View>

          <View className="mt-4 flex-row gap-3">
            <MetricCard label="Members" value={members.length} />
            <MetricCard label="Projects" value={boardProjects.length} />
            <MetricCard
              label="Pending"
              value={publishRequests.filter((item) => item.status === 'PENDING').length}
            />
          </View>
        </View>

        <BoardTabBar activeTab={activeTab} onChange={setActiveTab} />

        {activeTab === 'Overview' && (
          <View className="mt-5 gap-4">
            <View
              className="rounded-xl p-4"
              style={{
                backgroundColor: Colors.surface,
                borderWidth: 1,
                borderColor: Colors.borderSubtle,
              }}
            >
              <Text className="text-[11px] font-bold uppercase" style={{ color: Colors.textMuted }}>
                Board lead
              </Text>
              <View className="mt-3 flex-row items-center gap-3">
                <View
                  className="h-10 w-10 items-center justify-center rounded-lg"
                  style={{ backgroundColor: Colors.iconBg }}
                >
                  <Text className="text-[12px] font-bold" style={{ color: Colors.accent }}>
                    {lead?.initials ?? 'NA'}
                  </Text>
                </View>
                <View className="flex-1">
                  <Text className="text-[14px] font-bold" style={{ color: Colors.text }}>
                    {lead?.name ?? 'No lead assigned'}
                  </Text>
                  <Text className="mt-0.5 text-[12px]" style={{ color: Colors.textMuted }}>
                    {lead?.email ?? 'Set a lead to process publish requests'}
                  </Text>
                </View>
              </View>
            </View>

            <View className="flex-row gap-3">
              <BoardActionButton icon="group_add" label="Add member" />
              <BoardActionButton
                icon="folder"
                label="Attach project"
                onPress={() => navigation.navigate('EditorBoardAttachProject', { boardId: board.id })}
              />
              <BoardActionButton icon="apps" label="Publish queue" onPress={() => setActiveTab('Publish')} />
            </View>
          </View>
        )}

        {activeTab === 'Projects' && (
          <View className="mt-5 gap-3">
            <View className="flex-row items-center justify-between">
              <Text
                className="text-[11px] font-bold uppercase"
                style={{ color: Colors.textMuted, letterSpacing: 1 }}
              >
                Board projects
              </Text>
              <TouchableOpacity
                activeOpacity={0.72}
                onPress={() => navigation.navigate('EditorBoardAttachProject', { boardId: board.id })}
                className="flex-row items-center gap-1 rounded-full px-3 py-1.5"
                style={{ backgroundColor: Colors.overlayLight }}
              >
                <MaterialIcon name="add" color={Colors.accent} size={16} />
                <Text className="text-[12px] font-bold" style={{ color: Colors.accent }}>
                  Attach
                </Text>
              </TouchableOpacity>
            </View>
            {boardProjects.map((project) => (
              <BoardProjectRow
                key={project.id}
                project={project}
                onPress={() => navigation.navigate('ProjectDetail', { projectId: project.id })}
              />
            ))}
          </View>
        )}

        {activeTab === 'Members' && (
          <View className="mt-5 gap-3">
            <View className="flex-row items-center justify-between">
              <Text
                className="text-[11px] font-bold uppercase"
                style={{ color: Colors.textMuted, letterSpacing: 1 }}
              >
                Board members
              </Text>
              <TouchableOpacity
                activeOpacity={0.72}
                className="flex-row items-center gap-1 rounded-full px-3 py-1.5"
                style={{ backgroundColor: Colors.overlayLight }}
              >
                <MaterialIcon name="group_add" color={Colors.accent} size={16} />
                <Text className="text-[12px] font-bold" style={{ color: Colors.accent }}>
                  Add
                </Text>
              </TouchableOpacity>
            </View>
            {members.map((member) => (
              <BoardMemberRow key={member.id} member={member} />
            ))}
          </View>
        )}

        {activeTab === 'Publish' && (
          <View className="mt-5 gap-3">
            <View className="flex-row items-center justify-between">
              <Text
                className="text-[11px] font-bold uppercase"
                style={{ color: Colors.textMuted, letterSpacing: 1 }}
              >
                Publish requests
              </Text>
              <Text className="text-[12px]" style={{ color: Colors.textFaint }}>
                {publishRequests.length} items
              </Text>
            </View>
            {publishRequests.map((application) => (
              <ApplicationCard
                key={application.id}
                application={application}
                contextLabel={
                  PROJECTS.find((project) => project.id === application.projectId)?.name
                }
                onPress={() =>
                  navigation.navigate('ApplicationDetail', {
                    applicationId: application.id,
                    projectId: application.projectId,
                  })
                }
              />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

