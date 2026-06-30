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
import { fetchResourceFileBundle } from '@/src/services/resourceApi';
import { fetchTask } from '@/src/services/taskApi';

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
} from '@/src/screens/resourceFile/components/ResourceFilePanels';

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

type TaskDetailScreenProps = NativeStackScreenProps<RootStackParamList, 'TaskDetail'>;

export default function TaskDetailScreen({ navigation, route }: TaskDetailScreenProps) {
  const [activeTab, setActiveTab] = useState<ResourceFileTab>('Overview');
  const [comment, setComment] = useState('');
  const [file, setFile] = useState<ResourceFileNode | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(route.params?.taskId ?? null);
  const [selectedFrame, setSelectedFrame] = useState<ResourceTaskFrame | null>(null);

  const loadTaskDetail = useCallback(async () => {
    const taskId = route.params?.taskId;
    if (!taskId) {
      setErrorMessage('Task not found');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const task = await fetchTask(taskId);
      const fileId = String(task.fileId ?? task.file?.id ?? '');
      if (!fileId) throw new Error('Task does not have a file.');
      const nextFile = await fetchResourceFileBundle(fileId);
      const selectedTask = nextFile.tasks?.find((item) => item.id === taskId) ?? nextFile.tasks?.[0];
      setFile(nextFile);
      setSelectedTaskId(selectedTask?.id ?? taskId);
      setSelectedFrame(selectedTask?.frames[0] ?? null);
      setSelectedVersionId(nextFile.materialVersions?.[0]?.id ?? null);
      setActiveTab('Tasks');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Không thể tải task.');
    } finally {
      setIsLoading(false);
    }
  }, [route.params?.taskId]);

  useEffect(() => {
    void loadTaskDetail();
  }, [loadTaskDetail]);

  const versions = file?.materialVersions ?? [];
  const tasks = file?.tasks ?? [];

  const description = useMemo(
    () => (file ? buildFileDescription(file.content, file.language) : ''),
    [file],
  );

  const selectedVersion =
    versions.find((version) => version.id === selectedVersionId) ?? versions[0];
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

  if (isLoading) {
    return (
      <View className="flex-1" style={{ backgroundColor: Colors.bg }}>
        <TaskDetailTopBar subtitle="Task" title="Loading" onBack={() => navigation.goBack()} />
        <ApiStateView type="loading" />
      </View>
    );
  }

  if (errorMessage || !file) {
    return (
      <View className="flex-1" style={{ backgroundColor: Colors.bg }}>
        <TaskDetailTopBar
          subtitle="Task"
          title="Detail"
          onBack={() => navigation.goBack()}
        />
        <ApiStateView
          type="error"
          message={errorMessage || 'Task not found'}
          onRetry={loadTaskDetail}
        />
      </View>
    );
  }

  return (
    <View className="flex-1" style={{ backgroundColor: C.bg }}>
      <TaskDetailTopBar
        subtitle="Task"
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
