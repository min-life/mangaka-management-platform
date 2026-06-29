import React, { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import BottomNavBar from '@/src/components/shared/BottomNavBar';
import { Colors } from '@/src/constants/colors';
import { EDITOR_BOARDS } from '@/src/constants/editorBoardsData';
import { RootStackParamList } from '@/src/navigation/types';

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

  const filteredBoards = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return EDITOR_BOARDS.filter((board) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        board.name.toLowerCase().includes(normalizedSearch) ||
        board.description.toLowerCase().includes(normalizedSearch);
      const matchesRole = roleFilter === 'All' || board.currentUserRole === roleFilter;

      return matchesSearch && matchesRole;
    });
  }, [roleFilter, search]);

  return (
    <View className="flex-1" style={{ backgroundColor: Colors.bg }}>
      <EditorBoardTopBar
        onBack={() => navigation.goBack()}
        title="Editor Boards"
      />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 24 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className="px-4">
          <EditorBoardSearchBar search={search} onSearchChange={setSearch} />
          <View className="flex-row items-center gap-3">
            <View className="flex-1">
              <EditorBoardRoleFilter activeRole={roleFilter} onRoleChange={setRoleFilter} />
            </View>
            <EditorBoardViewModeToggle viewMode={viewMode} onViewModeChange={setViewMode} />
          </View>
        </View>

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
      </ScrollView>

      <BottomNavBar activeTab="home" />
    </View>
  );
}
