import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import ApiStateView from '@/src/components/shared/ApiStateView';
import BottomNavBar from '@/src/components/shared/BottomNavBar';
import { Colors } from '@/src/constants/colors';
import { RootStackParamList } from '@/src/navigation/types';
import { fetchEditorBoards } from '@/src/services/editorBoardApi';
import { EditorBoardItem } from '@/src/types/editorBoards';

import {
  EditorBoardCard,
  EditorBoardListItem,
  EditorBoardRoleFilter,
  EditorBoardRoleFilterValue,
  EditorBoardsEmptyState,
  EditorBoardSearchBar,
  EditorBoardTopBar,
  EditorBoardViewMode,
  EditorBoardViewModeToggle,
} from './components';

type EditorBoardsScreenProps = NativeStackScreenProps<RootStackParamList, 'EditorBoards'>;

export default function EditorBoardsScreen({ navigation }: EditorBoardsScreenProps) {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<EditorBoardRoleFilterValue>('All');
  const [viewMode, setViewMode] = useState<EditorBoardViewMode>('list');
  const [boards, setBoards] = useState<EditorBoardItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const loadBoards = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const result = await fetchEditorBoards({ name: search.trim() || undefined });
      setBoards(result.boards);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Không thể tải editor boards.');
    } finally {
      setIsLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      void loadBoards();
    }, 250);

    return () => clearTimeout(timeout);
  }, [loadBoards]);

  const filteredBoards = useMemo(() => {
    return boards.filter((board) => {
      const matchesRole = roleFilter === 'All' || board.currentUserRole === roleFilter;

      return matchesRole;
    });
  }, [boards, roleFilter]);

  return (
    <View className="flex-1" style={{ backgroundColor: Colors.bg }}>
      <EditorBoardTopBar
        onBack={() => navigation.goBack()}
        rightAction={
          <EditorBoardViewModeToggle viewMode={viewMode} onViewModeChange={setViewMode} />
        }
        title="Editor Boards"
      />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 112 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className="px-4" style={{ zIndex: 20 }}>
          <View className="flex-row items-center gap-2 pb-4 pt-3" style={{ zIndex: 30 }}>
            <View className="flex-1">
              <EditorBoardSearchBar search={search} onSearchChange={setSearch} />
            </View>
            <EditorBoardRoleFilter activeRole={roleFilter} onRoleChange={setRoleFilter} />
          </View>
        </View>

        {isLoading ? (
          <ApiStateView type="loading" />
        ) : errorMessage ? (
          <ApiStateView type="error" message={errorMessage} onRetry={loadBoards} />
        ) : (
          <View
            className={viewMode === 'card' ? 'gap-4 px-4 pt-1' : undefined}
            style={
              viewMode === 'list'
                ? { borderTopWidth: 1, borderTopColor: Colors.borderFaint }
                : undefined
            }
          >
            {filteredBoards.length > 0 ? (
              filteredBoards.map((board, index) =>
                viewMode === 'list' ? (
                  <EditorBoardListItem
                    key={board.id}
                    board={board}
                    isLast={index === filteredBoards.length - 1}
                    onPress={() => navigation.navigate('EditorBoardDetail', { boardId: board.id })}
                  />
                ) : (
                  <EditorBoardCard
                    key={board.id}
                    board={board}
                    onPress={() => navigation.navigate('EditorBoardDetail', { boardId: board.id })}
                  />
                ),
              )
            ) : (
              <EditorBoardsEmptyState />
            )}
          </View>
        )}
      </ScrollView>

      <BottomNavBar activeTab="home" />
    </View>
  );
}
