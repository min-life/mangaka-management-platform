import React, { useState } from 'react';
import { ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import MaterialIcon from '@/src/components/shared/MaterialIcon';
import { Colors } from '@/src/constants/colors';
import { EDITOR_BOARD_MEMBERS } from '@/src/constants/editorBoardsData';
import { PROJECTS } from '@/src/constants/projectsData';
import { RootStackParamList } from '@/src/navigation/types';
import EditorBoardTopBar from '@/src/screens/editorBoards/components/EditorBoardTopBar';

type EditorBoardCreateScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'EditorBoardCreate'
>;

export default function EditorBoardCreateScreen({
  navigation,
}: EditorBoardCreateScreenProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [leadId, setLeadId] = useState(EDITOR_BOARD_MEMBERS[0].id);
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([PROJECTS[0].id]);

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
        subtitle="Editorial workspace"
        title="Create Board"
      />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="mt-5 gap-5">
          <View className="gap-3">
            <Text className="text-[12px] font-bold uppercase" style={{ color: Colors.textMuted }}>
              Board details
            </Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Board name"
              placeholderTextColor={Colors.textPlaceholder}
              className="h-12 rounded-xl px-4 text-[15px]"
              style={{ backgroundColor: Colors.surface, color: Colors.text }}
            />
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Description"
              placeholderTextColor={Colors.textPlaceholder}
              multiline
              textAlignVertical="top"
              className="min-h-[120px] rounded-xl px-4 py-3 text-[15px]"
              style={{ backgroundColor: Colors.surface, color: Colors.text }}
            />
          </View>

          <View className="gap-3">
            <Text className="text-[12px] font-bold uppercase" style={{ color: Colors.textMuted }}>
              Pick lead
            </Text>
            {EDITOR_BOARD_MEMBERS.slice(0, 4).map((member) => {
              const active = leadId === member.id;
              return (
                <TouchableOpacity
                  key={member.id}
                  activeOpacity={0.75}
                  onPress={() => setLeadId(member.id)}
                  className="flex-row items-center gap-3 rounded-xl p-3"
                  style={{
                    backgroundColor: active ? 'rgba(255,211,105,0.1)' : Colors.surface,
                    borderWidth: 1,
                    borderColor: active ? Colors.accent : Colors.borderSubtle,
                  }}
                >
                  <View
                    className="h-9 w-9 items-center justify-center rounded-lg"
                    style={{ backgroundColor: active ? Colors.accent : Colors.iconBg }}
                  >
                    <Text className="text-[11px] font-bold" style={{ color: active ? Colors.bg : Colors.accent }}>
                      {member.initials}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-[14px] font-bold" style={{ color: Colors.text }}>
                      {member.name}
                    </Text>
                    <Text className="text-[12px]" style={{ color: Colors.textMuted }}>
                      {member.email}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          <View className="gap-3">
            <Text className="text-[12px] font-bold uppercase" style={{ color: Colors.textMuted }}>
              Attach projects
            </Text>
            {PROJECTS.slice(0, 4).map((project) => {
              const selected = selectedProjectIds.includes(project.id);
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
                  <View
                    className="h-9 w-9 items-center justify-center rounded-lg"
                    style={{ backgroundColor: project.avatarBg }}
                  >
                    <Text className="text-[11px] font-bold text-white">{project.avatarInitials}</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-[14px] font-bold" style={{ color: Colors.text }}>
                      {project.name}
                    </Text>
                    <Text className="text-[12px]" style={{ color: Colors.textMuted }}>
                      {project.editorBoard}
                    </Text>
                  </View>
                  <MaterialIcon name={selected ? 'check' : 'add'} color={selected ? Colors.accent : Colors.textFaint} size={20} />
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity
            activeOpacity={0.82}
            onPress={() => navigation.goBack()}
            className="h-14 flex-row items-center justify-center gap-2 rounded-xl"
            style={{ backgroundColor: Colors.accent }}
          >
            <MaterialIcon name="groups" color={Colors.bg} size={21} />
            <Text className="text-[15px] font-bold" style={{ color: Colors.bg }}>
              Create Board
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

