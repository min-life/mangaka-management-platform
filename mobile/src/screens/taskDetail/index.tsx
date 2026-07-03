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
  ResourceTaskComment,
  ResourceTaskFrame,
} from '@/src/types/resources';
import {
  createDiscussionComment,
  createFileDiscussionComment,
  fetchFileDiscussionComments,
  fetchFileDiscussionTasks,
  fetchFrameDetail,
  fetchFrameDiscussionComments,
  fetchResourceFileBundle,
  fetchTaskDiscussionComments,
  fetchTaskDiscussionFrames,
} from '@/src/services/resourceApi';
import { fetchTask } from '@/src/services/taskApi';

import {
  C,
  TaskDetailTopBar,
  TaskPreviewSection,
} from '@/src/screens/taskDetail/components';
import {
  DiscussionComposer,
  DiscussionPanel,
  DiscussionScope,
  MaterialsPanel,
  OverviewPanel,
  ResourceFileTab,
  ResourceFileTabBar,
  TasksPanel,
} from '@/src/screens/resourceFile/components/ResourceFilePanels';

const TASK_DETAIL_TABS: ResourceFileTab[] = ['Overview', 'Tasks', 'Discussion', 'Materials'];

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
  const [file, setFile] = useState<ResourceFileNode | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(route.params?.taskId ?? null);
  const [selectedFrame, setSelectedFrame] = useState<ResourceTaskFrame | null>(null);
  const [discussionScope, setDiscussionScope] = useState<DiscussionScope>('file');
  const [discussionComments, setDiscussionComments] = useState<ResourceTaskComment[]>([]);
  const [fileDiscussionCommentCount, setFileDiscussionCommentCount] = useState(0);
  const [discussionErrorMessage, setDiscussionErrorMessage] = useState('');
  const [isDiscussionCommentsLoading, setIsDiscussionCommentsLoading] = useState(false);
  const [discussionTasks, setDiscussionTasks] = useState<ResourceFileTask[]>([]);
  const [isDiscussionTasksLoading, setIsDiscussionTasksLoading] = useState(false);
  const [selectedDiscussionTaskId, setSelectedDiscussionTaskId] = useState<string | null>(null);
  const [discussionFrames, setDiscussionFrames] = useState<ResourceTaskFrame[]>([]);
  const [isDiscussionFramesLoading, setIsDiscussionFramesLoading] = useState(false);
  const [discussionFrameStatusMessage, setDiscussionFrameStatusMessage] = useState('');
  const [selectedDiscussionFrameId, setSelectedDiscussionFrameId] = useState<string | null>(null);

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
      setFileDiscussionCommentCount(nextFile.comments?.length ?? 0);
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
  const currentFileId = file?.id ?? null;

  const description = useMemo(
    () => (file ? buildFileDescription(file.content, file.language) : ''),
    [file],
  );

  const discussionTaskOptions = useMemo(
    () =>
      discussionTasks.map((task) => ({
        description: task.status.replace('INPROGRESS', 'IN PROGRESS'),
        id: task.id,
        label: task.title,
      })),
    [discussionTasks],
  );

  const discussionFrameOptions = useMemo(
    () =>
      discussionFrames.map((frame, index) => ({
        description: `${Math.round(frame.width)} x ${Math.round(frame.height)}`,
        id: frame.id,
        label: frame.name || `Frame ${index + 1}`,
      })),
    [discussionFrames],
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

  const loadFileDiscussionComments = useCallback(async () => {
    if (!currentFileId) return;

    setDiscussionErrorMessage('');
    setIsDiscussionCommentsLoading(true);

    try {
      const nextComments = await fetchFileDiscussionComments(currentFileId);
      setDiscussionComments(nextComments);
      setFileDiscussionCommentCount(nextComments.length);
    } catch (error) {
      setDiscussionComments([]);
      setDiscussionErrorMessage(
        error instanceof Error ? error.message : 'Không thể tải file comments.',
      );
    } finally {
      setIsDiscussionCommentsLoading(false);
    }
  }, [currentFileId]);

  const loadDiscussionTasks = useCallback(async () => {
    if (!currentFileId) return;

    setIsDiscussionTasksLoading(true);

    try {
      const nextTasks = await fetchFileDiscussionTasks(currentFileId);
      setDiscussionTasks(nextTasks);
    } catch {
      setDiscussionTasks([]);
    } finally {
      setIsDiscussionTasksLoading(false);
    }
  }, [currentFileId]);

  const handleSelectFileComments = useCallback(async () => {
    setDiscussionScope('file');
    setSelectedDiscussionTaskId(null);
    setSelectedDiscussionFrameId(null);
    setDiscussionFrames([]);
    setDiscussionFrameStatusMessage('');
    setSelectedFrame(null);
    void loadDiscussionTasks();
    await loadFileDiscussionComments();
  }, [loadDiscussionTasks, loadFileDiscussionComments]);

  const loadTaskDiscussion = useCallback(async (taskId: string) => {
    setDiscussionScope('task');
    setSelectedDiscussionTaskId(taskId);
    setSelectedDiscussionFrameId(null);
    setSelectedTaskId(taskId);
    setDiscussionFrames([]);
    setDiscussionFrameStatusMessage('');
    setSelectedFrame(null);
    setDiscussionErrorMessage('');
    setIsDiscussionCommentsLoading(true);
    setIsDiscussionFramesLoading(true);

    try {
      const nextComments = await fetchTaskDiscussionComments(taskId);
      setDiscussionComments(nextComments);
    } catch (error) {
      setDiscussionComments([]);
      setDiscussionErrorMessage(
        error instanceof Error ? error.message : 'Không thể tải task comments.',
      );
    } finally {
      setIsDiscussionCommentsLoading(false);
    }

    try {
      const nextFrames = await fetchTaskDiscussionFrames(taskId);
      setDiscussionFrames(nextFrames);
    } catch {
      setDiscussionFrames([]);
      setDiscussionFrameStatusMessage(
        'Chưa thể tải frames cho task này. Endpoint /tasks/:id/frames đang chờ backend bổ sung.',
      );
    } finally {
      setIsDiscussionFramesLoading(false);
    }
  }, []);

  const loadFrameDiscussion = useCallback(async (frameId: string) => {
    const fallbackFrame = discussionFrames.find((frame) => frame.id === frameId) ?? null;
    setDiscussionScope('frame');
    setSelectedDiscussionFrameId(frameId);
    setDiscussionErrorMessage('');
    setIsDiscussionCommentsLoading(true);

    try {
      const frameDetail = await fetchFrameDetail(frameId).catch(() => fallbackFrame);
      if (frameDetail) {
        setSelectedFrame(frameDetail);
      }

      const nextComments = await fetchFrameDiscussionComments(frameId);
      setDiscussionComments(nextComments);
    } catch (error) {
      setDiscussionComments([]);
      setDiscussionErrorMessage(
        error instanceof Error ? error.message : 'Không thể tải frame comments.',
      );
    } finally {
      setIsDiscussionCommentsLoading(false);
    }
  }, [discussionFrames]);

  useEffect(() => {
    if (activeTab === 'Discussion') {
      void handleSelectFileComments();
    }
  }, [activeTab, handleSelectFileComments]);

  const handleRetryDiscussionComments = () => {
    if (discussionScope === 'file') {
      void loadFileDiscussionComments();
      return;
    }

    if (discussionScope === 'task' && selectedDiscussionTaskId) {
      void loadTaskDiscussion(selectedDiscussionTaskId);
      return;
    }

    if (discussionScope === 'frame' && selectedDiscussionFrameId) {
      void loadFrameDiscussion(selectedDiscussionFrameId);
    }
  };

  const handleCreateDiscussionComment = async (text: string) => {
    if (discussionScope === 'file' && currentFileId) {
      await createFileDiscussionComment({
        fileId: currentFileId,
        text,
      });
      await loadFileDiscussionComments();
      return;
    }

    if (discussionScope === 'task' && selectedDiscussionTaskId) {
      await createDiscussionComment({
        taskId: selectedDiscussionTaskId,
        text,
      });
      const nextComments = await fetchTaskDiscussionComments(selectedDiscussionTaskId);
      setDiscussionComments(nextComments);
      return;
    }

    if (discussionScope === 'frame' && selectedDiscussionTaskId && selectedDiscussionFrameId) {
      await createDiscussionComment({
        frameId: selectedDiscussionFrameId,
        taskId: selectedDiscussionTaskId,
        text,
      });
      const nextComments = await fetchFrameDiscussionComments(selectedDiscussionFrameId);
      setDiscussionComments(nextComments);
      return;
    }

    throw new Error('Vui lòng chọn task hoặc frame trước khi bình luận.');
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
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: activeTab === 'Discussion' ? 148 : 120,
        }}
        showsVerticalScrollIndicator={false}
      >
        <TaskPreviewSection
          imageUri={previewImageUri}
          selectedFrame={selectedFrame}
          showStatusBadge={false}
          status={selectedVersion ? 'Material Preview' : 'File Preview'}
        />

        <ResourceFileTabBar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          tabs={TASK_DETAIL_TABS}
        />

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
            activeScope={discussionScope}
            comments={discussionComments}
            errorMessage={discussionErrorMessage}
            fileCommentCount={fileDiscussionCommentCount}
            frameOptions={discussionFrameOptions}
            frameStatusMessage={discussionFrameStatusMessage}
            isCommentsLoading={isDiscussionCommentsLoading}
            isFramesLoading={isDiscussionFramesLoading}
            isTasksLoading={isDiscussionTasksLoading}
            onRetryComments={handleRetryDiscussionComments}
            onSelectFileComments={handleSelectFileComments}
            onSelectFrameComments={loadFrameDiscussion}
            onSelectTaskComments={loadTaskDiscussion}
            selectedFrameId={selectedDiscussionFrameId}
            selectedTaskId={selectedDiscussionTaskId}
            taskOptions={discussionTaskOptions}
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

      {activeTab === 'Discussion' ? (
        <View
          className="absolute left-0 right-0 px-4"
          style={{
            bottom: 24,
          }}
        >
          <DiscussionComposer
            activeScope={discussionScope}
            onCreateComment={handleCreateDiscussionComment}
          />
        </View>
      ) : null}
    </View>
  );
}
