import React, { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import CommentBubble from '@/src/components/sub-component/CommentBubble';
import FrameListPanel from '@/src/components/sub-component/FrameListPanel';
import MaterialIcon from '@/src/components/shared/MaterialIcon';
import { Colors } from '@/src/constants/colors';
import {
  ResourceFileMaterialVersion,
  ResourceFileNode,
  ResourceFileTask,
  ResourceTaskComment,
  ResourceTaskFrame,
  ResourceTaskStatus,
} from '@/src/types/resources';

import { C } from '@/src/screens/taskDetail/components';
import MarkdownLite from './MarkdownLite';

export type ResourceFileTab = 'Overview' | 'Tasks' | 'Discussion' | 'Materials';
export type DiscussionScope = 'file' | 'task' | 'frame';

const FILE_TABS: ResourceFileTab[] = ['Overview', 'Tasks', 'Discussion', 'Materials'];
const INITIAL_COMMENT_COUNT = 5;
const COMMENT_BATCH_COUNT = 5;

const STATUS_META: Record<ResourceTaskStatus, { label: string; color: string }> = {
  PENDING: { label: 'Pending', color: Colors.statusPending },
  INPROGRESS: { label: 'In progress', color: Colors.statusProgress },
  REVIEW: { label: 'Review', color: Colors.statusReview },
  DONE: { label: 'Done', color: Colors.statusDone },
};

function formatDate(value?: string) {
  if (!value) return 'No date';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  }).format(date);
}

function visibleCountForHighlight(comments: ResourceTaskComment[], highlightedCommentId?: string) {
  if (!highlightedCommentId) return INITIAL_COMMENT_COUNT;

  const highlightedIndex = comments.findIndex((comment) => comment.id === highlightedCommentId);
  if (highlightedIndex < 0) return INITIAL_COMMENT_COUNT;

  return Math.max(INITIAL_COMMENT_COUNT, comments.length - highlightedIndex);
}

function StatusBadge({ status }: { status: ResourceTaskStatus }) {
  const meta = STATUS_META[status];

  return (
    <View className="rounded-full px-2.5 py-1" style={{ backgroundColor: `${meta.color}22` }}>
      <Text className="text-[11px] font-bold uppercase" style={{ color: meta.color }}>
        {meta.label}
      </Text>
    </View>
  );
}

function OverviewStatCard({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View
      className="flex-1 rounded-xl px-3 py-3"
      style={{ backgroundColor: Colors.surfaceContainer, minWidth: '30%' }}
    >
      <View className="mb-2 flex-row items-center gap-1.5">
        <MaterialIcon name={icon} color={C.accent} size={15} />
        <Text
          className="text-[10px] font-bold uppercase"
          numberOfLines={1}
          style={{ color: C.textMuted, letterSpacing: 0.6 }}
        >
          {label}
        </Text>
      </View>
      <Text className="text-[18px] font-black" numberOfLines={1} style={{ color: C.text }}>
        {value}
      </Text>
    </View>
  );
}

function OverviewInfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View className="flex-row items-center">
      <View
        className="h-9 w-9 items-center justify-center rounded-xl"
        style={{ backgroundColor: Colors.iconBg }}
      >
        <MaterialIcon name={icon} color={C.accent} size={18} />
      </View>
      <View className="ml-3 flex-1">
        <Text className="text-[10px] font-bold uppercase" style={{ color: C.textMuted }}>
          {label}
        </Text>
        <Text
          className="mt-0.5 text-[14px] font-semibold"
          style={{ color: C.text }}
          numberOfLines={1}
        >
          {value}
        </Text>
      </View>
    </View>
  );
}

function EmptyState({ title }: { title: string }) {
  return (
    <View
      className="items-center rounded-xl px-5 py-8"
      style={{ backgroundColor: C.surface, borderWidth: 1, borderColor: C.border }}
    >
      <Text className="text-[14px] font-semibold" style={{ color: C.textMuted }}>
        {title}
      </Text>
    </View>
  );
}

export function ResourceFileTabBar({
  activeTab,
  onTabChange,
  tabs = FILE_TABS,
}: {
  activeTab: ResourceFileTab;
  onTabChange: (tab: ResourceFileTab) => void;
  tabs?: ResourceFileTab[];
}) {
  return (
    <View className="mt-6 flex-row" style={{ borderBottomWidth: 1, borderBottomColor: C.border }}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab;

        return (
          <TouchableOpacity
            key={tab}
            activeOpacity={0.78}
            className="flex-1 items-center py-3"
            onPress={() => onTabChange(tab)}
            style={isActive ? { borderBottomWidth: 2, borderBottomColor: C.accent } : undefined}
          >
            <Text
              className="text-xs font-bold uppercase"
              style={{ color: isActive ? C.accent : C.textMuted }}
            >
              {tab}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export function OverviewPanel({
  description,
  file,
  fileContent,
}: {
  description: string;
  file?: ResourceFileNode;
  fileContent: string;
}) {
  const creatorName = file?.createdByName?.trim() || 'Unknown creator';
  const createdAtLabel = formatDate(file?.createdAt);
  const updatedAtLabel = formatDate(file?.updatedAt);
  const materialCount = file?.materialVersions?.length ?? 0;
  const taskCount = file?.tasks?.length ?? 0;
  const commentCount = file?.comments?.length ?? 0;
  const statusCounts = (file?.tasks ?? []).reduce<Record<ResourceTaskStatus, number>>(
    (counts, task) => {
      counts[task.status] += 1;
      return counts;
    },
    { DONE: 0, INPROGRESS: 0, PENDING: 0, REVIEW: 0 },
  );
  const hasTaskSummary = taskCount > 0;

  return (
    <View className="mt-6 gap-4">
      <View
        className="overflow-hidden rounded-xl"
        style={{ backgroundColor: C.surface, borderWidth: 1, borderColor: C.border }}
      >
        <View className="p-5">
          <View className="flex-row items-start justify-between gap-3">
            <View className="min-w-0 flex-1">
              <Text
                className="text-[10px] font-bold uppercase"
                style={{ color: C.textMuted, letterSpacing: 1 }}
              >
                Overview
              </Text>
              <Text
                className="mt-1 text-[21px] font-black"
                numberOfLines={2}
                style={{ color: C.text }}
              >
                {file?.name ?? 'Resource file'}
              </Text>
            </View>
            <View
              className="rounded-full px-3 py-1"
              style={{ backgroundColor: 'rgba(255,211,105,0.13)' }}
            >
              <Text className="text-[11px] font-bold" style={{ color: C.accent }}>
                {file?.language ?? 'File'}
              </Text>
            </View>
          </View>

          <Text className="mt-4 text-[15px] leading-6" style={{ color: C.text }}>
            {description}
          </Text>

          <View className="mt-5 flex-row gap-2">
            <OverviewStatCard icon="article" label="Versions" value={String(materialCount)} />
            <OverviewStatCard icon="checklist" label="Tasks" value={String(taskCount)} />
            <OverviewStatCard icon="comment" label="Comments" value={String(commentCount)} />
          </View>
        </View>

        {file ? (
          <View className="gap-4 border-t p-5" style={{ borderTopColor: C.borderFaint }}>
            <OverviewInfoRow icon="person" label="Created by" value={creatorName} />
            <OverviewInfoRow icon="calendar_today" label="Created" value={createdAtLabel} />
            <OverviewInfoRow icon="edit" label="Last edited" value={updatedAtLabel} />

            {hasTaskSummary ? (
              <View className="border-t pt-4" style={{ borderTopColor: C.borderFaint }}>
                <Text
                  className="mb-3 text-[10px] font-bold uppercase"
                  style={{ color: C.textMuted, letterSpacing: 1 }}
                >
                  Task status
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {(Object.keys(STATUS_META) as ResourceTaskStatus[]).map((status) => {
                    const meta = STATUS_META[status];
                    const count = statusCounts[status];

                    return (
                      <View
                        key={status}
                        className="flex-row items-center rounded-full px-2.5 py-1.5"
                        style={{ backgroundColor: `${meta.color}1F` }}
                      >
                        <View
                          className="mr-1.5 h-2 w-2 rounded-full"
                          style={{ backgroundColor: meta.color }}
                        />
                        <Text className="text-[11px] font-bold" style={{ color: meta.color }}>
                          {meta.label} {count}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            ) : null}
          </View>
        ) : null}
      </View>

      <View
        className="overflow-hidden rounded-xl"
        style={{ backgroundColor: C.surface, borderWidth: 1, borderColor: C.border }}
      >
        <MarkdownLite content={fileContent} />
      </View>
    </View>
  );
}

function FileCommentLabel({
  count,
  isActive,
  onPress,
}: {
  count: number;
  isActive: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.78}
      className="h-11 flex-row items-center justify-between gap-1.5 rounded-xl px-2.5"
      onPress={onPress}
      style={{
        backgroundColor: isActive ? 'rgba(255,211,105,0.14)' : C.surface,
        borderWidth: 1,
        borderColor: isActive ? 'rgba(255,211,105,0.36)' : C.borderFaint,
        minWidth: 0,
        width: '100%',
      }}
    >
      <View className="min-w-0 flex-1 flex-row items-center gap-1.5">
        <MaterialIcon name="article" color={isActive ? C.accent : C.textMuted} size={15} />
        <Text
          className="min-w-0 flex-1 text-[12px] font-bold"
          numberOfLines={1}
          style={{ color: isActive ? C.accent : C.text }}
        >
          File
        </Text>
      </View>
      <View
        className="items-center rounded-full px-1 py-0.5"
        style={{ backgroundColor: 'rgba(255,211,105,0.18)', minWidth: 18 }}
      >
        <Text className="text-[10px] font-bold" style={{ color: C.accent }}>
          {count}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

interface CommentSelectOption {
  id: string;
  label: string;
  description?: string;
}

function CommentComboBox({
  count,
  disabled = false,
  emptyLabel,
  icon,
  isActive,
  isLoading = false,
  isOpen,
  label,
  onOpenChange,
  onSelect,
  options,
  selectedId,
}: {
  count?: number;
  disabled?: boolean;
  emptyLabel: string;
  icon: string;
  isActive: boolean;
  isLoading?: boolean;
  isOpen: boolean;
  label: string;
  onOpenChange: (isOpen: boolean) => void;
  onSelect: (option: CommentSelectOption) => void;
  options: CommentSelectOption[];
  selectedId: string | null;
}) {
  const displayLabel = label;
  const isDisabled = disabled || isLoading;

  return (
    <View style={{ position: 'relative', width: '100%', zIndex: isOpen ? 40 : 1 }}>
      <TouchableOpacity
        activeOpacity={0.78}
        accessibilityRole="button"
        accessibilityState={{ disabled: isDisabled, expanded: isOpen, selected: isActive }}
        className="h-11 flex-row items-center justify-between gap-1.5 rounded-xl px-2.5"
        disabled={isDisabled}
        onPress={() => onOpenChange(!isOpen)}
        style={{
          backgroundColor: isActive ? 'rgba(255,211,105,0.14)' : C.surface,
          borderWidth: 1,
          borderColor: isActive ? 'rgba(255,211,105,0.36)' : C.borderFaint,
          opacity: disabled ? 0.48 : 1,
        }}
      >
        <View className="min-w-0 flex-1 flex-row items-center gap-1.5">
          <MaterialIcon name={icon} color={isActive ? C.accent : C.textMuted} size={15} />
          <Text
            className="min-w-0 flex-1 text-[12px] font-semibold"
            numberOfLines={1}
            style={{ color: isActive ? C.accent : C.text }}
          >
            {isLoading ? 'Loading...' : displayLabel}
          </Text>
        </View>
        {count !== undefined ? (
          <View
            className="items-center rounded-full px-1 py-0.5"
            style={{ backgroundColor: 'rgba(255,211,105,0.18)', minWidth: 18 }}
          >
            <Text className="text-[10px] font-bold" style={{ color: C.accent }}>
              {count}
            </Text>
          </View>
        ) : null}
        <MaterialIcon name={isOpen ? 'expand_less' : 'expand_more'} color={C.textMuted} size={16} />
      </TouchableOpacity>

      <Modal
        animationType="fade"
        onRequestClose={() => onOpenChange(false)}
        transparent
        visible={isOpen}
      >
        <View
          className="flex-1 justify-end px-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.34)', paddingBottom: 92 }}
        >
          <Pressable
            accessibilityRole="button"
            onPress={() => onOpenChange(false)}
            style={{ bottom: 0, left: 0, position: 'absolute', right: 0, top: 0 }}
          />
          <View
            className="overflow-hidden rounded-2xl"
            style={{
              backgroundColor: C.surface,
              borderWidth: 1,
              borderColor: C.border,
              elevation: 16,
              maxHeight: 420,
            }}
          >
            <View
              className="flex-row items-center justify-between px-4 py-3"
              style={{ borderBottomWidth: 1, borderBottomColor: C.borderFaint }}
            >
              <View className="min-w-0 flex-1 flex-row items-center gap-2">
                <MaterialIcon name={icon} color={C.accent} size={18} />
                <Text
                  className="min-w-0 flex-1 text-[14px] font-bold"
                  numberOfLines={1}
                  style={{ color: C.text }}
                >
                  {label}
                </Text>
              </View>
              <TouchableOpacity
                activeOpacity={0.72}
                className="h-8 w-8 items-center justify-center rounded-full"
                onPress={() => onOpenChange(false)}
                style={{ backgroundColor: Colors.iconBg }}
              >
                <MaterialIcon name="close" color={C.textMuted} size={18} />
              </TouchableOpacity>
            </View>

            {options.length === 0 ? (
              <View className="px-4 py-5">
                <Text className="text-[13px]" style={{ color: C.textMuted }}>
                  {emptyLabel}
                </Text>
              </View>
            ) : (
              <ScrollView
                bounces={false}
                keyboardShouldPersistTaps="handled"
                nestedScrollEnabled
                persistentScrollbar
                showsVerticalScrollIndicator
                style={{ maxHeight: 360 }}
              >
                {options.map((option, index) => {
                  const isSelected = option.id === selectedId;

                  return (
                    <TouchableOpacity
                      key={option.id}
                      activeOpacity={0.72}
                      accessibilityRole="button"
                      accessibilityState={{ selected: isSelected }}
                      className="flex-row items-center gap-3 px-4 py-3.5"
                      onPress={() => {
                        onSelect(option);
                        onOpenChange(false);
                      }}
                      style={{
                        backgroundColor: isSelected ? 'rgba(255,211,105,0.1)' : 'transparent',
                        borderBottomWidth: index === options.length - 1 ? 0 : 1,
                        borderBottomColor: C.borderFaint,
                      }}
                    >
                      <View className="flex-1">
                        <Text
                          className="text-[13px] font-semibold"
                          numberOfLines={1}
                          style={{ color: isSelected ? C.accent : C.text }}
                        >
                          {option.label}
                        </Text>
                        {option.description ? (
                          <Text
                            className="mt-1 text-[11px]"
                            numberOfLines={1}
                            style={{ color: C.textMuted }}
                          >
                            {option.description}
                          </Text>
                        ) : null}
                      </View>
                      {isSelected ? <MaterialIcon name="check" color={C.accent} size={18} /> : null}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

function FilterSlot({ children }: { children: React.ReactNode }) {
  return <View style={{ flexBasis: 0, flexGrow: 1, flexShrink: 1, minWidth: 0 }}>{children}</View>;
}

function DiscussionScopeControls({
  activeScope,
  commentCount,
  frameCommentCount,
  frameOptions,
  isFramesLoading,
  isTasksLoading,
  onSelectFile,
  onSelectFrame,
  onSelectTask,
  selectedFrameId,
  selectedTaskId,
  taskCommentCount,
  taskOptions,
}: {
  activeScope: DiscussionScope;
  commentCount: number;
  frameCommentCount?: number;
  frameOptions: CommentSelectOption[];
  isFramesLoading: boolean;
  isTasksLoading: boolean;
  onSelectFile: () => void;
  onSelectFrame: (frameId: string) => void;
  onSelectTask: (taskId: string) => void;
  selectedFrameId: string | null;
  selectedTaskId: string | null;
  taskCommentCount?: number;
  taskOptions: CommentSelectOption[];
}) {
  const [openMenu, setOpenMenu] = useState<'task' | 'frame' | null>(null);

  return (
    <View className="flex-row gap-2" style={{ zIndex: openMenu ? 40 : 1 }}>
      <FilterSlot>
        <FileCommentLabel
          count={commentCount}
          isActive={activeScope === 'file'}
          onPress={onSelectFile}
        />
      </FilterSlot>
      <FilterSlot>
        <CommentComboBox
          count={taskCommentCount}
          emptyLabel="No tasks found"
          icon="checklist"
          isActive={activeScope === 'task'}
          isLoading={isTasksLoading}
          isOpen={openMenu === 'task'}
          label="Review"
          onOpenChange={(isOpen) => setOpenMenu(isOpen ? 'task' : null)}
          onSelect={(option) => onSelectTask(option.id)}
          options={taskOptions}
          selectedId={selectedTaskId}
        />
      </FilterSlot>
      <FilterSlot>
        <CommentComboBox
          count={frameCommentCount}
          disabled={!selectedTaskId}
          emptyLabel={selectedTaskId ? 'No frames found' : 'Select a task first'}
          icon="frame_person"
          isActive={activeScope === 'frame'}
          isLoading={isFramesLoading}
          isOpen={openMenu === 'frame'}
          label="Frame"
          onOpenChange={(isOpen) => setOpenMenu(isOpen ? 'frame' : null)}
          onSelect={(option) => onSelectFrame(option.id)}
          options={frameOptions}
          selectedId={selectedFrameId}
        />
      </FilterSlot>
    </View>
  );
}

export function DiscussionPanel({
  activeScope,
  comments,
  errorMessage: commentsErrorMessage,
  fileCommentCount,
  frameCommentCount,
  frameOptions,
  frameStatusMessage,
  highlightedCommentId,
  isCommentsLoading,
  isFramesLoading,
  isTasksLoading,
  onCommentLayout,
  onOpenMaterialContext,
  onRetryComments,
  onSelectFileComments,
  onSelectFrameComments,
  onSelectTaskComments,
  selectedFrameId,
  selectedTaskId,
  taskCommentCount,
  taskOptions,
}: {
  activeScope: DiscussionScope;
  comments: ResourceTaskComment[];
  errorMessage?: string;
  fileCommentCount: number;
  frameCommentCount?: number;
  frameOptions: CommentSelectOption[];
  frameStatusMessage?: string;
  highlightedCommentId?: string;
  isCommentsLoading: boolean;
  isFramesLoading: boolean;
  isTasksLoading: boolean;
  onCommentLayout?: (commentId: string, y: number) => void;
  onOpenMaterialContext?: (materialId: string) => void;
  onRetryComments: () => void;
  onSelectFileComments: () => void;
  onSelectFrameComments: (frameId: string) => void;
  onSelectTaskComments: (taskId: string) => void;
  selectedFrameId: string | null;
  selectedTaskId: string | null;
  taskCommentCount?: number;
  taskOptions: CommentSelectOption[];
}) {
  const panelTopRef = React.useRef(0);
  const commentListTopRef = React.useRef(0);
  const commentThreadScrollRef = React.useRef<ScrollView | null>(null);
  const isLoadingOlderCommentsRef = React.useRef(false);
  const lastOlderLoadAtRef = React.useRef(0);
  const resetKey = `${activeScope}:${selectedTaskId ?? ''}:${selectedFrameId ?? ''}:${
    highlightedCommentId ?? ''
  }`;
  const minimumVisibleCommentCount = visibleCountForHighlight(comments, highlightedCommentId);
  const [visibleCommentCount, setVisibleCommentCount] = React.useState(minimumVisibleCommentCount);

  React.useEffect(() => {
    setVisibleCommentCount(minimumVisibleCommentCount);
  }, [minimumVisibleCommentCount, resetKey]);

  React.useEffect(() => {
    setVisibleCommentCount((currentCount) => Math.max(currentCount, minimumVisibleCommentCount));
  }, [minimumVisibleCommentCount]);

  const visibleComments = React.useMemo(() => {
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

  return (
    <View
      className="mt-6 gap-4"
      onLayout={(event) => {
        panelTopRef.current = event.nativeEvent.layout.y;
      }}
    >
      <DiscussionScopeControls
        activeScope={activeScope}
        commentCount={fileCommentCount}
        frameCommentCount={frameCommentCount}
        frameOptions={frameOptions}
        isFramesLoading={isFramesLoading}
        isTasksLoading={isTasksLoading}
        onSelectFile={onSelectFileComments}
        onSelectFrame={onSelectFrameComments}
        onSelectTask={onSelectTaskComments}
        selectedFrameId={selectedFrameId}
        selectedTaskId={selectedTaskId}
        taskCommentCount={taskCommentCount}
        taskOptions={taskOptions}
      />

      {frameStatusMessage ? (
        <View
          className="flex-row items-center gap-2 rounded-xl px-3 py-2"
          style={{
            backgroundColor: 'rgba(255,184,77,0.1)',
            borderWidth: 1,
            borderColor: 'rgba(255,184,77,0.2)',
          }}
        >
          <MaterialIcon name="warning" color={Colors.statusReview} size={15} />
          <Text className="flex-1 text-[12px]" style={{ color: Colors.statusReview }}>
            {frameStatusMessage}
          </Text>
        </View>
      ) : null}

      {isCommentsLoading ? (
        <View
          className="items-center rounded-xl px-5 py-8"
          style={{ backgroundColor: C.surface, borderWidth: 1, borderColor: C.border }}
        >
          <ActivityIndicator color={C.accent} size="small" />
          <Text className="mt-3 text-[13px] font-semibold" style={{ color: C.textMuted }}>
            Loading comments
          </Text>
        </View>
      ) : commentsErrorMessage ? (
        <View
          className="items-center rounded-xl px-5 py-7"
          style={{ backgroundColor: C.surface, borderWidth: 1, borderColor: C.border }}
        >
          <Text className="text-center text-[14px] font-semibold" style={{ color: C.text }}>
            Unable to load comments
          </Text>
          <Text className="mt-2 text-center text-[12px] leading-5" style={{ color: C.textMuted }}>
            {commentsErrorMessage}
          </Text>
          <TouchableOpacity
            activeOpacity={0.75}
            className="mt-4 rounded-full px-4 py-2"
            onPress={onRetryComments}
            style={{ backgroundColor: C.surfaceHighest }}
          >
            <Text className="text-[12px] font-bold" style={{ color: C.text }}>
              Try again
            </Text>
          </TouchableOpacity>
        </View>
      ) : comments.length > 0 ? (
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

            {visibleComments.map((item, index) => (
              <View
                key={`${item.id}-${index}`}
                onLayout={(event) => {
                  onCommentLayout?.(
                    item.id,
                    panelTopRef.current + commentListTopRef.current + event.nativeEvent.layout.y,
                  );
                }}
              >
                <CommentBubble
                  comment={item}
                  isHighlighted={item.id === highlightedCommentId}
                  onPressFrameContext={onSelectFrameComments}
                  onPressMaterialContext={onOpenMaterialContext}
                />
              </View>
            ))}
          </View>
        </ScrollView>
      ) : (
        <EmptyState title="No discussion yet" />
      )}
    </View>
  );
}

export function DiscussionComposer({
  activeScope,
  onCreateComment,
}: {
  activeScope: DiscussionScope;
  onCreateComment: (text: string) => Promise<void>;
}) {
  const [comment, setComment] = useState('');
  const [submitErrorMessage, setSubmitErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputPlaceholder =
    activeScope === 'file'
      ? 'Discuss this file with the team...'
      : activeScope === 'task'
        ? 'Discuss this task with the team...'
        : 'Comment on this frame...';

  const handleSubmit = async () => {
    if (isSubmitting || !comment.trim()) return;

    setIsSubmitting(true);
    setSubmitErrorMessage('');

    try {
      await onCreateComment(comment);
      setComment('');
    } catch (error) {
      setSubmitErrorMessage(error instanceof Error ? error.message : 'Unable to send comment.');
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
          placeholder={inputPlaceholder}
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
      {submitErrorMessage ? (
        <Text className="text-[12px]" style={{ color: '#EF4444' }}>
          {submitErrorMessage}
        </Text>
      ) : null}
    </View>
  );
}

function TaskRow({
  task,
  isSelected,
  onPress,
}: {
  task: ResourceFileTask;
  isSelected: boolean;
  onPress?: () => void;
}) {
  const content = (
    <>
      <View className="flex-row items-start gap-3">
        <View
          className="h-10 w-10 items-center justify-center rounded-lg"
          style={{ backgroundColor: isSelected ? 'rgba(255,211,105,0.16)' : Colors.iconBg }}
        >
          <MaterialIcon
            name="checklist"
            color={isSelected ? C.accent : Colors.textMuted}
            size={20}
          />
        </View>

        <View className="flex-1 gap-2">
          <View className="flex-row items-start justify-between gap-3">
            <Text className="flex-1 text-[15px] font-bold" style={{ color: C.text }}>
              {task.title}
            </Text>
            <StatusBadge status={task.status} />
          </View>

          {task.description ? (
            <Text
              numberOfLines={2}
              className="text-[13px] leading-5"
              style={{ color: C.textMuted }}
            >
              {task.description}
            </Text>
          ) : null}

          <View className="flex-row flex-wrap gap-x-4 gap-y-2">
            <View className="flex-row items-center gap-1.5">
              <MaterialIcon name="person" color={Colors.textFaint} size={14} />
              <Text className="text-[12px]" style={{ color: C.textMuted }}>
                {task.assignedByName ?? task.createdByName}
              </Text>
            </View>
            <View className="flex-row items-center gap-1.5">
              <MaterialIcon name="calendar_today" color={Colors.textFaint} size={14} />
              <Text className="text-[12px]" style={{ color: C.textMuted }}>
                {formatDate(task.deadline)}
              </Text>
            </View>
            <View className="flex-row items-center gap-1.5">
              <MaterialIcon name="frame_person" color={Colors.textFaint} size={14} />
              <Text className="text-[12px]" style={{ color: C.textMuted }}>
                {task.frames.length} frames
              </Text>
            </View>
          </View>
        </View>
      </View>
    </>
  );
  const containerStyle = {
    backgroundColor: isSelected ? 'rgba(255,211,105,0.12)' : C.surface,
    borderWidth: 1,
    borderColor: isSelected ? C.accent : C.border,
  };

  if (!onPress) {
    return (
      <View className="rounded-xl p-4" style={containerStyle}>
        {content}
      </View>
    );
  }

  return (
    <TouchableOpacity
      activeOpacity={0.78}
      onPress={onPress}
      className="rounded-xl p-4"
      style={containerStyle}
    >
      {content}
    </TouchableOpacity>
  );
}

function TaskDiscussion({
  onCreateComment,
  selectedFrame,
  task,
  onSelectFrame,
}: {
  onCreateComment: (params: {
    frameId?: string | null;
    taskId: string;
    text: string;
  }) => Promise<void>;
  selectedFrame: ResourceTaskFrame | null;
  task: ResourceFileTask;
  onSelectFrame: (frame: ResourceTaskFrame) => void;
}) {
  const [comment, setComment] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const scopedComments = selectedFrame
    ? task.comments.filter((item) => item.frameId === selectedFrame.id)
    : task.comments;
  const [visibleCommentCount, setVisibleCommentCount] = useState(INITIAL_COMMENT_COUNT);
  const visibleComments = scopedComments.slice(
    Math.max(0, scopedComments.length - visibleCommentCount),
  );
  const hiddenCommentCount = Math.max(0, scopedComments.length - visibleComments.length);

  React.useEffect(() => {
    setVisibleCommentCount(INITIAL_COMMENT_COUNT);
  }, [selectedFrame?.id, task.id]);

  const handleSubmit = async () => {
    if (isSubmitting || !comment.trim()) return;

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      await onCreateComment({
        frameId: selectedFrame?.id ?? null,
        taskId: task.id,
        text: comment,
      });
      setComment('');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to send comment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View
      className="gap-4 rounded-xl p-4"
      style={{ backgroundColor: 'rgba(255,255,255,0.035)', borderWidth: 1, borderColor: C.border }}
    >
      <View className="flex-row items-center justify-between">
        <Text className="text-[12px] font-bold uppercase" style={{ color: C.textMuted }}>
          Frames
        </Text>
        <Text className="text-[12px]" style={{ color: C.textFaint }}>
          Tap a frame to focus
        </Text>
      </View>

      <FrameListPanel
        comments={task.comments}
        frames={task.frames}
        selectedFrameId={selectedFrame?.id ?? null}
        onSelectFrame={(frame) => {
          const resourceFrame = task.frames.find((item) => item.id === frame.id);
          if (resourceFrame) {
            onSelectFrame(resourceFrame);
          }
        }}
      />

      <View className="gap-3">
        <View className="flex-row items-center gap-2">
          <MaterialIcon name="comment" color={C.accent} size={18} />
          <Text className="text-[13px] font-bold uppercase" style={{ color: C.text }}>
            Discussion
          </Text>
        </View>

        {visibleComments.length > 0 ? (
          <View className="gap-3">
            {hiddenCommentCount > 0 ? (
              <TouchableOpacity
                activeOpacity={0.75}
                accessibilityRole="button"
                className="self-center rounded-full px-3 py-2"
                onPress={() =>
                  setVisibleCommentCount((currentCount) =>
                    Math.min(scopedComments.length, currentCount + COMMENT_BATCH_COUNT),
                  )
                }
                style={{
                  backgroundColor: C.surface,
                  borderColor: C.borderFaint,
                  borderWidth: 1,
                }}
              >
                <Text className="text-[12px] font-semibold" style={{ color: C.textMuted }}>
                  View {Math.min(hiddenCommentCount, COMMENT_BATCH_COUNT)} older comments
                </Text>
              </TouchableOpacity>
            ) : null}
            {visibleComments.map((item, index) => (
              <CommentBubble key={`${item.id}-${index}`} comment={item} />
            ))}
          </View>
        ) : (
          <EmptyState title="No discussion yet" />
        )}

        <View
          className="gap-2 rounded-xl px-4 py-3"
          style={{ backgroundColor: C.surface, borderWidth: 1, borderColor: C.borderFaint }}
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
              placeholder={
                selectedFrame
                  ? `Comment on "${selectedFrame.name}"...`
                  : 'Discuss this task with the team...'
              }
              placeholderTextColor={C.textFaint}
              className="flex-1 py-2 text-sm"
              editable={!isSubmitting}
              style={{ color: C.text }}
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
      </View>
    </View>
  );
}

function TaskSection({
  onCreateComment,
  onSelectFrame,
  onSelectTask,
  selectedFrame,
  selectedTaskId,
  tasks,
  title,
}: {
  onCreateComment: (params: {
    frameId?: string | null;
    taskId: string;
    text: string;
  }) => Promise<void>;
  onSelectFrame: (frame: ResourceTaskFrame) => void;
  onSelectTask: (task: ResourceFileTask) => void;
  selectedFrame: ResourceTaskFrame | null;
  selectedTaskId: string | null;
  tasks: ResourceFileTask[];
  title: string;
}) {
  return (
    <View className="gap-3">
      <Text
        className="text-[11px] font-bold uppercase"
        style={{ color: C.textMuted, letterSpacing: 1.1 }}
      >
        {title}
      </Text>

      {tasks.length === 0 ? (
        <EmptyState title={`No ${title.toLowerCase()} tasks`} />
      ) : (
        tasks.map((task) => {
          const isSelected = task.id === selectedTaskId;

          return (
            <View key={task.id} className="gap-3">
              <TaskRow task={task} isSelected={isSelected} onPress={() => onSelectTask(task)} />
              {isSelected ? (
                <TaskDiscussion
                  onCreateComment={onCreateComment}
                  selectedFrame={selectedFrame}
                  task={task}
                  onSelectFrame={onSelectFrame}
                />
              ) : null}
            </View>
          );
        })
      )}
    </View>
  );
}

type TaskStatusFilter = 'ALL' | ResourceTaskStatus;

const TASK_STATUS_FILTER_OPTIONS: Array<{ label: string; value: TaskStatusFilter }> = [
  { label: 'All status', value: 'ALL' },
  { label: STATUS_META.PENDING.label, value: 'PENDING' },
  { label: STATUS_META.INPROGRESS.label, value: 'INPROGRESS' },
  { label: STATUS_META.REVIEW.label, value: 'REVIEW' },
  { label: STATUS_META.DONE.label, value: 'DONE' },
];

function TaskStatusFilterButton({
  isOpen,
  onChange,
  onOpenChange,
  value,
}: {
  isOpen: boolean;
  onChange: (value: TaskStatusFilter) => void;
  onOpenChange: (isOpen: boolean) => void;
  value: TaskStatusFilter;
}) {
  const activeMeta = value === 'ALL' ? null : STATUS_META[value];

  return (
    <View style={{ position: 'relative', zIndex: isOpen ? 40 : 1 }}>
      <TouchableOpacity
        activeOpacity={0.78}
        accessibilityRole="button"
        accessibilityState={{ expanded: isOpen }}
        className="h-11 w-11 items-center justify-center rounded-xl"
        onPress={() => onOpenChange(!isOpen)}
        style={{
          backgroundColor: activeMeta ? 'rgba(255,211,105,0.14)' : C.surface,
          borderColor: activeMeta ? 'rgba(255,211,105,0.36)' : C.borderFaint,
          borderWidth: 1,
        }}
      >
        <MaterialIcon name="filter_list" color={activeMeta ? C.accent : C.textMuted} size={20} />
        {activeMeta ? (
          <View
            className="absolute right-2 top-2 h-2 w-2 rounded-full"
            style={{ backgroundColor: activeMeta.color }}
          />
        ) : null}
      </TouchableOpacity>

      {isOpen ? (
        <View
          className="absolute right-0 rounded-xl p-2"
          style={{
            backgroundColor: C.surface,
            borderColor: C.border,
            borderWidth: 1,
            top: 50,
            width: 178,
            zIndex: 50,
          }}
        >
          {TASK_STATUS_FILTER_OPTIONS.map((option) => {
            const isSelected = option.value === value;
            const optionMeta = option.value === 'ALL' ? null : STATUS_META[option.value];

            return (
              <TouchableOpacity
                key={option.value}
                activeOpacity={0.78}
                className="flex-row items-center justify-between rounded-lg px-3 py-2.5"
                onPress={() => {
                  onChange(option.value);
                  onOpenChange(false);
                }}
                style={{
                  backgroundColor: isSelected ? 'rgba(255,211,105,0.12)' : 'transparent',
                }}
              >
                <View className="min-w-0 flex-1 flex-row items-center gap-2">
                  <View
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: optionMeta?.color ?? C.textFaint }}
                  />
                  <Text
                    className="min-w-0 flex-1 text-[13px] font-semibold"
                    numberOfLines={1}
                    style={{ color: isSelected ? C.accent : C.text }}
                  >
                    {option.label}
                  </Text>
                </View>
                {isSelected ? <MaterialIcon name="check" color={C.accent} size={16} /> : null}
              </TouchableOpacity>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

export function TasksPanel({
  selectedTaskId,
  tasks,
}: {
  onCreateComment?: (params: {
    frameId?: string | null;
    taskId: string;
    text: string;
  }) => Promise<void>;
  onSelectFrame: (frame: ResourceTaskFrame) => void;
  onSelectTask: (task: ResourceFileTask | null) => void;
  selectedFrame: ResourceTaskFrame | null;
  selectedTaskId: string | null;
  showTaskDiscussion?: boolean;
  tasks: ResourceFileTask[];
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<TaskStatusFilter>('ALL');
  const [isStatusFilterOpen, setIsStatusFilterOpen] = useState(false);
  const normalizedSearchQuery = searchQuery.trim().toLowerCase();
  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      normalizedSearchQuery.length === 0 ||
      task.title.toLowerCase().includes(normalizedSearchQuery);
    const matchesStatus = statusFilter === 'ALL' || task.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <View className="mt-6 gap-4" style={{ zIndex: isStatusFilterOpen ? 30 : 1 }}>
      <View className="flex-row items-center gap-2" style={{ zIndex: isStatusFilterOpen ? 40 : 1 }}>
        <View
          className="h-11 flex-1 flex-row items-center rounded-xl px-3"
          style={{
            backgroundColor: C.surface,
            borderColor: C.borderFaint,
            borderWidth: 1,
          }}
        >
          <MaterialIcon name="search" color={C.textFaint} size={18} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search tasks"
            placeholderTextColor={C.textFaint}
            className="ml-2 flex-1 py-0 text-[14px]"
            style={{ color: C.text }}
          />
          {searchQuery ? (
            <TouchableOpacity
              activeOpacity={0.78}
              accessibilityRole="button"
              className="h-7 w-7 items-center justify-center rounded-full"
              onPress={() => setSearchQuery('')}
              style={{ backgroundColor: Colors.iconBg }}
            >
              <MaterialIcon name="close" color={C.textMuted} size={16} />
            </TouchableOpacity>
          ) : null}
        </View>

        <TaskStatusFilterButton
          isOpen={isStatusFilterOpen}
          value={statusFilter}
          onChange={setStatusFilter}
          onOpenChange={setIsStatusFilterOpen}
        />
      </View>

      <View className="flex-row items-center justify-between">
        <Text
          className="text-[11px] font-bold uppercase"
          style={{ color: C.textMuted, letterSpacing: 1.1 }}
        >
          Tasks
        </Text>
        <Text className="text-[12px] font-semibold" style={{ color: C.textMuted }}>
          {filteredTasks.length}/{tasks.length}
        </Text>
      </View>

      <View className="gap-3">
        {tasks.length === 0 ? (
          <EmptyState title="No tasks" />
        ) : filteredTasks.length === 0 ? (
          <EmptyState title="No matching tasks" />
        ) : (
          filteredTasks.map((task) => (
            <TaskRow key={task.id} task={task} isSelected={task.id === selectedTaskId} />
          ))
        )}
      </View>
    </View>
  );
}

function MaterialInfoPill({ icon, label }: { icon: string; label: string }) {
  return (
    <View
      className="flex-row items-center rounded-full px-2.5 py-1.5"
      style={{ backgroundColor: Colors.surfaceContainer }}
    >
      <MaterialIcon name={icon} color={C.textMuted} size={14} />
      <Text className="ml-1.5 text-[11px] font-semibold" style={{ color: C.textMuted }}>
        {label}
      </Text>
    </View>
  );
}

function SelectedMaterialCard({
  detailError,
  isLoading,
  version,
}: {
  detailError?: string;
  isLoading: boolean;
  version: ResourceFileMaterialVersion | null;
}) {
  if (!version) return <EmptyState title="No material selected" />;

  const sourceCount = version.sourceCount ?? 0;
  const pageCount = version.materials.pages?.length ?? 0;
  const imageUri = version.materials.imageUri;

  return (
    <View
      className="overflow-hidden rounded-xl"
      style={{ backgroundColor: C.surface, borderWidth: 1, borderColor: C.border }}
    >
      <View className="p-4">
        <View className="flex-row items-start justify-between gap-3">
          <View className="min-w-0 flex-1">
            <Text
              className="text-[10px] font-bold uppercase"
              style={{ color: C.textMuted, letterSpacing: 1 }}
            >
              Selected material
            </Text>
            <Text
              className="mt-1 text-[20px] font-black"
              numberOfLines={2}
              style={{ color: C.text }}
            >
              {version.materials.title}
            </Text>
          </View>
          {isLoading ? <ActivityIndicator color={C.accent} size="small" /> : null}
        </View>

        <View
          className="mt-4 h-44 overflow-hidden rounded-xl"
          style={{ backgroundColor: Colors.surfaceContainer }}
        >
          {imageUri ? (
            <Image source={{ uri: imageUri }} className="h-full w-full" resizeMode="cover" />
          ) : (
            <View className="h-full items-center justify-center gap-2">
              <MaterialIcon name="image_not_supported" color={C.textMuted} size={28} />
              <Text className="text-[13px] font-semibold" style={{ color: C.textMuted }}>
                No preview image
              </Text>
            </View>
          )}
        </View>

        {detailError ? (
          <View
            className="mt-3 flex-row items-center rounded-xl px-3 py-2"
            style={{ backgroundColor: 'rgba(245,158,11,0.12)' }}
          >
            <MaterialIcon name="warning" color={Colors.statusReview} size={15} />
            <Text className="ml-2 flex-1 text-[12px]" style={{ color: Colors.statusReview }}>
              {detailError}
            </Text>
          </View>
        ) : null}

        <View className="mt-4 flex-row flex-wrap gap-2">
          <MaterialInfoPill icon="inventory_2" label={`${sourceCount} source files`} />
          <MaterialInfoPill icon="article" label={`${pageCount} pages`} />
          <MaterialInfoPill icon="person" label={version.createdByName ?? 'Unknown creator'} />
          <MaterialInfoPill icon="calendar_today" label={formatDate(version.createdAt)} />
        </View>

        {version.taskTitle ? (
          <View
            className="mt-4 flex-row items-center rounded-xl px-3 py-3"
            style={{ backgroundColor: Colors.surfaceContainer }}
          >
            <MaterialIcon name="checklist" color={C.accent} size={18} />
            <View className="ml-3 min-w-0 flex-1">
              <Text className="text-[10px] font-bold uppercase" style={{ color: C.textMuted }}>
                Linked task
              </Text>
              <Text
                className="mt-0.5 text-[13px] font-bold"
                numberOfLines={1}
                style={{ color: C.text }}
              >
                {version.taskTitle}
              </Text>
            </View>
          </View>
        ) : null}

        <View
          className="mt-4 flex-row gap-3 border-t pt-4"
          style={{ borderTopColor: C.borderFaint }}
        >
          <View className="flex-1">
            <Text className="text-[10px] font-bold uppercase" style={{ color: C.textMuted }}>
              Updated
            </Text>
            <Text className="mt-1 text-[13px] font-semibold" style={{ color: C.text }}>
              {formatDate(version.updatedAt)}
            </Text>
          </View>
          <View className="flex-1">
            <Text className="text-[10px] font-bold uppercase" style={{ color: C.textMuted }}>
              Updated by
            </Text>
            <Text
              className="mt-1 text-[13px] font-semibold"
              numberOfLines={1}
              style={{ color: C.text }}
            >
              {version.updatedByName ?? 'Unknown user'}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

function MaterialVersionRow({
  isSelected,
  onPress,
  version,
}: {
  isSelected: boolean;
  onPress: () => void;
  version: ResourceFileMaterialVersion;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.78}
      onPress={onPress}
      className="rounded-xl px-3.5 py-3"
      style={{
        backgroundColor: isSelected ? 'rgba(255,211,105,0.12)' : C.surface,
        borderWidth: 1,
        borderColor: isSelected ? C.accent : C.border,
      }}
    >
      <View className="flex-row items-center gap-3">
        <View
          className="h-10 w-10 items-center justify-center rounded-lg"
          style={{ backgroundColor: isSelected ? 'rgba(255,211,105,0.16)' : Colors.iconBg }}
        >
          <MaterialIcon name="inventory_2" color={isSelected ? C.accent : C.textMuted} size={20} />
        </View>

        <View className="min-w-0 flex-1">
          <Text className="text-[14px] font-bold" numberOfLines={1} style={{ color: C.text }}>
            {version.materials.title}
          </Text>
          <Text className="mt-1 text-[12px]" numberOfLines={1} style={{ color: C.textMuted }}>
            {version.createdByName ?? 'Unknown creator'} - {formatDate(version.createdAt)}
          </Text>
        </View>

        {isSelected ? <MaterialIcon name="check_circle" color={C.accent} size={20} /> : null}
      </View>
      {version.taskTitle ? (
        <View className="mt-3 flex-row items-center">
          <MaterialIcon name="checklist" color={C.textMuted} size={14} />
          <Text
            className="ml-1.5 text-[11px] font-semibold"
            numberOfLines={1}
            style={{ color: C.textMuted }}
          >
            {version.taskTitle}
          </Text>
        </View>
      ) : null}
    </TouchableOpacity>
  );
}

export function MaterialsPanel({
  detailError,
  isSelectedVersionLoading = false,
  selectedVersion,
  selectedVersionId,
  versions,
  onSelectVersion,
}: {
  detailError?: string;
  isSelectedVersionLoading?: boolean;
  selectedVersion?: ResourceFileMaterialVersion | null;
  selectedVersionId: string | null;
  versions: ResourceFileMaterialVersion[];
  onSelectVersion: (version: ResourceFileMaterialVersion) => void;
}) {
  const resolvedSelectedVersion =
    selectedVersion ?? versions.find((version) => version.id === selectedVersionId) ?? null;

  return (
    <View className="mt-6 gap-4">
      <SelectedMaterialCard
        detailError={detailError}
        isLoading={isSelectedVersionLoading}
        version={resolvedSelectedVersion}
      />

      <View className="gap-3">
        {versions.length === 0 ? (
          <EmptyState title="No material versions" />
        ) : (
          versions.map((version) => (
            <MaterialVersionRow
              key={version.id}
              isSelected={version.id === selectedVersionId}
              version={version}
              onPress={() => onSelectVersion(version)}
            />
          ))
        )}
      </View>
    </View>
  );
}
