import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import ApiStateView from '@/src/components/shared/ApiStateView';
import CommentBubble from '@/src/components/sub-component/CommentBubble';
import MaterialIcon from '@/src/components/shared/MaterialIcon';
import { Colors } from '@/src/constants/colors';
import { RootStackParamList } from '@/src/navigation/types';
import { ApiComment } from '@/src/services/apiTypes';
import {
  createApplicationComment,
  fetchApplication,
  fetchApplicationComments,
} from '@/src/services/applicationApi';
import { mapComment } from '@/src/services/mappers';
import { subscribeToComments } from '@/src/services/realtimeClient';
import { ApplicationItem } from '@/src/types/applications';
import { ResourceTaskComment } from '@/src/types/resources';

import {
  ApplicationMaterialRow,
  ApplicationStatusBadge,
  ApplicationTypeBadge,
} from '@/src/screens/applications/components';
import ApplicationTopBar from '@/src/screens/applications/components/ApplicationTopBar';
import { C } from '@/src/screens/taskDetail/components';
import {
  ResourceFileTab,
  ResourceFileTabBar,
} from '@/src/screens/resourceFile/components/ResourceFilePanels';

type ApplicationDetailScreenProps = NativeStackScreenProps<RootStackParamList, 'ApplicationDetail'>;

const APPLICATION_DETAIL_TABS: ResourceFileTab[] = ['Overview', 'Discussion', 'Materials'];
const INITIAL_COMMENT_COUNT = 5;
const COMMENT_BATCH_COUNT = 5;

function visibleCountForHighlight(comments: ResourceTaskComment[], highlightedCommentId?: string) {
  if (!highlightedCommentId) return INITIAL_COMMENT_COUNT;

  const highlightedIndex = comments.findIndex((comment) => comment.id === highlightedCommentId);
  if (highlightedIndex < 0) return INITIAL_COMMENT_COUNT;

  return Math.max(INITIAL_COMMENT_COUNT, comments.length - highlightedIndex);
}

function ApplicationOverview({ application }: { application: ApplicationItem }) {
  return (
    <View
      className="mt-6 rounded-2xl p-5"
      style={{
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.borderFaint,
      }}
    >
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1 gap-2">
          <ApplicationTypeBadge type={application.type} />
          <Text className="text-[24px] font-black" style={{ color: Colors.text }}>
            {application.title}
          </Text>
        </View>
        <ApplicationStatusBadge status={application.status} />
      </View>

      <Text className="mt-4 text-[14px] leading-6" style={{ color: Colors.textMuted }}>
        {application.description || 'No description.'}
      </Text>

      <View className="mt-5 gap-2">
        <View className="flex-row items-center gap-2">
          <MaterialIcon name="person" color={Colors.textFaint} size={16} />
          <Text className="text-[13px]" style={{ color: Colors.textMuted }}>
            Created by {application.createdBy}
          </Text>
        </View>
        <View className="flex-row items-center gap-2">
          <MaterialIcon name="calendar_today" color={Colors.textFaint} size={16} />
          <Text className="text-[13px]" style={{ color: Colors.textMuted }}>
            {application.createdAtLabel} - {application.updatedAtLabel}
          </Text>
        </View>
      </View>
    </View>
  );
}

function ApplicationMaterials({ application }: { application: ApplicationItem }) {
  return (
    <View className="mt-6 gap-3">
      <Text
        className="text-[12px] font-bold uppercase"
        style={{ color: Colors.textMuted, letterSpacing: 1 }}
      >
        Materials
      </Text>
      {application.materials.pages.length > 0 ? (
        application.materials.pages.map((material) => (
          <ApplicationMaterialRow key={material.id} material={material} />
        ))
      ) : (
        <View
          className="items-center rounded-xl p-6"
          style={{
            backgroundColor: Colors.surface,
            borderWidth: 1,
            borderColor: Colors.borderSubtle,
          }}
        >
          <MaterialIcon name="attach" color={Colors.textFaint} size={26} />
          <Text className="mt-3 text-[14px] font-bold" style={{ color: Colors.text }}>
            No material linked
          </Text>
        </View>
      )}
    </View>
  );
}

function ApplicationDiscussion({
  comments,
  errorMessage,
  highlightedCommentId,
  isLoading,
  onCommentLayout,
  onRetry,
}: {
  comments: ResourceTaskComment[];
  errorMessage: string;
  highlightedCommentId?: string;
  isLoading: boolean;
  onCommentLayout?: (commentId: string, y: number) => void;
  onRetry: () => void;
}) {
  const panelTopRef = useRef(0);
  const commentListTopRef = useRef(0);
  const commentThreadScrollRef = useRef<ScrollView | null>(null);
  const isLoadingOlderCommentsRef = useRef(false);
  const lastOlderLoadAtRef = useRef(0);
  const minimumVisibleCommentCount = visibleCountForHighlight(comments, highlightedCommentId);
  const [visibleCommentCount, setVisibleCommentCount] = useState(minimumVisibleCommentCount);

  useEffect(() => {
    setVisibleCommentCount(minimumVisibleCommentCount);
  }, [highlightedCommentId, minimumVisibleCommentCount]);

  useEffect(() => {
    setVisibleCommentCount((currentCount) => Math.max(currentCount, minimumVisibleCommentCount));
  }, [minimumVisibleCommentCount]);

  const visibleComments = useMemo(() => {
    const count = Math.min(comments.length, visibleCommentCount);
    return comments.slice(Math.max(0, comments.length - count));
  }, [comments, visibleCommentCount]);
  const hiddenCommentCount = Math.max(0, comments.length - visibleComments.length);
  const handleShowOlderComments = () => {
    isLoadingOlderCommentsRef.current = true;
    setVisibleCommentCount((currentCount) =>
      Math.min(comments.length, currentCount + COMMENT_BATCH_COUNT),
    );
  };
  const handleCommentThreadScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (hiddenCommentCount <= 0) return;
    if (event.nativeEvent.contentOffset.y > 8) return;

    const now = Date.now();
    if (now - lastOlderLoadAtRef.current < 300) return;
    lastOlderLoadAtRef.current = now;
    handleShowOlderComments();
  };

  if (isLoading) {
    return (
      <View
        className="mt-6 items-center rounded-xl px-5 py-8"
        style={{ backgroundColor: C.surface, borderWidth: 1, borderColor: C.border }}
      >
        <ActivityIndicator color={C.accent} size="small" />
        <Text className="mt-3 text-[13px] font-semibold" style={{ color: C.textMuted }}>
          Loading comments
        </Text>
      </View>
    );
  }

  if (errorMessage) {
    return (
      <View
        className="mt-6 items-center rounded-xl px-5 py-7"
        style={{ backgroundColor: C.surface, borderWidth: 1, borderColor: C.border }}
      >
        <Text className="text-center text-[14px] font-semibold" style={{ color: C.text }}>
          Unable to load comments
        </Text>
        <Text className="mt-2 text-center text-[12px] leading-5" style={{ color: C.textMuted }}>
          {errorMessage}
        </Text>
        <TouchableOpacity
          activeOpacity={0.75}
          className="mt-4 rounded-full px-4 py-2"
          onPress={onRetry}
          style={{ backgroundColor: C.surfaceHighest }}
        >
          <Text className="text-[12px] font-bold" style={{ color: C.text }}>
            Try again
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View
      className="mt-6 gap-3"
      onLayout={(event) => {
        panelTopRef.current = event.nativeEvent.layout.y;
      }}
    >
      <View className="flex-row items-center justify-between">
        <Text
          className="text-[12px] font-bold uppercase"
          style={{ color: C.textMuted, letterSpacing: 1 }}
        >
          Discussion
        </Text>
        <Text className="text-[12px] font-semibold" style={{ color: C.textMuted }}>
          {comments.length} comment{comments.length === 1 ? '' : 's'}
        </Text>
      </View>
      {comments.length > 0 ? (
        <ScrollView
          ref={commentThreadScrollRef}
          nestedScrollEnabled
          onContentSizeChange={() => {
            if (isLoadingOlderCommentsRef.current) {
              isLoadingOlderCommentsRef.current = false;
              return;
            }

            commentThreadScrollRef.current?.scrollToEnd({ animated: false });
          }}
          onScroll={handleCommentThreadScroll}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
          style={{ maxHeight: 420 }}
        >
          <View
            className="gap-2"
            onLayout={(event) => {
              commentListTopRef.current = event.nativeEvent.layout.y;
            }}
          >
            {hiddenCommentCount > 0 ? (
              <TouchableOpacity
                activeOpacity={0.75}
                accessibilityRole="button"
                className="mb-1 self-center rounded-full px-3 py-2"
                onPress={handleShowOlderComments}
                style={{
                  backgroundColor: C.surface,
                  borderColor: C.borderFaint,
                  borderWidth: 1,
                }}
              >
                <Text className="text-[12px] font-semibold" style={{ color: C.textMuted }}>
                  Pull up or tap to view {Math.min(hiddenCommentCount, COMMENT_BATCH_COUNT)} older
                  comments
                </Text>
              </TouchableOpacity>
            ) : null}

            {visibleComments.map((comment, index) => (
              <View
                key={`${comment.id}-${index}`}
                onLayout={(event) => {
                  onCommentLayout?.(
                    comment.id,
                    panelTopRef.current + commentListTopRef.current + event.nativeEvent.layout.y,
                  );
                }}
              >
                <CommentBubble
                  comment={comment}
                  isHighlighted={comment.id === highlightedCommentId}
                />
              </View>
            ))}
          </View>
        </ScrollView>
      ) : (
        <View
          className="items-center rounded-xl px-5 py-8"
          style={{ backgroundColor: C.surface, borderWidth: 1, borderColor: C.border }}
        >
          <Text className="text-[14px] font-semibold" style={{ color: C.textMuted }}>
            No discussion yet
          </Text>
        </View>
      )}
    </View>
  );
}

function ApplicationDiscussionComposer({
  onCreateComment,
}: {
  onCreateComment: (text: string) => Promise<void>;
}) {
  const [comment, setComment] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (isSubmitting || !comment.trim()) return;

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      await onCreateComment(comment);
      setComment('');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to send comment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View
      className="gap-2 rounded-2xl px-4 py-3"
      style={{
        backgroundColor: C.surface,
        borderWidth: 1,
        borderColor: C.borderFaint,
      }}
    >
      <View className="flex-row items-center gap-3">
        <View
          className="h-8 w-8 items-center justify-center rounded-full"
          style={{ backgroundColor: C.surfaceHighest }}
        >
          <Text className="text-[10px] font-bold" style={{ color: C.text }}>
            ME
          </Text>
        </View>
        <TextInput
          value={comment}
          onChangeText={setComment}
          placeholder="Discuss this application with the team..."
          placeholderTextColor={C.textFaint}
          className="flex-1 py-2 text-sm"
          editable={!isSubmitting}
          style={{ color: C.text, maxHeight: 96 }}
          multiline
        />
        <TouchableOpacity
          activeOpacity={0.75}
          disabled={isSubmitting || !comment.trim()}
          onPress={handleSubmit}
          className="h-9 w-9 items-center justify-center rounded-full"
          style={{
            backgroundColor: isSubmitting || !comment.trim() ? C.surfaceHighest : C.accent,
          }}
        >
          {isSubmitting ? (
            <ActivityIndicator color={C.text} size="small" />
          ) : (
            <MaterialIcon name="send" color={!comment.trim() ? C.textFaint : C.bg} size={18} />
          )}
        </TouchableOpacity>
      </View>
      {errorMessage ? (
        <Text className="text-[12px]" style={{ color: '#EF4444' }}>
          {errorMessage}
        </Text>
      ) : null}
    </View>
  );
}

export default function ApplicationDetailScreen({
  navigation,
  route,
}: ApplicationDetailScreenProps) {
  const [activeTab, setActiveTab] = useState<ResourceFileTab>(
    route.params.initialTab ?? 'Overview',
  );
  const [application, setApplication] = useState<ApplicationItem | null>(null);
  const [comments, setComments] = useState<ResourceTaskComment[]>([]);
  const [commentsErrorMessage, setCommentsErrorMessage] = useState('');
  const [isCommentsLoading, setIsCommentsLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const scrollViewRef = useRef<ScrollView | null>(null);
  const didScrollToInitialCommentRef = useRef(false);
  const didScrollToLatestDiscussionRef = useRef(false);
  const initialCommentLayoutYRef = useRef<number | null>(null);
  const initialCommentId = route.params.initialCommentId;

  const loadApplication = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const result = await fetchApplication(route.params.applicationId);
      setApplication(result);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to load application.');
    } finally {
      setIsLoading(false);
    }
  }, [route.params.applicationId]);

  useEffect(() => {
    void loadApplication();
  }, [loadApplication]);

  const addDiscussionComment = useCallback((comment: ApiComment) => {
    const nextComment = mapComment(comment);

    setComments((currentComments) => {
      if (currentComments.some((item) => item.id === nextComment.id)) {
        return currentComments;
      }

      return [...currentComments, nextComment];
    });
  }, []);

  const loadApplicationComments = useCallback(async () => {
    setCommentsErrorMessage('');
    setIsCommentsLoading(true);

    try {
      const nextComments = await fetchApplicationComments(route.params.applicationId);
      setComments(nextComments);
    } catch (error) {
      setComments([]);
      setCommentsErrorMessage(
        error instanceof Error ? error.message : 'Unable to load application comments.',
      );
    } finally {
      setIsCommentsLoading(false);
    }
  }, [route.params.applicationId]);

  useEffect(() => {
    if (activeTab === 'Discussion') {
      void loadApplicationComments();
    }
  }, [activeTab, loadApplicationComments]);

  useEffect(() => {
    if (activeTab !== 'Discussion') return undefined;

    return subscribeToComments('APPLICATION', route.params.applicationId, addDiscussionComment);
  }, [activeTab, addDiscussionComment, route.params.applicationId]);

  const handleCreateComment = async (text: string) => {
    const nextComment = await createApplicationComment({
      applicationId: route.params.applicationId,
      text,
    });
    setComments((currentComments) => {
      if (currentComments.some((item) => item.id === nextComment.id)) {
        return currentComments;
      }

      return [...currentComments, nextComment];
    });
  };

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
    if (!initialCommentId || isCommentsLoading) return;
    if (!comments.some((comment) => comment.id === initialCommentId)) return;

    scrollToInitialComment();
  }, [comments, initialCommentId, isCommentsLoading, scrollToInitialComment]);

  useEffect(() => {
    didScrollToLatestDiscussionRef.current = false;
  }, [activeTab]);

  useEffect(() => {
    if (initialCommentId) return;
    if (activeTab !== 'Discussion') return;
    if (isCommentsLoading || comments.length === 0) return;
    if (didScrollToLatestDiscussionRef.current) return;

    didScrollToLatestDiscussionRef.current = true;
    requestAnimationFrame(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    });
  }, [activeTab, comments.length, initialCommentId, isCommentsLoading]);

  const contentPaddingBottom = useMemo(() => (activeTab === 'Discussion' ? 148 : 40), [activeTab]);

  return (
    <View className="flex-1" style={{ backgroundColor: Colors.bg }}>
      <ApplicationTopBar
        onBack={() => navigation.goBack()}
        subtitle={`Project ${route.params.projectId}`}
        title="Application"
      />

      {isLoading ? (
        <ApiStateView type="loading" />
      ) : errorMessage || !application ? (
        <ApiStateView
          type="error"
          message={errorMessage || 'Application not found'}
          onRetry={loadApplication}
        />
      ) : (
        <ScrollView
          ref={scrollViewRef}
          className="flex-1"
          contentContainerStyle={{ padding: 16, paddingBottom: contentPaddingBottom }}
          showsVerticalScrollIndicator={false}
        >
          <ResourceFileTabBar
            activeTab={activeTab}
            onTabChange={setActiveTab}
            tabs={APPLICATION_DETAIL_TABS}
          />

          {activeTab === 'Overview' ? <ApplicationOverview application={application} /> : null}

          {activeTab === 'Discussion' ? (
            <ApplicationDiscussion
              comments={comments}
              errorMessage={commentsErrorMessage}
              highlightedCommentId={initialCommentId}
              isLoading={isCommentsLoading}
              onCommentLayout={handleCommentLayout}
              onRetry={loadApplicationComments}
            />
          ) : null}

          {activeTab === 'Materials' ? <ApplicationMaterials application={application} /> : null}
        </ScrollView>
      )}

      {!isLoading && !errorMessage && application && activeTab === 'Discussion' ? (
        <View
          className="absolute left-0 right-0 px-4"
          style={{
            bottom: 24,
          }}
        >
          <ApplicationDiscussionComposer onCreateComment={handleCreateComment} />
        </View>
      ) : null}
    </View>
  );
}
