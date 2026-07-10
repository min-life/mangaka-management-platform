import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Image, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import ApiStateView from '@/src/components/shared/ApiStateView';
import BottomNavBar from '@/src/components/shared/BottomNavBar';
import MaterialIcon from '@/src/components/shared/MaterialIcon';
import { Colors } from '@/src/constants/colors';
import { RootStackParamList } from '@/src/navigation/types';
import EditorBoardTopBar from '@/src/screens/editorBoards/components/EditorBoardTopBar';
import {
  fetchProjectBundle,
  fetchProjectMembers,
  removeProjectMember,
} from '@/src/services/projectApi';
import { ProjectMemberItem } from '@/src/types/projects';
import AddMemberModal from './AddMemberModal';

type ProjectContributorsScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'ProjectContributors'
>;

function ContributorRow({
  isOwner,
  member,
  onDelete,
}: {
  isOwner?: boolean;
  member: ProjectMemberItem;
  onDelete?: () => void;
}) {
  const roleLabel = isOwner ? 'Owner' : member.roleName;
  const roleColor = isOwner ? Colors.accent : Colors.statusProgress;
  const roleBackground = isOwner ? 'rgba(255,211,105,0.16)' : 'rgba(77,166,255,0.16)';

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
            <Image
              source={{ uri: member.avatarUri }}
              className="h-full w-full"
              resizeMode="cover"
            />
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
          <Text
            className="mt-0.5 text-[12px]"
            style={{ color: Colors.textMuted }}
            numberOfLines={1}
          >
            {member.email || 'No email'}
          </Text>
        </View>

        <View className="flex-row items-center gap-2">
          <View className="rounded-full px-3 py-1" style={{ backgroundColor: roleBackground }}>
            <Text className="text-[11px] font-bold" style={{ color: roleColor }}>
              {roleLabel}
            </Text>
          </View>

          {!isOwner && onDelete && (
            <TouchableOpacity onPress={onDelete} activeOpacity={0.7} className="p-1">
              <MaterialIcon name="delete" color={Colors.iconTask} size={20} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <Text className="mt-3 text-[12px]" style={{ color: Colors.textFaint }}>
        {member.joinedAtLabel}
      </Text>
    </View>
  );
}

export default function ProjectContributorsScreen({
  navigation,
  route,
}: ProjectContributorsScreenProps) {
  const [members, setMembers] = useState<ProjectMemberItem[]>([]);
  const [ownerUserId, setOwnerUserId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);

  const loadMembers = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const [memberResult, projectBundle] = await Promise.all([
        fetchProjectMembers(route.params.projectId, { search: search.trim() || undefined }),
        fetchProjectBundle(route.params.projectId).catch(() => null),
      ]);
      setMembers(memberResult.members);
      setOwnerUserId(projectBundle?.project.createdBy || null);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to load members.');
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

  const handleDeleteMember = (member: ProjectMemberItem) => {
    Alert.alert(
      'Remove Member',
      `Are you sure you want to remove ${member.name} from the project?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true);
              await removeProjectMember(route.params.projectId, member.id);
              await loadMembers();
            } catch (error) {
              Alert.alert(
                'Error',
                error instanceof Error ? error.message : 'Unable to remove member.',
              );
            } finally {
              setIsLoading(false);
            }
          },
        },
      ],
    );
  };

  return (
    <View className="flex-1" style={{ backgroundColor: Colors.bg }}>
      <EditorBoardTopBar
        onBack={() => navigation.goBack()}
        title="Contribute"
        actionIcon="add"
        onActionPress={() => setIsAddModalVisible(true)}
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

        {isLoading ? (
          <ApiStateView type="loading" />
        ) : errorMessage ? (
          <ApiStateView type="error" message={errorMessage} onRetry={loadMembers} />
        ) : members.length > 0 ? (
          <View className="mt-4 gap-3">
            {members.map((member) => (
              <ContributorRow
                key={member.id}
                isOwner={member.id === ownerUserId}
                member={member}
                onDelete={() => handleDeleteMember(member)}
              />
            ))}
          </View>
        ) : (
          <ApiStateView
            type="empty"
            title="No members"
            message="This project does not have matching members."
          />
        )}
      </ScrollView>

      <AddMemberModal
        visible={isAddModalVisible}
        onClose={() => setIsAddModalVisible(false)}
        onSuccess={() => {
          setIsAddModalVisible(false);
          void loadMembers();
        }}
        projectId={route.params.projectId}
        existingMemberIds={new Set(members.map((m) => m.id))}
      />

      <BottomNavBar activeTab="home" />
    </View>
  );
}
