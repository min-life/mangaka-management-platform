import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  SafeAreaView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import MaterialIcon from '@/src/components/shared/MaterialIcon';
import { Colors } from '@/src/constants/colors';
import { addProjectMembers, fetchProjectRoles } from '@/src/services/projectApi';
import { searchUsers } from '@/src/services/userApi';
import { ApiRoleSummary, ApiUserSummary } from '@/src/services/apiTypes';

interface AddMemberModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  projectId: string;
  existingMemberIds: Set<string | number>;
}

export default function AddMemberModal({
  visible,
  onClose,
  onSuccess,
  projectId,
  existingMemberIds,
}: AddMemberModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ApiUserSummary[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<ApiUserSummary[]>([]);
  const [projectRoles, setProjectRoles] = useState<ApiRoleSummary[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
  const [isLoadingRoles, setIsLoadingRoles] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!visible) return;

    let isActive = true;

    const loadProjectRoles = async () => {
      setIsLoadingRoles(true);
      setErrorMsg('');
      try {
        const roles = await fetchProjectRoles();
        if (!isActive) return;

        const fallbackRole = roles.find((role) => role.isDefault) ?? roles[0];
        setProjectRoles(roles);
        setSelectedRoleId(fallbackRole?.id ?? null);
      } catch (err) {
        if (!isActive) return;
        setProjectRoles([]);
        setSelectedRoleId(null);
        setErrorMsg(err instanceof Error ? err.message : 'Failed to load project roles');
      } finally {
        if (isActive) {
          setIsLoadingRoles(false);
        }
      }
    };

    loadProjectRoles();

    return () => {
      isActive = false;
    };
  }, [visible]);

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setIsSearching(true);
      setErrorMsg('');
      try {
        const users = await searchUsers(searchQuery.trim());
        // Filter out users who are already members
        const filtered = users.filter((u) => !existingMemberIds.has(u.id));
        setSearchResults(filtered);
      } catch (err) {
        setErrorMsg('Failed to search users');
      } finally {
        setIsSearching(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery, existingMemberIds]);

  const toggleSelectUser = (user: ApiUserSummary) => {
    setSelectedUsers((prev) => {
      const exists = prev.find((u) => u.id === user.id);
      if (exists) {
        return prev.filter((u) => u.id !== user.id);
      } else {
        return [...prev, user];
      }
    });
  };

  const handleAddMembers = async () => {
    if (selectedUsers.length === 0) return;
    const roleId = selectedRoleId ?? projectRoles[0]?.id;
    if (typeof roleId !== 'number') {
      setErrorMsg('No project roles available');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    try {
      const userIds = selectedUsers.map((u) => u.id);
      await addProjectMembers(projectId, userIds, roleId);

      setSelectedUsers([]);
      setSearchQuery('');
      onSuccess();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to add members');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View className="flex-1 justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
        <SafeAreaView className="h-[85%] rounded-t-3xl" style={{ backgroundColor: Colors.bg }}>
          {/* Header */}
          <View
            className="flex-row items-center justify-between px-4 py-4"
            style={{ borderBottomWidth: 1, borderBottomColor: Colors.borderSubtle }}
          >
            <Text className="text-[18px] font-bold" style={{ color: Colors.text }}>
              Add Members
            </Text>
            <TouchableOpacity onPress={onClose} activeOpacity={0.7} className="p-1">
              <MaterialIcon name="close" color={Colors.text} size={24} />
            </TouchableOpacity>
          </View>

          {/* Body */}
          <View className="flex-1 p-4">
            {/* Search Input */}
            <View className="relative mb-4">
              <View className="absolute bottom-0 left-4 top-0 z-10 justify-center">
                <MaterialIcon name="search" color={Colors.textPlaceholder} size={18} />
              </View>
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search user by email..."
                placeholderTextColor={Colors.textPlaceholder}
                className="h-12 rounded-xl pl-10 pr-4 text-[15px]"
                style={{ backgroundColor: Colors.surface, color: Colors.text }}
                autoCapitalize="none"
              />
            </View>

            {/* Role selector */}
            <View className="mb-4">
              <View className="mb-2 flex-row items-center justify-between">
                <Text className="text-[13px] font-bold uppercase" style={{ color: Colors.textMuted }}>
                  Project role
                </Text>
                {isLoadingRoles ? <ActivityIndicator size="small" color={Colors.accent} /> : null}
              </View>

              {!isLoadingRoles && projectRoles.length === 0 ? (
                <View
                  className="rounded-xl px-3 py-3"
                  style={{
                    backgroundColor: Colors.surface,
                    borderColor: Colors.borderSubtle,
                    borderWidth: 1,
                  }}
                >
                  <Text className="text-[13px]" style={{ color: Colors.textFaint }}>
                    No project roles available.
                  </Text>
                </View>
              ) : (
                <FlatList
                  horizontal
                  data={projectRoles}
                  keyExtractor={(item) => String(item.id)}
                  showsHorizontalScrollIndicator={false}
                  renderItem={({ item }) => {
                    const isSelected = item.id === selectedRoleId;
                    const roleLabel = item.name || item.code || `Role ${item.id}`;

                    return (
                      <TouchableOpacity
                        activeOpacity={0.76}
                        onPress={() => setSelectedRoleId(item.id ?? null)}
                        accessibilityRole="button"
                        accessibilityState={{ selected: isSelected }}
                        className="mr-2 flex-row items-center rounded-xl px-3 py-2"
                        style={{
                          backgroundColor: isSelected ? Colors.surfaceContainer : Colors.surface,
                          borderColor: isSelected ? Colors.accent : Colors.borderSubtle,
                          borderWidth: 1,
                        }}
                      >
                        <MaterialIcon
                          name={isSelected ? 'check_circle' : 'badge'}
                          color={isSelected ? Colors.accent : Colors.textMuted}
                          size={16}
                        />
                        <Text
                          className="ml-2 text-[13px] font-semibold"
                          numberOfLines={1}
                          style={{ color: isSelected ? Colors.text : Colors.textMuted }}
                        >
                          {roleLabel}
                        </Text>
                      </TouchableOpacity>
                    );
                  }}
                />
              )}
            </View>

            {/* Error Message */}
            {errorMsg ? (
              <Text className="mb-3 text-[13px]" style={{ color: Colors.iconTask }}>
                {errorMsg}
              </Text>
            ) : null}

            {/* Results Header */}
            <Text className="mb-2 text-[13px] font-bold uppercase" style={{ color: Colors.textMuted }}>
              Search Results
            </Text>

            {/* Results List */}
            <View className="flex-1 mb-4">
              {isSearching ? (
                <View className="flex-1 items-center justify-center">
                  <ActivityIndicator size="small" color={Colors.accent} />
                </View>
              ) : searchQuery && searchResults.length === 0 ? (
                <View className="flex-1 items-center justify-center p-4">
                  <Text className="text-[14px]" style={{ color: Colors.textFaint }}>
                    No users found or they are already members.
                  </Text>
                </View>
              ) : (
                <FlatList
                  data={searchResults}
                  keyExtractor={(item) => String(item.id)}
                  renderItem={({ item }) => {
                    const isSelected = !!selectedUsers.find((u) => u.id === item.id);
                    return (
                      <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => toggleSelectUser(item)}
                        className="mb-2 flex-row items-center justify-between rounded-xl p-3"
                        style={{
                          backgroundColor: Colors.surface,
                          borderWidth: 1,
                          borderColor: isSelected ? Colors.accent : Colors.borderSubtle,
                        }}
                      >
                        <View className="flex-1">
                          <Text className="text-[15px] font-bold" style={{ color: Colors.text }}>
                            {item.displayName || 'No name'}
                          </Text>
                          <Text className="text-[12px]" style={{ color: Colors.textMuted }}>
                            {item.email}
                          </Text>
                        </View>
                        <View
                          className="h-6 w-6 items-center justify-center rounded-md border"
                          style={{
                            borderColor: isSelected ? Colors.accent : Colors.textPlaceholder,
                            backgroundColor: isSelected ? Colors.accent : 'transparent',
                          }}
                        >
                          {isSelected && (
                            <MaterialIcon name="check" color={Colors.bg} size={16} />
                          )}
                        </View>
                      </TouchableOpacity>
                    );
                  }}
                />
              )}
            </View>

            {/* Selected Users section */}
            {selectedUsers.length > 0 && (
              <View className="mb-4 max-h-32">
                <Text className="mb-2 text-[13px] font-bold uppercase" style={{ color: Colors.textMuted }}>
                  Selected ({selectedUsers.length})
                </Text>
                <FlatList
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  data={selectedUsers}
                  keyExtractor={(item) => String(item.id)}
                  renderItem={({ item }) => (
                    <View
                      className="mr-2 flex-row items-center rounded-full px-3 py-1.5 gap-2"
                      style={{ backgroundColor: Colors.surfaceContainer }}
                    >
                      <Text className="text-[12px] font-semibold" style={{ color: Colors.text }}>
                        {item.displayName || item.email}
                      </Text>
                      <TouchableOpacity onPress={() => toggleSelectUser(item)}>
                        <MaterialIcon name="close" color={Colors.iconTask} size={14} />
                      </TouchableOpacity>
                    </View>
                  )}
                />
              </View>
            )}

            {/* Action Button */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleAddMembers}
              disabled={selectedUsers.length === 0 || isSubmitting || isLoadingRoles || projectRoles.length === 0}
              className="h-12 w-full items-center justify-center rounded-xl"
              style={{
                backgroundColor:
                  selectedUsers.length > 0 && projectRoles.length > 0 ? Colors.accent : Colors.surface,
                opacity:
                  selectedUsers.length > 0 && !isSubmitting && !isLoadingRoles && projectRoles.length > 0
                    ? 1
                    : 0.6,
              }}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color={Colors.bg} />
              ) : (
                <Text
                  className="text-[15px] font-bold"
                  style={{ color: selectedUsers.length > 0 ? Colors.bg : Colors.textPlaceholder }}
                >
                  Add Members
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}
