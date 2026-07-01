import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import ApiStateView from '@/src/components/shared/ApiStateView';
import { Colors } from '@/src/constants/colors';
import { RootStackParamList } from '@/src/navigation/types';
import {
  ResourceFileMaterialVersion,
  ResourceFileNode,
  ResourceFileTask,
  ResourceTaskFrame,
} from '@/src/types/resources';
import {
  createFileDiscussionComment,
  fetchFolderBundle,
  fetchResourceFileBundle,
} from '@/src/services/resourceApi';

import {
  C,
  TaskDetailTopBar,
  TaskPreviewSection,
} from '@/src/screens/taskDetail/components';
import {
  MaterialsPanel,
  OverviewPanel,
  DiscussionPanel,
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
  const [activeTab, setActiveTab] = useState<ResourceFileTab>(
    route.params.initialTab ?? 'Overview',
  );
  const [file, setFile] = useState<ResourceFileNode | null>(null);
  const [parentName, setParentName] = useState('Resource');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [selectedFrame, setSelectedFrame] = useState<ResourceTaskFrame | null>(null);

  const loadFile = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const [nextFile, parentBundle] = await Promise.all([
        fetchResourceFileBundle(route.params.fileId),
        fetchFolderBundle(route.params.parentFolderId).catch(() => null),
      ]);
      setFile(nextFile);
      setParentName(parentBundle?.folder.name ?? 'Resource');
      setSelectedVersionId(nextFile.materialVersions?.[0]?.id ?? null);
      setSelectedTaskId(nextFile.tasks?.[0]?.id ?? null);
      setSelectedFrame(nextFile.tasks?.[0]?.frames[0] ?? null);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Không thể tải file.');
    } finally {
      setIsLoading(false);
    }
  }, [route.params.fileId, route.params.parentFolderId]);

  useEffect(() => {
    void loadFile();
  }, [loadFile]);

  const versions = file?.materialVersions ?? [];
  const tasks = file?.tasks ?? [];
  const comments = file?.comments ?? [];

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

  const handleCreateFileComment = async (text: string) => {
    await createFileDiscussionComment({
      fileId: route.params.fileId,
      text,
    });
    const nextFile = await fetchResourceFileBundle(route.params.fileId);
    setFile(nextFile);
  };

  if (isLoading) {
    return (
      <View className="flex-1" style={{ backgroundColor: Colors.bg }}>
        <TaskDetailTopBar subtitle="Resource" title="File" onBack={() => navigation.goBack()} />
        <ApiStateView type="loading" />
      </View>
    );
  }

  if (errorMessage || !file) {
    return (
      <View className="flex-1" style={{ backgroundColor: Colors.bg }}>
        <TaskDetailTopBar
          subtitle="Resource"
          title="File"
          onBack={() => navigation.goBack()}
        />
        <ApiStateView type="error" message={errorMessage || 'File not found'} onRetry={loadFile} />
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
            onSelectFrame={handleSelectFrame}
            onSelectTask={handleSelectTask}
            selectedFrame={selectedFrame}
            selectedTaskId={selectedTaskId}
            showTaskDiscussion={false}
            tasks={tasks}
          />
        )}

        {activeTab === 'Discussion' && (
          <DiscussionPanel
            comments={comments}
            onCreateComment={handleCreateFileComment}
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
