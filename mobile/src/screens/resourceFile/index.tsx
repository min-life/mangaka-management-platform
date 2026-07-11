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
  fetchFolderBundle,
  fetchFrameDetail,
  fetchFrameDiscussionComments,
  fetchMaterialVersion,
  fetchResourceFileBundle,
  fetchTaskDiscussionComments,
  fetchTaskDiscussionFrames,
} from '@/src/services/resourceApi';
import { mapComment } from '@/src/services/mappers';
import { subscribeToComments } from '@/src/services/realtimeClient';

import { C, TaskDetailTopBar, TaskPreviewSection } from '@/src/screens/taskDetail/components';
import {
  MaterialsPanel,
  OverviewPanel,
  DiscussionComposer,
  DiscussionPanel,
  DiscussionScope,
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

export default function ResourceFileScreen({ navigation, route }: ResourceFileScreenProps) {
  const [activeTab, setActiveTab] = useState<ResourceFileTab>(
    route.params.initialTab ?? 'Overview',
  );
  const [file, setFile] = useState<ResourceFileNode | null>(null);
  const [parentName, setParentName] = useState('Resource');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
  const [materialDetailsById, setMaterialDetailsById] = useState<
    Record<string, ResourceFileMaterialVersion>
  >({});
  const [isMaterialDetailLoading, setIsMaterialDetailLoading] = useState(false);
  const [materialDetailError, setMaterialDetailError] = useState('');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
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
  const initialDiscussionAppliedRef = useRef(false);
  const didScrollToInitialCommentRef = useRef(false);
  const didScrollToLatestDiscussionRef = useRef(false);
  const initialCommentLayoutYRef = useRef<number | null>(null);
  const initialCommentId = route.params.initialCommentId;

  const loadFile = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const nextFile = await fetchResourceFileBundle(route.params.fileId);
      const parentFolderId = route.params.parentFolderId ?? nextFile.folderId;
      const parentBundle = parentFolderId
        ? await fetchFolderBundle(parentFolderId).catch(() => null)
        : null;
      setFile(nextFile);
      setMaterialDetailsById({});
      setMaterialDetailError('');
      setFileDiscussionCommentCount(nextFile.comments?.length ?? 0);
      setParentName(parentBundle?.folder.name ?? 'Resource');
      const initialTask = route.params.initialTaskId
        ? nextFile.tasks?.find((task) => task.id === route.params.initialTaskId)
        : undefined;
      const selectedTask = initialTask ?? nextFile.tasks?.[0] ?? null;

      setSelectedVersionId(
        route.params.initialMaterialVersionId ?? nextFile.materialVersions?.[0]?.id ?? null,
      );
      setSelectedTaskId(selectedTask?.id ?? null);
      setSelectedFrame(route.params.initialTaskId ? (selectedTask?.frames[0] ?? null) : null);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to load file.');
    } finally {
      setIsLoading(false);
    }
  }, [
    route.params.fileId,
    route.params.initialMaterialVersionId,
    route.params.initialTaskId,
    route.params.parentFolderId,
  ]);

  useEffect(() => {
    void loadFile();
  }, [loadFile]);

  const versions = file?.materialVersions ?? [];
  const tasks = file?.tasks ?? [];

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

  const selectedVersionSummary =
    versions.find((version) => version.id === selectedVersionId) ?? versions[0];
  const selectedVersionDetail = selectedVersionSummary
    ? materialDetailsById[selectedVersionSummary.id]
    : undefined;
  const selectedVersion = selectedVersionDetail ?? selectedVersionSummary;
  const previewImageUri = selectedVersion?.materials.imageUri ?? file?.previewImageUri;

  useEffect(() => {
    const versionId = selectedVersionSummary?.id;
    if (!versionId || selectedVersionDetail?.hasDetail) {
      setIsMaterialDetailLoading(false);
      return;
    }

    let isMounted = true;
    setIsMaterialDetailLoading(true);
    setMaterialDetailError('');

    fetchMaterialVersion(versionId)
      .then((detail) => {
        if (!isMounted) return;
        setMaterialDetailsById((prev) => ({ ...prev, [detail.id]: detail }));
      })
      .catch((error) => {
        if (!isMounted) return;
        setMaterialDetailError(
          error instanceof Error ? error.message : 'Unable to load material detail.',
        );
      })
      .finally(() => {
        if (isMounted) setIsMaterialDetailLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedVersionDetail?.hasDetail, selectedVersionSummary?.id]);

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
    setSelectedFrame(null);
    setActiveTab('Tasks');
  };

  const handleSelectVersion = (version: ResourceFileMaterialVersion) => {
    setSelectedVersionId(version.id);
    setSelectedFrame(null);
    setActiveTab('Materials');
  };

  const handleOpenCommentMaterial = useCallback(
    async (materialId: string) => {
      const localVersion = versions.find((version) => version.id === materialId);
      if (localVersion) {
        setSelectedVersionId(localVersion.id);
        setSelectedFrame(null);
        setActiveTab('Materials');
        return;
      }

      try {
        const material = await fetchMaterialVersion(materialId);
        if (!material.fileId) throw new Error('Material file not found.');

        navigation.navigate('ResourceFile', {
          fileId: material.fileId,
          initialMaterialVersionId: materialId,
          initialTab: 'Materials',
          projectId: route.params.projectId,
        });
      } catch (error) {
        console.warn('[ResourceFileScreen] Open comment material failed.', error);
        setDiscussionErrorMessage(
          error instanceof Error ? error.message : 'Unable to open this material.',
        );
      }
    },
    [navigation, route.params.projectId, versions],
  );

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
    setDiscussionErrorMessage('');
    setIsDiscussionCommentsLoading(true);

    try {
      const nextComments = await fetchFileDiscussionComments(route.params.fileId);
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
  }, [route.params.fileId]);

  const loadDiscussionTasks = useCallback(async () => {
    setIsDiscussionTasksLoading(true);

    try {
      const nextTasks = await fetchFileDiscussionTasks(route.params.fileId);
      setDiscussionTasks(nextTasks);
    } catch {
      setDiscussionTasks([]);
    } finally {
      setIsDiscussionTasksLoading(false);
    }
  }, [route.params.fileId]);

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
  }, []);

  useEffect(() => {
    if (activeTab !== 'Discussion') return;

    if (!initialDiscussionAppliedRef.current) {
      initialDiscussionAppliedRef.current = true;

      if (route.params.initialDiscussionScope === 'task' && route.params.initialTaskId) {
        void loadDiscussionTasks();
        void loadTaskDiscussion(route.params.initialTaskId);
        return;
      }

      if (route.params.initialDiscussionScope === 'frame' && route.params.initialFrameId) {
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
    route.params.initialDiscussionScope,
    route.params.initialFrameId,
    route.params.initialTaskId,
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

    if (discussionScope === 'file') {
      return subscribeToComments('FILE', route.params.fileId, (comment) => {
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
    discussionScope,
    route.params.fileId,
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
    if (discussionScope === 'file') {
      await createFileDiscussionComment({
        fileId: route.params.fileId,
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
        <TaskDetailTopBar subtitle="Resource" title="File" onBack={() => navigation.goBack()} />
        <ApiStateView type="loading" />
      </View>
    );
  }

  if (errorMessage || !file) {
    return (
      <View className="flex-1" style={{ backgroundColor: Colors.bg }}>
        <TaskDetailTopBar subtitle="Resource" title="File" onBack={() => navigation.goBack()} />
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
          status={selectedVersion ? 'Material Preview' : 'File Preview'}
        />

        <ResourceFileTabBar activeTab={activeTab} onTabChange={setActiveTab} />

        {activeTab === 'Overview' && (
          <OverviewPanel description={description} file={file} fileContent={file.content} />
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
            onOpenMaterialContext={handleOpenCommentMaterial}
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

        {activeTab === 'Materials' && (
          <MaterialsPanel
            detailError={materialDetailError}
            isSelectedVersionLoading={isMaterialDetailLoading}
            selectedVersion={selectedVersion ?? null}
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
