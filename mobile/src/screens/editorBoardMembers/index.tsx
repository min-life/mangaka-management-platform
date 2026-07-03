import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import ApiStateView from '@/src/components/shared/ApiStateView';
import BottomNavBar from '@/src/components/shared/BottomNavBar';
import { Colors } from '@/src/constants/colors';
import { RootStackParamList } from '@/src/navigation/types';
import EditorBoardTopBar from '@/src/screens/editorBoards/components/EditorBoardTopBar';
import { BoardMemberRow } from '@/src/screens/editorBoards/components';
import { fetchEditorBoardBundle } from '@/src/services/editorBoardApi';
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
      setErrorMessage(error instanceof Error ? error.message : 'Không thể tải members.');
    } finally {
      setIsLoading(false);
    }
  }, [route.params.boardId]);

  useEffect(() => {
    void loadMembers();
  }, [loadMembers]);

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
            <BoardMemberRow key={member.id} member={member} />
          ))}
        </ScrollView>
      ) : (
        <ApiStateView
          type="empty"
          title="Không có member"
          message="Editor board này chưa có member nào."
        />
      )}

      <BottomNavBar activeTab="home" />
    </View>
  );
}
