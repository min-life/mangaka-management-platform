import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import ApiStateView from '@/src/components/shared/ApiStateView';
import { Colors } from '@/src/constants/colors';
import { RootStackParamList } from '@/src/navigation/types';
import { ApiComment } from '@/src/services/apiTypes';
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
import { mapComment } from '@/src/services/mappers';
import { subscribeToComments } from '@/src/services/realtimeClient';

import { C, TaskDetailTopBar, TaskPreviewSection } from '@/src/screens/taskDetail/components';
import {
  DiscussionComposer,
  DiscussionPanel,
  DiscussionScope,
  OverviewPanel,
  ResourceFileTab,
  ResourceFileTabBar,
  TasksPanel,
  VersionsPanel,
} from '@/src/screens/resourceFile/components/ResourceFilePanels';
import { useTaskMaterialVersions } from '@/src/screens/resourceFile/useTaskMaterialVersions';

const TASK_DETAIL_TABS: ResourceFileTab[] = ['Overview', 'Tasks', 'Discussion', 'Versions'];

function normalizeTaskDetailTab(tab?: ResourceFileTab): ResourceFileTab {
  return tab === 'Materials' ? 'Versions' : (tab ?? 'Overview');
}

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
  const [activeTab, setActiveTab] = useState<ResourceFileTab>(
    normalizeTaskDetailTab(route.params?.initialTab),
  );
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
  const scrollViewRef = useRef<ScrollView | null>(null);
  const versionsRef = useRef<ResourceFileMaterialVersion[]>([]);
  const initialDiscussionAppliedRef = useRef(false);
  const didScrollToInitialCommentRef = useRef(false);
  const didScrollToLatestDiscussionRef = useRef(false);
  const initialCommentLayoutYRef = useRef<number | null>(null);
  const initialCommentId = route.params?.initialCommentId;
  const versions = file?.materialVersions ?? [];
  const tasks = file?.tasks ?? [];
  const currentFileId = file?.id ?? null;
  const {
    errorMessage: materialVersionsErrorMessage,
    isLoading: isTaskMaterialsLoading,
    loadTaskMaterials,
    previewVersions,
    resetTaskMaterials,
    versionsByTaskId: materialVersionsByTaskId,
  } = useTaskMaterialVersions(versions);
  const focusedTask = selectedTaskId
    ? (tasks.find((task) => task.id === selectedTaskId) ?? null)
    : null;
  const focusedTaskVersions = selectedTaskId
    ? (materialVersionsByTaskId[selectedTaskId] ?? [])
    : [];
  const visibleVersions = selectedTaskId ? focusedTaskVersions : versions;

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
      const selectedTask =
        nextFile.tasks?.find((item) => item.id === taskId) ?? nextFile.tasks?.[0];
      setFile(nextFile);
      resetTaskMaterials();
      setFileDiscussionCommentCount(nextFile.comments?.length ?? 0);
      setSelectedTaskId(selectedTask?.id ?? taskId);
      setSelectedFrame(selectedTask?.frames[0] ?? null);
      setSelectedVersionId(null);
      setActiveTab(normalizeTaskDetailTab(route.params?.initialTab ?? 'Tasks'));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to load task.');
    } finally {
      setIsLoading(false);
    }
  }, [resetTaskMaterials, route.params?.initialTab, route.params?.taskId]);

  useEffect(() => {
    void loadTaskDetail();
  }, [loadTaskDetail]);

  useEffect(() => {
    versionsRef.current = previewVersions;
  }, [previewVersions]);

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

  const versionTabFallbackVersion =
    activeTab === 'Versions' ? visibleVersions[0] : previewVersions[0];
  const selectedVersion =
    previewVersions.find((version) => version.id === selectedVersionId) ??
    versionTabFallbackVersion;
  const previewImageUri = selectedVersion?.materials.imageUri ?? file?.previewImageUri;

  const focusFrameMaterial = useCallback((frame: ResourceTaskFrame) => {
    if (!frame.materialId) return;
    const hasMaterial = versionsRef.current.some((version) => version.id === frame.materialId);
    if (hasMaterial) {
      setSelectedVersionId(frame.materialId);
    }
  }, []);

  const handleSelectFrame = (frame: ResourceTaskFrame) => {
    setSelectedFrame((prev) => {
      if (prev?.id === frame.id) return null;
      focusFrameMaterial(frame);
      return frame;
    });
  };

  const handleSelectMaterialTask = useCallback(
    async (taskId: string) => {
      setSelectedTaskId(taskId);
      setSelectedFrame(null);
      setSelectedVersionId(null);

      const nextVersions = await loadTaskMaterials(taskId);
      setSelectedVersionId(nextVersions[0]?.id ?? null);
    },
    [loadTaskMaterials],
  );

  useEffect(() => {
    if (activeTab !== 'Versions' || !selectedTaskId) return;
    if (materialVersionsByTaskId[selectedTaskId]) return;

    void handleSelectMaterialTask(selectedTaskId);
  }, [activeTab, handleSelectMaterialTask, materialVersionsByTaskId, selectedTaskId]);

  const handleSelectTask = (task: ResourceFileTask | null) => {
    if (task === null) {
      setSelectedTaskId(null);
      setSelectedFrame(null);
      setSelectedVersionId(versions[0]?.id ?? null);
      return;
    }
    setSelectedTaskId(task.id);
    setSelectedFrame(task.frames[0] ?? null);
    setSelectedVersionId(null);
    setActiveTab('Tasks');
  };

  const handleSelectVersion = (version: ResourceFileMaterialVersion) => {
    setSelectedVersionId(version.id);
    if (version.taskId) {
      setSelectedTaskId(version.taskId);
    }
    setSelectedFrame(null);
    setActiveTab('Versions');
  };

  const addRealtimeDiscussionComment = useCallback(
    (comment: ApiComment, options: { updateFileCount?: boolean } = {}) => {
      const nextComment = mapComment(comment);

      setDiscussionComments((currentComments) => {
        if (currentComments.some((item) => item.id === nextComment.id)) {
          return currentComments;
        }

        if (options.updateFileCount) {
          setFileDiscussionCommentCount((count) => count + 1);
        }

        return [...currentComments, nextComment];
      });
    },
    [],
  );

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
        error instanceof Error ? error.message : 'Unable to load file comments.',
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
        error instanceof Error ? error.message : 'Unable to load task comments.',
      );
    } finally {
      setIsDiscussionCommentsLoading(false);
    }

    try {
      const nextFrames = await fetchTaskDiscussionFrames(taskId);
      setDiscussionFrames(nextFrames);
    } catch {
      setDiscussionFrames([]);
      setDiscussionFrameStatusMessage('');
    } finally {
      setIsDiscussionFramesLoading(false);
    }
  }, []);

  const loadFrameDiscussion = useCallback(async (frameId: string) => {
    setDiscussionScope('frame');
    setSelectedDiscussionFrameId(frameId);
    setSelectedFrame(null);
    setDiscussionErrorMessage('');
    setIsDiscussionCommentsLoading(true);

    try {
      const frameDetail = await fetchFrameDetail(frameId);
      focusFrameMaterial(frameDetail);
      setSelectedFrame(frameDetail);

      const nextComments = await fetchFrameDiscussionComments(frameId);
      setDiscussionComments(nextComments);
    } catch (error) {
      setDiscussionComments([]);
      setDiscussionErrorMessage(
        error instanceof Error ? error.message : 'Unable to load frame comments.',
      );
    } finally {
      setIsDiscussionCommentsLoading(false);
    }
  }, [focusFrameMaterial]);

  useEffect(() => {
    if (activeTab !== 'Discussion') return;

    if (!initialDiscussionAppliedRef.current) {
      initialDiscussionAppliedRef.current = true;

      if (
        (route.params?.initialDiscussionScope === 'task' ||
          !route.params?.initialDiscussionScope) &&
        route.params?.taskId
      ) {
        void loadDiscussionTasks();
        void loadTaskDiscussion(route.params.taskId);
        return;
      }

      if (route.params?.initialDiscussionScope === 'frame' && route.params.initialFrameId) {
        void loadDiscussionTasks();
        void loadFrameDiscussion(route.params.initialFrameId);
        return;
      }
    }

    void handleSelectFileComments();
  }, [
    activeTab,
    handleSelectFileComments,
    loadDiscussionTasks,
    loadFrameDiscussion,
    loadTaskDiscussion,
    route.params?.initialDiscussionScope,
    route.params?.initialFrameId,
    route.params?.taskId,
  ]);

  const scrollToInitialComment = useCallback(() => {
    if (didScrollToInitialCommentRef.current || !initialCommentId) return;

    const commentY = initialCommentLayoutYRef.current;
    if (commentY === null) return;

    didScrollToInitialCommentRef.current = true;
    requestAnimationFrame(() => {
      scrollViewRef.current?.scrollTo({ y: Math.max(commentY - 24, 0), animated: true });
    });
  }, [initialCommentId]);

  const handleCommentLayout = useCallback(
    (commentId: string, y: number) => {
      if (commentId !== initialCommentId) return;
      initialCommentLayoutYRef.current = y;
      scrollToInitialComment();
    },
    [initialCommentId, scrollToInitialComment],
  );

  useEffect(() => {
    if (!initialCommentId || isDiscussionCommentsLoading) return;
    if (!discussionComments.some((comment) => comment.id === initialCommentId)) return;

    scrollToInitialComment();
  }, [discussionComments, initialCommentId, isDiscussionCommentsLoading, scrollToInitialComment]);

  useEffect(() => {
    didScrollToLatestDiscussionRef.current = false;
  }, [activeTab, discussionScope, selectedDiscussionFrameId, selectedDiscussionTaskId]);

  useEffect(() => {
    if (initialCommentId) return;
    if (activeTab !== 'Discussion') return;
    if (isDiscussionCommentsLoading || discussionComments.length === 0) return;
    if (didScrollToLatestDiscussionRef.current) return;

    didScrollToLatestDiscussionRef.current = true;
    requestAnimationFrame(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    });
  }, [activeTab, discussionComments.length, initialCommentId, isDiscussionCommentsLoading]);

  useEffect(() => {
    if (activeTab !== 'Discussion') return undefined;

    if (discussionScope === 'file' && currentFileId) {
      return subscribeToComments('FILE', currentFileId, (comment) => {
        addRealtimeDiscussionComment(comment, { updateFileCount: true });
      });
    }

    if (discussionScope === 'task' && selectedDiscussionTaskId) {
      return subscribeToComments('TASK', selectedDiscussionTaskId, addRealtimeDiscussionComment);
    }

    if (discussionScope === 'frame' && selectedDiscussionFrameId) {
      return subscribeToComments('FRAME', selectedDiscussionFrameId, addRealtimeDiscussionComment);
    }

    return undefined;
  }, [
    activeTab,
    addRealtimeDiscussionComment,
    currentFileId,
    discussionScope,
    selectedDiscussionFrameId,
    selectedDiscussionTaskId,
  ]);

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

    throw new Error('Please select a task or frame before commenting.');
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
        <TaskDetailTopBar subtitle="Task" title="Detail" onBack={() => navigation.goBack()} />
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
      <TaskDetailTopBar subtitle="Task" title={file.name} onBack={() => navigation.goBack()} />

      <ScrollView
        ref={scrollViewRef}
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
          status={selectedVersion ? 'Version Preview' : 'File Preview'}
        />

        <ResourceFileTabBar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          tabs={TASK_DETAIL_TABS}
        />

        {activeTab === 'Overview' && <OverviewPanel description={description} file={file} />}

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
            frameCommentCount={
              discussionScope === 'frame' && selectedDiscussionFrameId
                ? discussionComments.length
                : undefined
            }
            frameOptions={discussionFrameOptions}
            frameStatusMessage={discussionFrameStatusMessage}
            highlightedCommentId={initialCommentId}
            isCommentsLoading={isDiscussionCommentsLoading}
            isFramesLoading={isDiscussionFramesLoading}
            isTasksLoading={isDiscussionTasksLoading}
            onCommentLayout={handleCommentLayout}
            onRetryComments={handleRetryDiscussionComments}
            onSelectFileComments={handleSelectFileComments}
            onSelectFrameComments={loadFrameDiscussion}
            onSelectTaskComments={loadTaskDiscussion}
            selectedFrameId={selectedDiscussionFrameId}
            selectedTaskId={selectedDiscussionTaskId}
            taskCommentCount={
              discussionScope === 'task' && selectedDiscussionTaskId
                ? discussionComments.length
                : undefined
            }
            taskOptions={discussionTaskOptions}
          />
        )}

        {activeTab === 'Versions' && (
          <VersionsPanel
            errorMessage={materialVersionsErrorMessage}
            focusedTask={focusedTask}
            isLoading={Boolean(selectedTaskId) && isTaskMaterialsLoading}
            selectedVersionId={selectedVersion?.id ?? null}
            versions={visibleVersions}
            onClearFocusedTask={() => {
              setSelectedTaskId(null);
              setSelectedFrame(null);
              setSelectedVersionId(versions[0]?.id ?? null);
            }}
            onRetry={() => {
              if (selectedTaskId) {
                void handleSelectMaterialTask(selectedTaskId);
                return;
              }
              void loadTaskDetail();
            }}
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
