import React, { useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Colors } from '@/src/constants/colors';
import {
  findResourceFile,
  findResourceNode,
  getProjectResourceTree,
} from '@/src/constants/resourcesData';
import { RootStackParamList } from '@/src/navigation/types';
import {
  ResourceFileMaterialVersion,
  ResourceFileTask,
  ResourceTaskFrame,
} from '@/src/types/resources';

import {
  C,
  TaskDetailTopBar,
  TaskPreviewSection,
} from '@/src/screens/taskDetail/components';
import {
  MaterialsPanel,
  OverviewPanel,
  ResourceFileTab,
  ResourceFileTabBar,
  TasksPanel,
} from './components/ResourceFilePanels';

type ResourceFileScreenProps = NativeStackScreenProps<RootStackParamList, 'ResourceFile'>;

function buildFileDescription(content: string, language: string) {
  const meaningfulLines = content
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('```'));

  const heading = meaningfulLines.find((line) => line.startsWith('# '));
  const firstBodyLine = meaningfulLines.find(
    (line) => !line.startsWith('#') && !line.startsWith('- '),
  );

  const summary = firstBodyLine ?? heading?.replace(/^#\s+/, '') ?? 'Resource file';

  return `${summary} Review this ${language} resource as part of the manga production workspace. Check the annotated areas, discussion notes, and approval status before moving it forward.`;
}

export default function ResourceFileScreen({
  navigation,
  route,
}: ResourceFileScreenProps) {
  const [activeTab, setActiveTab] = useState<ResourceFileTab>('Overview');
  const [comment, setComment] = useState('');
  const root = getProjectResourceTree(route.params.projectId);
  const file = findResourceFile(root, route.params.fileId);
  const parentNode = findResourceNode(root, route.params.parentFolderId);
  const parentName = parentNode?.type === 'folder' ? parentNode.name : 'Resource';
  const versions = file?.materialVersions ?? [];
  const tasks = file?.tasks ?? [];
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(
    versions[0]?.id ?? null,
  );
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(
    tasks[0]?.id ?? null,
  );
  const [selectedFrame, setSelectedFrame] = useState<ResourceTaskFrame | null>(
    tasks[0]?.frames[0] ?? null,
  );

  const description = useMemo(
    () => (file ? buildFileDescription(file.content, file.language) : ''),
    [file],
  );

  const selectedVersion = versions.find((version) => version.id === selectedVersionId) ?? versions[0];
  const previewImageUri = selectedVersion?.materials.imageUri ?? file?.previewImageUri;

  const handleSelectFrame = (frame: ResourceTaskFrame) => {
    setSelectedFrame((prev) => (prev?.id === frame.id ? null : frame));
  };

  const handleSelectTask = (task: ResourceFileTask | null) => {
    if (task === null) {
      setSelectedTaskId(null);
      setSelectedFrame(null);
      return;
    }
    setSelectedTaskId(task.id);
    setSelectedFrame(task.frames[0] ?? null);
    setActiveTab('Tasks');
  };

  const handleSelectVersion = (version: ResourceFileMaterialVersion) => {
    setSelectedVersionId(version.id);
    setSelectedFrame(null);
    setActiveTab('Materials');
  };

  if (!file) {
    return (
      <View className="flex-1" style={{ backgroundColor: Colors.bg }}>
        <TaskDetailTopBar
          subtitle="Resource"
          title="File"
          onBack={() => navigation.goBack()}
        />
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-center text-[16px] font-bold" style={{ color: Colors.text }}>
            File not found
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1" style={{ backgroundColor: C.bg }}>
      <TaskDetailTopBar
        subtitle={parentName}
        title={file.name}
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        <TaskPreviewSection
          imageUri={previewImageUri}
          selectedFrame={selectedFrame}
          showStatusBadge={false}
          status={selectedVersion ? 'Material Preview' : 'File Preview'}
        />

        <ResourceFileTabBar activeTab={activeTab} onTabChange={setActiveTab} />

        {activeTab === 'Overview' && (
          <OverviewPanel
            description={description}
            fileContent={file.content}
          />
        )}

        {activeTab === 'Tasks' && (
          <TasksPanel
            comment={comment}
            onCommentChange={setComment}
            onSelectFrame={handleSelectFrame}
            onSelectTask={handleSelectTask}
            selectedFrame={selectedFrame}
            selectedTaskId={selectedTaskId}
            tasks={tasks}
          />
        )}

        {activeTab === 'Materials' && (
          <MaterialsPanel
            selectedVersionId={selectedVersion?.id ?? null}
            versions={versions}
            onSelectVersion={handleSelectVersion}
          />
        )}
      </ScrollView>
    </View>
  );
}
