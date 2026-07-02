import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Image, ScrollView, Text, TextInput, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import ApiStateView from '@/src/components/shared/ApiStateView';
import BottomNavBar from '@/src/components/shared/BottomNavBar';
import MaterialIcon from '@/src/components/shared/MaterialIcon';
import { Colors } from '@/src/constants/colors';
import { RootStackParamList } from '@/src/navigation/types';
import EditorBoardTopBar from '@/src/screens/editorBoards/components/EditorBoardTopBar';
import { fetchProjectBundle, fetchProjectMembers } from '@/src/services/projectApi';
import { ProjectMemberItem } from '@/src/types/projects';

type ProjectContributorsScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'ProjectContributors'
>;

function TaskMetric({
  label,
  value,
}: {
  label: string;
  value?: number;
}) {
  return (
    <View
      className="items-center rounded-lg px-3 py-2"
      style={{ backgroundColor: Colors.overlayLight }}
    >
      <Text className="text-[14px] font-bold" style={{ color: Colors.text }}>
        {value ?? 0}
      </Text>
      <Text className="mt-0.5 text-[10px] font-semibold uppercase" style={{ color: Colors.textMuted }}>
        {label}
      </Text>
    </View>
  );
}

function ContributorRow({ member }: { member: ProjectMemberItem }) {
  return (
    <View
      className="rounded-xl p-4"
      style={{
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.borderSubtle,
      }}
    >
      <View className="flex-row items-center gap-3">
        <View
          className="h-12 w-12 items-center justify-center overflow-hidden rounded-xl"
          style={{ backgroundColor: Colors.iconBg }}
        >
          {member.avatarUri ? (
            <Image source={{ uri: member.avatarUri }} className="h-full w-full" resizeMode="cover" />
          ) : (
            <Text className="text-[13px] font-bold" style={{ color: Colors.accent }}>
              {member.initials}
            </Text>
          )}
        </View>

        <View className="flex-1">
          <Text className="text-[15px] font-bold" style={{ color: Colors.text }} numberOfLines={1}>
            {member.name}
          </Text>
          <Text className="mt-0.5 text-[12px]" style={{ color: Colors.textMuted }} numberOfLines={1}>
            {member.email || 'No email'}
          </Text>
        </View>

        <View
          className="rounded-full px-3 py-1"
          style={{ backgroundColor: 'rgba(77,166,255,0.16)' }}
        >
          <Text className="text-[11px] font-bold" style={{ color: Colors.statusProgress }}>
            {member.roleName}
          </Text>
        </View>
      </View>

      <Text className="mt-3 text-[12px]" style={{ color: Colors.textFaint }}>
        {member.joinedAtLabel}
      </Text>

      <View className="mt-4 flex-row flex-wrap gap-2">
        <TaskMetric label="Tasks" value={member.numberOfTasks} />
        <TaskMetric label="Pending" value={member.taskOverview?.pending} />
        <TaskMetric label="Review" value={member.taskOverview?.review} />
        <TaskMetric label="Done" value={member.taskOverview?.done} />
      </View>
    </View>
  );
}

export default function ProjectContributorsScreen({
  navigation,
  route,
}: ProjectContributorsScreenProps) {
  const [members, setMembers] = useState<ProjectMemberItem[]>([]);
  const [projectName, setProjectName] = useState('Project');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const loadMembers = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const [memberResult, projectBundle] = await Promise.all([
        fetchProjectMembers(route.params.projectId, { search: search.trim() || undefined }),
        fetchProjectBundle(route.params.projectId).catch(() => null),
      ]);
      setMembers(memberResult.members);
      setProjectName(projectBundle?.project.name ?? 'Project');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Không thể tải thành viên.');
    } finally {
      setIsLoading(false);
    }
  }, [route.params.projectId, search]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      void loadMembers();
    }, 250);

    return () => clearTimeout(timeout);
  }, [loadMembers]);

  const totalTasks = useMemo(
    () => members.reduce((sum, member) => sum + member.numberOfTasks, 0),
    [members],
  );

  return (
    <View className="flex-1" style={{ backgroundColor: Colors.bg }}>
      <EditorBoardTopBar
        onBack={() => navigation.goBack()}
        subtitle={projectName}
        title="Contribute"
      />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="relative">
          <View className="absolute bottom-0 left-4 top-0 z-10 justify-center">
            <MaterialIcon name="search" color={Colors.textPlaceholder} size={18} />
          </View>
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search members"
            placeholderTextColor={Colors.textPlaceholder}
            className="h-12 rounded-xl pl-10 pr-4 text-[15px]"
            style={{ backgroundColor: Colors.surface, color: Colors.text }}
          />
        </View>

        <View className="mt-4 flex-row gap-2">
          <TaskMetric label="Members" value={members.length} />
          <TaskMetric label="Tasks" value={totalTasks} />
        </View>

        {isLoading ? (
          <ApiStateView type="loading" />
        ) : errorMessage ? (
          <ApiStateView type="error" message={errorMessage} onRetry={loadMembers} />
        ) : members.length > 0 ? (
          <View className="mt-4 gap-3">
            {members.map((member) => (
              <ContributorRow key={member.id} member={member} />
            ))}
          </View>
        ) : (
          <ApiStateView
            type="empty"
            title="Không có thành viên"
            message="Project này chưa có thành viên phù hợp."
          />
        )}
      </ScrollView>

      <BottomNavBar activeTab="home" />
    </View>
  );
}
