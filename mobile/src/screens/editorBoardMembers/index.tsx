import React, { useCallback, useEffect, useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import ApiStateView from '@/src/components/shared/ApiStateView';
import BottomNavBar from '@/src/components/shared/BottomNavBar';
import { Colors } from '@/src/constants/colors';
import { RootStackParamList } from '@/src/navigation/types';
import EditorBoardTopBar from '@/src/screens/editorBoards/components/EditorBoardTopBar';
import { BoardMemberRow } from '@/src/screens/editorBoards/components';
import {
  fetchEditorBoardBundle,
  removeEditorBoardMember,
  setEditorBoardMemberLead,
} from '@/src/services/editorBoardApi';
import { EditorBoardItem, EditorBoardMember } from '@/src/types/editorBoards';

type EditorBoardMembersScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'EditorBoardMembers'
>;

export default function EditorBoardMembersScreen({
  navigation,
  route,
}: EditorBoardMembersScreenProps) {
  const [board, setBoard] = useState<EditorBoardItem | null>(null);
  const [members, setMembers] = useState<EditorBoardMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const loadMembers = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const bundle = await fetchEditorBoardBundle(route.params.boardId);
      setBoard(bundle.board);
      setMembers(bundle.members);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to load members.');
    } finally {
      setIsLoading(false);
    }
  }, [route.params.boardId]);

  useEffect(() => {
    void loadMembers();
  }, [loadMembers]);

  const handleChangeRole = useCallback(
    (member: EditorBoardMember) => {
      if (member.role === 'Lead') {
        Alert.alert('Change role', `${member.name} is already the lead member.`);
        return;
      }

      Alert.alert('Change role', `Set ${member.name} as lead member?`, [
        { style: 'cancel', text: 'Cancel' },
        {
          text: 'Set lead',
          onPress: async () => {
            try {
              await setEditorBoardMemberLead(route.params.boardId, member.id);
              await loadMembers();
            } catch (error) {
              Alert.alert(
                'Cannot change role',
                error instanceof Error ? error.message : 'Unable to update this member role.',
              );
            }
          },
        },
      ]);
    },
    [loadMembers, route.params.boardId],
  );

  const handleDeleteMember = useCallback(
    (member: EditorBoardMember) => {
      Alert.alert('Delete member', `Remove ${member.name} from this editor board?`, [
        { style: 'cancel', text: 'Cancel' },
        {
          style: 'destructive',
          text: 'Delete',
          onPress: async () => {
            try {
              await removeEditorBoardMember(route.params.boardId, member.id);
              await loadMembers();
            } catch (error) {
              Alert.alert(
                'Cannot delete member',
                error instanceof Error ? error.message : 'Unable to remove this member.',
              );
            }
          },
        },
      ]);
    },
    [loadMembers, route.params.boardId],
  );

  return (
    <View className="flex-1" style={{ backgroundColor: Colors.bg }}>
      <EditorBoardTopBar
        onBack={() => navigation.goBack()}
        subtitle={board?.name ?? 'Editor Board'}
        title="Members"
      />

      {isLoading ? (
        <ApiStateView type="loading" />
      ) : errorMessage ? (
        <ApiStateView type="error" message={errorMessage} onRetry={loadMembers} />
      ) : members.length > 0 ? (
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 16, paddingBottom: 100, gap: 12 }}
          showsVerticalScrollIndicator={false}
        >
          {members.map((member) => (
            <BoardMemberRow
              key={member.id}
              member={member}
              onChangeRole={handleChangeRole}
              onDelete={handleDeleteMember}
            />
          ))}
        </ScrollView>
      ) : (
        <ApiStateView
          type="empty"
          title="No members"
          message="This editor board does not have any members yet."
        />
      )}

      <BottomNavBar activeTab="home" />
    </View>
  );
}
