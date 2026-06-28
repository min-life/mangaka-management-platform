import React, { useState } from 'react';
import { ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import MaterialIcon from '@/src/components/shared/MaterialIcon';
import { Colors } from '@/src/constants/colors';
import { PROJECTS } from '@/src/constants/projectsData';
import { RootStackParamList } from '@/src/navigation/types';
import { ApplicationMaterialPage, ApplicationType } from '@/src/types/applications';

import { getApplicationTypeLabel } from '@/src/screens/applications/components';
import ApplicationTopBar from '@/src/screens/applications/components/ApplicationTopBar';

type ApplicationCreateScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'ApplicationCreate'
>;

const materialOptions: ApplicationMaterialPage[] = [
  { id: 'page-01', title: 'Chapter page', fileName: 'chapter-page-01.psd', status: 'Ready' },
  { id: 'cover', title: 'Cover draft', fileName: 'cover-draft.png', status: 'Needs review' },
  { id: 'manifest', title: 'Export manifest', fileName: 'export-manifest.json', status: 'Ready' },
];

function TypeOption({
  active,
  label,
  onPress,
}: {
  active: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={onPress}
      className="flex-1 rounded-xl px-3 py-4"
      style={{
        backgroundColor: active ? Colors.accent : Colors.surface,
        borderWidth: 1,
        borderColor: active ? Colors.accent : Colors.borderSubtle,
      }}
    >
      <Text
        className="text-center text-[13px] font-bold"
        style={{ color: active ? Colors.bg : Colors.text }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

export default function ApplicationCreateScreen({
  navigation,
  route,
}: ApplicationCreateScreenProps) {
  const project = PROJECTS.find((item) => item.id === route.params.projectId);
  const [type, setType] = useState<ApplicationType>('MANUSCRIPT_REVIEW');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedMaterialIds, setSelectedMaterialIds] = useState<string[]>([
    materialOptions[0].id,
  ]);

  const toggleMaterial = (materialId: string) => {
    setSelectedMaterialIds((current) =>
      current.includes(materialId)
        ? current.filter((id) => id !== materialId)
        : [...current, materialId],
    );
  };

  return (
    <View className="flex-1" style={{ backgroundColor: Colors.bg }}>
      <ApplicationTopBar
        onBack={() => navigation.goBack()}
        subtitle={project?.name ?? 'Project'}
        title="Create Application"
      />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="mt-5 gap-5">
          <View>
            <Text className="mb-3 text-[12px] font-bold uppercase" style={{ color: Colors.textMuted }}>
              Application type
            </Text>
            <View className="flex-row gap-3">
              <TypeOption
                active={type === 'MANUSCRIPT_REVIEW'}
                label={getApplicationTypeLabel('MANUSCRIPT_REVIEW')}
                onPress={() => setType('MANUSCRIPT_REVIEW')}
              />
              <TypeOption
                active={type === 'PUBLISH_REQUEST'}
                label={getApplicationTypeLabel('PUBLISH_REQUEST')}
                onPress={() => setType('PUBLISH_REQUEST')}
              />
            </View>
          </View>

          <View className="gap-3">
            <Text className="text-[12px] font-bold uppercase" style={{ color: Colors.textMuted }}>
              Details
            </Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="Application title"
              placeholderTextColor={Colors.textPlaceholder}
              accessibilityLabel="Application title"
              className="h-12 rounded-xl px-4 text-[15px]"
              style={{ backgroundColor: Colors.surface, color: Colors.text }}
            />
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Description"
              placeholderTextColor={Colors.textPlaceholder}
              accessibilityLabel="Application description"
              multiline
              textAlignVertical="top"
              className="min-h-[132px] rounded-xl px-4 py-3 text-[15px]"
              style={{ backgroundColor: Colors.surface, color: Colors.text }}
            />
          </View>

          <View className="gap-3">
            <View className="flex-row items-center justify-between">
              <Text className="text-[12px] font-bold uppercase" style={{ color: Colors.textMuted }}>
                Materials
              </Text>
              <Text className="text-[12px]" style={{ color: Colors.textFaint }}>
                {selectedMaterialIds.length} selected
              </Text>
            </View>

            {materialOptions.map((material) => {
              const selected = selectedMaterialIds.includes(material.id);
              return (
                <TouchableOpacity
                  key={material.id}
                  activeOpacity={0.75}
                  onPress={() => toggleMaterial(material.id)}
                  className="flex-row items-center gap-3 rounded-xl p-3"
                  style={{
                    backgroundColor: selected ? 'rgba(255,211,105,0.1)' : Colors.surface,
                    borderWidth: 1,
                    borderColor: selected ? Colors.accent : Colors.borderSubtle,
                  }}
                >
                  <View
                    className="h-9 w-9 items-center justify-center rounded-lg"
                    style={{ backgroundColor: selected ? Colors.accent : Colors.overlayLight }}
                  >
                    <MaterialIcon
                      name={selected ? 'check' : 'file'}
                      color={selected ? Colors.bg : Colors.textMuted}
                      size={19}
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-[14px] font-bold" style={{ color: Colors.text }}>
                      {material.title}
                    </Text>
                    <Text className="mt-0.5 text-[12px]" style={{ color: Colors.textMuted }}>
                      {material.fileName}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          <View className="gap-3 pt-2">
            <TouchableOpacity
              activeOpacity={0.82}
              onPress={() => navigation.goBack()}
              accessibilityRole="button"
              accessibilityLabel="Submit application"
              className="h-14 flex-row items-center justify-center gap-2 rounded-xl"
              style={{ backgroundColor: Colors.accent }}
            >
              <MaterialIcon name="send" color={Colors.bg} size={20} />
              <Text className="text-[15px] font-bold" style={{ color: Colors.bg }}>
                Send Application
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.72}
              onPress={() => navigation.goBack()}
              accessibilityRole="button"
              accessibilityLabel="Save draft"
              className="h-12 items-center justify-center rounded-xl"
              style={{
                borderWidth: 1,
                borderColor: Colors.borderFaint,
              }}
            >
              <Text className="text-[14px] font-bold" style={{ color: Colors.textMuted }}>
                Save Draft
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
