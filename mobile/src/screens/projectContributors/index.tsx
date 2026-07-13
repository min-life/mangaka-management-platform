import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import ApiStateView from '@/src/components/shared/ApiStateView';
import BottomNavBar from '@/src/components/shared/BottomNavBar';
import MaterialIcon from '@/src/components/shared/MaterialIcon';
import { Colors } from '@/src/constants/colors';
import { RootStackParamList } from '@/src/navigation/types';
import EditorBoardTopBar from '@/src/screens/editorBoards/components/EditorBoardTopBar';
import { ApiRoleSummary } from '@/src/services/apiTypes';
import {
  fetchProjectBundle,
  fetchProjectMembers,
  fetchProjectRoles,
  removeProjectMember,
  updateProjectMemberRole,
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
  onChangeRole,
  onDelete,
}: {
  isOwner?: boolean;
  member: ProjectMemberItem;
  onChangeRole?: () => void;
  onDelete?: () => void;
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
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
        zIndex: isMenuOpen ? 30 : 1,
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

          {!isOwner && onChangeRole && onDelete && (
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel={`Edit ${member.name}`}
              activeOpacity={0.72}
              className="h-8 w-8 items-center justify-center rounded-full"
              onPress={() => setIsMenuOpen((current) => !current)}
              style={{ backgroundColor: Colors.overlayLight }}
            >
              <MaterialIcon name="edit" color={Colors.accent} size={20} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <Text className="mt-3 text-[12px]" style={{ color: Colors.textFaint }}>
        {member.joinedAtLabel}
      </Text>

      {isMenuOpen && onChangeRole && onDelete ? (
        <View
          className="absolute right-4 top-16 overflow-hidden rounded-xl"
          style={{
            backgroundColor: Colors.surfaceContainer,
            borderWidth: 1,
            borderColor: Colors.borderFaint,
            elevation: 12,
            minWidth: 150,
            zIndex: 20,
          }}
        >
          <TouchableOpacity
            accessibilityRole="button"
            activeOpacity={0.72}
            className="flex-row items-center px-3 py-3"
            onPress={() => {
              setIsMenuOpen(false);
              onChangeRole();
            }}
            style={{ borderBottomWidth: 1, borderBottomColor: Colors.borderFaint }}
          >
            <MaterialIcon name="manage_accounts" color={Colors.accent} size={17} />
            <Text className="ml-2 text-[13px] font-semibold" style={{ color: Colors.text }}>
              Change role
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            accessibilityRole="button"
            activeOpacity={0.72}
            className="flex-row items-center px-3 py-3"
            onPress={() => {
              setIsMenuOpen(false);
              onDelete();
            }}
          >
            <MaterialIcon name="delete" color="#EF4444" size={17} />
            <Text className="ml-2 text-[13px] font-semibold" style={{ color: '#EF4444' }}>
              Delete
            </Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );
}

function RolePickerModal({
  isLoading,
  isSubmitting,
  member,
  onClose,
  onSelectRole,
  roles,
}: {
  isLoading: boolean;
  isSubmitting: boolean;
  member: ProjectMemberItem | null;
  onClose: () => void;
  onSelectRole: (roleId: number) => void;
  roles: ApiRoleSummary[];
}) {
  return (
    <Modal animationType="fade" transparent visible={Boolean(member)} onRequestClose={onClose}>
      <View className="flex-1 justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.48)' }}>
        <TouchableOpacity activeOpacity={1} className="flex-1" onPress={onClose} />
        <View
          className="rounded-t-[24px] px-5 pb-8 pt-5"
          style={{
            backgroundColor: Colors.bg,
            borderColor: Colors.borderSubtle,
            borderTopWidth: 1,
          }}
        >
          <View className="flex-row items-start justify-between gap-4">
            <View className="flex-1">
              <Text className="text-[20px] font-black" style={{ color: Colors.text }}>
                Change role
              </Text>
              <Text
                className="mt-1 text-[13px]"
                numberOfLines={1}
                style={{ color: Colors.textMuted }}
              >
                {member?.name}
              </Text>
            </View>
            <TouchableOpacity
              activeOpacity={0.75}
              className="h-10 w-10 items-center justify-center rounded-full"
              onPress={onClose}
              style={{ backgroundColor: Colors.iconBg }}
            >
              <MaterialIcon name="close" color={Colors.text} size={20} />
            </TouchableOpacity>
          </View>

          <View className="mt-5 gap-2">
            {isLoading ? (
              <View
                className="items-center rounded-xl px-4 py-6"
                style={{ backgroundColor: Colors.surface }}
              >
                <ActivityIndicator color={Colors.accent} size="small" />
                <Text
                  className="mt-3 text-[13px] font-semibold"
                  style={{ color: Colors.textMuted }}
                >
                  Loading roles
                </Text>
              </View>
            ) : roles.length > 0 ? (
              roles.map((role) => {
                const isCurrentRole = role.id === member?.roleId;
                const roleLabel = role.name || role.code || `Role ${role.id}`;

                return (
                  <TouchableOpacity
                    key={role.id}
                    activeOpacity={0.75}
                    className="flex-row items-center justify-between rounded-xl px-4 py-4"
                    disabled={isSubmitting || isCurrentRole || typeof role.id !== 'number'}
                    onPress={() => {
                      if (typeof role.id === 'number') onSelectRole(role.id);
                    }}
                    style={{
                      backgroundColor: isCurrentRole
                        ? 'rgba(255,211,105,0.12)'
                        : Colors.surface,
                      borderColor: isCurrentRole ? Colors.accent : Colors.borderSubtle,
                      borderWidth: 1,
                      opacity: isSubmitting ? 0.65 : 1,
                    }}
                  >
                    <View className="flex-1 pr-3">
                      <Text className="text-[15px] font-bold" style={{ color: Colors.text }}>
                        {roleLabel}
                      </Text>
                      {role.code ? (
                        <Text className="mt-1 text-[12px]" style={{ color: Colors.textMuted }}>
                          {role.code}
                        </Text>
                      ) : null}
                    </View>
                    {isCurrentRole ? (
                      <Text className="text-[12px] font-bold" style={{ color: Colors.accent }}>
                        Current
                      </Text>
                    ) : (
                      <MaterialIcon name="chevron_right" color={Colors.textFaint} size={20} />
                    )}
                  </TouchableOpacity>
                );
              })
            ) : (
              <View
                className="items-center rounded-xl px-4 py-6"
                style={{ backgroundColor: Colors.surface }}
              >
                <Text className="text-[14px] font-semibold" style={{ color: Colors.textMuted }}>
                  No project roles available
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </Modal>
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
  const [rolePickerMember, setRolePickerMember] = useState<ProjectMemberItem | null>(null);
  const [projectRoles, setProjectRoles] = useState<ApiRoleSummary[]>([]);
  const [isRolesLoading, setIsRolesLoading] = useState(false);
  const [isChangingRole, setIsChangingRole] = useState(false);

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

  const openRolePicker = async (member: ProjectMemberItem) => {
    setRolePickerMember(member);
    setIsRolesLoading(true);

    try {
      const roles = await fetchProjectRoles();
      setProjectRoles(roles);
    } catch (error) {
      setRolePickerMember(null);
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Unable to load project roles.',
      );
    } finally {
      setIsRolesLoading(false);
    }
  };

  const handleChangeRole = async (roleId: number) => {
    if (!rolePickerMember) return;

    try {
      setIsChangingRole(true);
      await updateProjectMemberRole(route.params.projectId, rolePickerMember.id, roleId);
      setRolePickerMember(null);
      await loadMembers();
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Unable to change member role.',
      );
    } finally {
      setIsChangingRole(false);
    }
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
                onChangeRole={() => {
                  void openRolePicker(member);
                }}
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

      <RolePickerModal
        isLoading={isRolesLoading}
        isSubmitting={isChangingRole}
        member={rolePickerMember}
        onClose={() => {
          if (!isChangingRole) setRolePickerMember(null);
        }}
        onSelectRole={handleChangeRole}
        roles={projectRoles}
      />

      <BottomNavBar activeTab="home" />
    </View>
  );
}
