import React, { useState } from 'react';
import { ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import MaterialIcon from '@/src/components/shared/MaterialIcon';
import { Colors } from '@/src/constants/colors';
import { EDITOR_BOARDS } from '@/src/constants/editorBoardsData';
import { RootStackParamList } from '@/src/navigation/types';
import { EditorBoardRole } from '@/src/types/editorBoards';

import { EditorBoardCard, EditorBoardTopBar } from './components';

type EditorBoardsScreenProps = NativeStackScreenProps<RootStackParamList, 'EditorBoards'>;
type RoleFilter = EditorBoardRole | 'All';

const roleFilters: RoleFilter[] = ['All', 'Owner', 'Lead', 'Member'];

export default function EditorBoardsScreen({ navigation }: EditorBoardsScreenProps) {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('All');

  const filteredBoards = EDITOR_BOARDS.filter((board) => {
    const normalizedSearch = search.trim().toLowerCase();
    const matchesSearch =
      normalizedSearch.length === 0 ||
      board.name.toLowerCase().includes(normalizedSearch) ||
      board.description.toLowerCase().includes(normalizedSearch);
    const matchesRole = roleFilter === 'All' || board.currentUserRole === roleFilter;

    return matchesSearch && matchesRole;
  });

  return (
    <View className="flex-1" style={{ backgroundColor: Colors.bg }}>
      <EditorBoardTopBar
        actionIcon="add"
        onActionPress={() => navigation.navigate('EditorBoardCreate')}
        onBack={() => navigation.goBack()}
        subtitle="Editorial workspace"
        title="Editor Boards"
      />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 104 }}
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
          <Text className="text-[11px] font-bold uppercase" style={{ color: Colors.textMuted }}>
            My boards
          </Text>
          <View className="mt-3 flex-row gap-3">
            <View className="flex-1">
              <Text className="text-[24px] font-bold" style={{ color: Colors.text }}>
                {EDITOR_BOARDS.length}
              </Text>
              <Text className="text-[12px]" style={{ color: Colors.textMuted }}>
                Active boards
              </Text>
            </View>
            <View className="flex-1">
              <Text className="text-[24px] font-bold" style={{ color: Colors.statusReview }}>
                {EDITOR_BOARDS.filter((board) => board.currentUserRole === 'Lead').length}
              </Text>
              <Text className="text-[12px]" style={{ color: Colors.textMuted }}>
                Lead seats
              </Text>
            </View>
          </View>
        </View>

        <View className="mt-4">
          <View className="relative">
            <View className="absolute bottom-0 left-4 top-0 z-10 justify-center">
              <MaterialIcon name="search" color={Colors.textPlaceholder} size={18} />
            </View>
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search editor boards"
              placeholderTextColor={Colors.textPlaceholder}
              accessibilityLabel="Search editor boards"
              className="h-12 rounded-xl pl-10 pr-4 text-[15px]"
              style={{ backgroundColor: Colors.surface, color: Colors.text }}
            />
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mt-3"
          contentContainerStyle={{ gap: 8, paddingVertical: 4 }}
        >
          {roleFilters.map((role) => {
            const isActive = role === roleFilter;
            return (
              <TouchableOpacity
                key={role}
                activeOpacity={0.72}
                onPress={() => setRoleFilter(role)}
                className="rounded-full px-4 py-2"
                style={{
                  backgroundColor: isActive ? Colors.accent : Colors.surface,
                  borderWidth: 1,
                  borderColor: isActive ? Colors.accent : Colors.borderSubtle,
                }}
              >
                <Text
                  className="text-[12px] font-bold"
                  style={{ color: isActive ? Colors.bg : Colors.textMuted }}
                >
                  {role}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View className="mt-4 gap-3">
          {filteredBoards.map((board) => (
            <EditorBoardCard
              key={board.id}
              board={board}
              onPress={() => navigation.navigate('EditorBoardDetail', { boardId: board.id })}
            />
          ))}
        </View>
      </ScrollView>

      <TouchableOpacity
        activeOpacity={0.82}
        onPress={() => navigation.navigate('EditorBoardCreate')}
        accessibilityRole="button"
        accessibilityLabel="Create editor board"
        className="absolute bottom-6 right-5 h-14 w-14 items-center justify-center rounded-full"
        style={{ backgroundColor: Colors.accent }}
      >
        <MaterialIcon name="add" color={Colors.bg} size={28} />
      </TouchableOpacity>
    </View>
  );
}

