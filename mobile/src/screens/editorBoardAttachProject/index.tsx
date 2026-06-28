import React, { useMemo, useState } from 'react';
import { ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import MaterialIcon from '@/src/components/shared/MaterialIcon';
import { Colors } from '@/src/constants/colors';
import { findEditorBoard } from '@/src/constants/editorBoardsData';
import { PROJECTS } from '@/src/constants/projectsData';
import { RootStackParamList } from '@/src/navigation/types';
import EditorBoardTopBar from '@/src/screens/editorBoards/components/EditorBoardTopBar';

type EditorBoardAttachProjectScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'EditorBoardAttachProject'
>;

export default function EditorBoardAttachProjectScreen({
  navigation,
  route,
}: EditorBoardAttachProjectScreenProps) {
  const board = findEditorBoard(route.params.boardId);
  const [search, setSearch] = useState('');
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>(
    board?.projectIds.slice(0, 1) ?? [],
  );

  const filteredProjects = useMemo(() => {
    const query = search.trim().toLowerCase();
    return PROJECTS.filter(
      (project) =>
        query.length === 0 ||
        project.name.toLowerCase().includes(query) ||
        project.owner.toLowerCase().includes(query),
    );
  }, [search]);

  const toggleProject = (projectId: string) => {
    setSelectedProjectIds((current) =>
      current.includes(projectId)
        ? current.filter((id) => id !== projectId)
        : [...current, projectId],
    );
  };

  return (
    <View className="flex-1" style={{ backgroundColor: Colors.bg }}>
      <EditorBoardTopBar
        onBack={() => navigation.goBack()}
        subtitle={board?.name ?? 'Editor Board'}
        title="Attach Project"
      />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 104 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="mt-4">
          <View className="relative">
            <View className="absolute bottom-0 left-4 top-0 z-10 justify-center">
              <MaterialIcon name="search" color={Colors.textPlaceholder} size={18} />
            </View>
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search projects"
              placeholderTextColor={Colors.textPlaceholder}
              className="h-12 rounded-xl pl-10 pr-4 text-[15px]"
              style={{ backgroundColor: Colors.surface, color: Colors.text }}
            />
          </View>
        </View>

        <View className="mt-4 gap-3">
          {filteredProjects.map((project) => {
            const selected = selectedProjectIds.includes(project.id);
            const alreadyInBoard = board?.projectIds.includes(project.id) ?? false;
            return (
              <TouchableOpacity
                key={project.id}
                activeOpacity={0.75}
                onPress={() => toggleProject(project.id)}
                className="flex-row items-center gap-3 rounded-xl p-3"
                style={{
                  backgroundColor: selected ? 'rgba(255,211,105,0.1)' : Colors.surface,
                  borderWidth: 1,
                  borderColor: selected ? Colors.accent : Colors.borderSubtle,
                }}
              >
                <View className="h-10 w-10 items-center justify-center rounded-lg" style={{ backgroundColor: project.avatarBg }}>
                  <Text className="text-[12px] font-bold text-white">{project.avatarInitials}</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-[14px] font-bold" style={{ color: Colors.text }}>
                    {project.name}
                  </Text>
                  <Text className="mt-0.5 text-[12px]" style={{ color: Colors.textMuted }}>
                    {alreadyInBoard ? 'Already attached to this board' : project.owner}
                  </Text>
                </View>
                <MaterialIcon name={selected ? 'check' : 'add'} color={selected ? Colors.accent : Colors.textFaint} size={20} />
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <View className="absolute bottom-0 left-0 right-0 p-4" style={{ backgroundColor: Colors.bg }}>
        <TouchableOpacity
          activeOpacity={0.82}
          onPress={() => navigation.goBack()}
          className="h-14 flex-row items-center justify-center gap-2 rounded-xl"
          style={{ backgroundColor: Colors.accent }}
        >
          <MaterialIcon name="folder" color={Colors.bg} size={21} />
          <Text className="text-[15px] font-bold" style={{ color: Colors.bg }}>
            Attach {selectedProjectIds.length} Project{selectedProjectIds.length === 1 ? '' : 's'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

