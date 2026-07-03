import React, { useState } from 'react';
import { ActivityIndicator, Text, TextInput, TouchableOpacity, View } from 'react-native';

import CommentBubble from '@/src/components/sub-component/CommentBubble';
import FrameListPanel from '@/src/components/sub-component/FrameListPanel';
import MaterialIcon from '@/src/components/shared/MaterialIcon';
import { Colors } from '@/src/constants/colors';
import {
  ResourceFileMaterialVersion,
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

const STATUS_META: Record<ResourceTaskStatus, { label: string; color: string }> = {
  PENDING: { label: 'Pending', color: Colors.statusPending },
  INPROGRESS: { label: 'In progress', color: Colors.statusProgress },
  REVIEW: { label: 'Review', color: Colors.statusReview },
  DONE: { label: 'Done', color: Colors.statusDone },
};

function formatDate(value?: string) {
  if (!value) return 'No date';

  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  }).format(new Date(value));
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
  fileContent,
}: {
  description: string;
  fileContent: string;
}) {
  return (
    <View className="mt-6 gap-4">
      <View
        className="rounded-xl p-5"
        style={{ backgroundColor: C.surface, borderWidth: 1, borderColor: C.border }}
      >
        <Text
          className="mb-3 text-[10px] font-bold uppercase"
          style={{ color: C.textMuted, letterSpacing: 1 }}
        >
          Overview
        </Text>
        <Text className="text-[15px] leading-6" style={{ color: C.text }}>
          {description}
        </Text>
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
      className="h-11 flex-row items-center gap-2 rounded-xl px-3"
      onPress={onPress}
      style={{
        backgroundColor: isActive ? 'rgba(255,211,105,0.14)' : C.surface,
        borderWidth: 1,
        borderColor: isActive ? 'rgba(255,211,105,0.36)' : C.borderFaint,
        minWidth: 136,
      }}
    >
      <MaterialIcon name="article" color={isActive ? C.accent : C.textMuted} size={16} />
      <Text className="text-[12px] font-bold" style={{ color: isActive ? C.accent : C.text }}>
        File comments
      </Text>
      <View
        className="min-w-5 items-center rounded-full px-1.5 py-0.5"
        style={{ backgroundColor: 'rgba(255,211,105,0.18)' }}
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
  const selectedOption = options.find((option) => option.id === selectedId);
  const displayLabel = selectedOption?.label ?? label;
  const isDisabled = disabled || isLoading;

  return (
    <View className="flex-1" style={{ minWidth: 152, position: 'relative', zIndex: isOpen ? 40 : 1 }}>
      <TouchableOpacity
        activeOpacity={0.78}
        accessibilityRole="button"
        accessibilityState={{ disabled: isDisabled, expanded: isOpen, selected: isActive }}
        className="h-11 flex-row items-center justify-between gap-2 rounded-xl px-3"
        disabled={isDisabled}
        onPress={() => onOpenChange(!isOpen)}
        style={{
          backgroundColor: isActive ? 'rgba(255,211,105,0.14)' : C.surface,
          borderWidth: 1,
          borderColor: isActive ? 'rgba(255,211,105,0.36)' : C.borderFaint,
          opacity: disabled ? 0.48 : 1,
        }}
      >
        <View className="flex-1 flex-row items-center gap-2">
          <MaterialIcon name={icon} color={isActive ? C.accent : C.textMuted} size={16} />
          <Text
            className="flex-1 text-[12px] font-semibold"
            numberOfLines={1}
            style={{ color: isActive ? C.accent : C.text }}
          >
            {isLoading ? 'Loading...' : displayLabel}
          </Text>
        </View>
        {count !== undefined ? (
          <View
            className="min-w-5 items-center rounded-full px-1.5 py-0.5"
            style={{ backgroundColor: 'rgba(255,211,105,0.18)' }}
          >
            <Text className="text-[10px] font-bold" style={{ color: C.accent }}>
              {count}
            </Text>
          </View>
        ) : null}
        <MaterialIcon name={isOpen ? 'expand_less' : 'expand_more'} color={C.textMuted} size={18} />
      </TouchableOpacity>

      {isOpen ? (
        <View
          className="absolute left-0 right-0 top-12 overflow-hidden rounded-xl"
          style={{
            backgroundColor: C.surface,
            borderWidth: 1,
            borderColor: C.borderFaint,
          }}
        >
          {options.length === 0 ? (
            <View className="px-3 py-3">
              <Text className="text-[12px]" style={{ color: C.textMuted }}>
                {emptyLabel}
              </Text>
            </View>
          ) : (
            options.map((option, index) => {
              const isSelected = option.id === selectedId;

              return (
                <TouchableOpacity
                  key={option.id}
                  activeOpacity={0.72}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  className="flex-row items-center gap-2 px-3 py-3"
                  onPress={() => {
                    onSelect(option);
                    onOpenChange(false);
                  }}
                  style={{
                    borderBottomWidth: index === options.length - 1 ? 0 : 1,
                    borderBottomColor: C.borderFaint,
                  }}
                >
                  <View className="flex-1">
                    <Text
                      className="text-[12px] font-semibold"
                      numberOfLines={1}
                      style={{ color: isSelected ? C.accent : C.text }}
                    >
                      {option.label}
                    </Text>
                    {option.description ? (
                      <Text className="mt-0.5 text-[10px]" numberOfLines={1} style={{ color: C.textMuted }}>
                        {option.description}
                      </Text>
                    ) : null}
                  </View>
                  {isSelected ? <MaterialIcon name="check" color={C.accent} size={16} /> : null}
                </TouchableOpacity>
              );
            })
          )}
        </View>
      ) : null}
    </View>
  );
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
    <View className="gap-2">
      <View className="flex-row">
        <FileCommentLabel count={commentCount} isActive={activeScope === 'file'} onPress={onSelectFile} />
      </View>
      <View className="flex-row gap-2" style={{ zIndex: openMenu ? 40 : 1 }}>
        <CommentComboBox
          count={taskCommentCount}
          emptyLabel="No tasks found"
          icon="checklist"
          isActive={activeScope === 'task'}
          isLoading={isTasksLoading}
          isOpen={openMenu === 'task'}
          label="Task comments"
          onOpenChange={(isOpen) => setOpenMenu(isOpen ? 'task' : null)}
          onSelect={(option) => onSelectTask(option.id)}
          options={taskOptions}
          selectedId={selectedTaskId}
        />
        <CommentComboBox
          count={frameCommentCount}
          disabled={!selectedTaskId}
          emptyLabel={selectedTaskId ? 'No frames found' : 'Select a task first'}
          icon="frame_person"
          isActive={activeScope === 'frame'}
          isLoading={isFramesLoading}
          isOpen={openMenu === 'frame'}
          label="Frame comments"
          onOpenChange={(isOpen) => setOpenMenu(isOpen ? 'frame' : null)}
          onSelect={(option) => onSelectFrame(option.id)}
          options={frameOptions}
          selectedId={selectedFrameId}
        />
      </View>
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
  isCommentsLoading,
  isFramesLoading,
  isTasksLoading,
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
  isCommentsLoading: boolean;
  isFramesLoading: boolean;
  isTasksLoading: boolean;
  onRetryComments: () => void;
  onSelectFileComments: () => void;
  onSelectFrameComments: (frameId: string) => void;
  onSelectTaskComments: (taskId: string) => void;
  selectedFrameId: string | null;
  selectedTaskId: string | null;
  taskCommentCount?: number;
  taskOptions: CommentSelectOption[];
}) {
  return (
    <View className="mt-6 gap-4">
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
          style={{ backgroundColor: 'rgba(255,184,77,0.1)', borderWidth: 1, borderColor: 'rgba(255,184,77,0.2)' }}
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
            Không thể tải bình luận
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
              Thử lại
            </Text>
          </TouchableOpacity>
        </View>
      ) : comments.length > 0 ? (
        <View className="gap-3">
          {comments.map((item, index) => (
            <CommentBubble key={`${item.id}-${index}`} comment={item} />
          ))}
        </View>
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
      ? 'Trao đổi với team về file này...'
      : activeScope === 'task'
        ? 'Trao đổi với team về task này...'
        : 'Nhận xét về frame này...';

  const handleSubmit = async () => {
    if (isSubmitting || !comment.trim()) return;

    setIsSubmitting(true);
    setSubmitErrorMessage('');

    try {
      await onCreateComment(comment);
      setComment('');
    } catch (error) {
      setSubmitErrorMessage(error instanceof Error ? error.message : 'Không thể gửi bình luận.');
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
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.78}
      onPress={onPress}
      className="rounded-xl p-4"
      style={{
        backgroundColor: isSelected ? 'rgba(255,211,105,0.12)' : C.surface,
        borderWidth: 1,
        borderColor: isSelected ? C.accent : C.border,
      }}
    >
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
            <Text numberOfLines={2} className="text-[13px] leading-5" style={{ color: C.textMuted }}>
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
  const visibleComments = selectedFrame
    ? task.comments.filter((item) => item.frameId === selectedFrame.id)
    : task.comments;

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
      setErrorMessage(error instanceof Error ? error.message : 'Không thể gửi bình luận.');
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
                  ? `Nhận xét về "${selectedFrame.name}"...`
                  : 'Trao đổi với team về task này...'
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
                backgroundColor:
                  isSubmitting || !comment.trim() ? C.surfaceHighest : C.accent,
              }}
            >
              {isSubmitting ? (
                <ActivityIndicator color={C.text} size="small" />
              ) : (
                <MaterialIcon
                  name="send"
                  color={!comment.trim() ? C.textFaint : C.bg}
                  size={18}
                />
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

function TaskFramePanel({
  selectedFrame,
  task,
  onSelectFrame,
}: {
  selectedFrame: ResourceTaskFrame | null;
  task: ResourceFileTask;
  onSelectFrame: (frame: ResourceTaskFrame) => void;
}) {
  return (
    <View
      className="gap-4 rounded-xl p-4"
      style={{ backgroundColor: 'rgba(255,255,255,0.035)', borderWidth: 1, borderColor: C.border }}
    >
      <View className="gap-2">
        <View className="flex-row items-start justify-between gap-3">
          <Text className="flex-1 text-[15px] font-bold" style={{ color: C.text }}>
            {task.title}
          </Text>
          <StatusBadge status={task.status} />
        </View>

        {task.description ? (
          <Text className="text-[13px] leading-5" style={{ color: C.textMuted }}>
            {task.description}
          </Text>
        ) : null}
      </View>

      <View className="flex-row items-center justify-between">
        <Text className="text-[12px] font-bold uppercase" style={{ color: C.textMuted }}>
          Frames
        </Text>
        <Text className="text-[12px]" style={{ color: C.textFaint }}>
          Tap a frame to focus
        </Text>
      </View>

      {task.frames.length > 0 ? (
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
      ) : (
        <EmptyState title="No frames for this task" />
      )}
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

export function TasksPanel({
  onCreateComment,
  onSelectFrame,
  onSelectTask,
  selectedFrame,
  selectedTaskId,
  showTaskDiscussion = true,
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
  const activeTasks = tasks.filter((task) => task.status !== 'DONE');
  const inactiveTasks = tasks.filter((task) => task.status === 'DONE');

  const selectedTask = tasks.find((t) => t.id === selectedTaskId);

  if (selectedTask) {
    return (
      <View className="mt-6 gap-4">
        <TouchableOpacity
          activeOpacity={0.78}
          onPress={() => onSelectTask(null)}
          className="flex-row items-center gap-2 pb-2"
          style={{ borderBottomWidth: 1, borderBottomColor: C.border }}
        >
          <MaterialIcon name="arrow_back" color={C.accent} size={20} />
          <Text className="text-[14px] font-bold" style={{ color: C.text }}>
            Back to Tasks
          </Text>
          <Text className="text-[14px] font-medium ml-2 truncate flex-1" numberOfLines={1} style={{ color: C.textMuted }}>
            ({selectedTask.title})
          </Text>
        </TouchableOpacity>

        {showTaskDiscussion && onCreateComment ? (
          <TaskDiscussion
            onCreateComment={onCreateComment}
            selectedFrame={selectedFrame}
            task={selectedTask}
            onSelectFrame={onSelectFrame}
          />
        ) : (
          <TaskFramePanel
            selectedFrame={selectedFrame}
            task={selectedTask}
            onSelectFrame={onSelectFrame}
          />
        )}
      </View>
    );
  }

  return (
    <View className="mt-6 gap-7">
      <View className="gap-3">
        <Text
          className="text-[11px] font-bold uppercase"
          style={{ color: C.textMuted, letterSpacing: 1.1 }}
        >
          Active
        </Text>
        {activeTasks.length === 0 ? (
          <EmptyState title="No active tasks" />
        ) : (
          activeTasks.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              isSelected={false}
              onPress={() => onSelectTask(task)}
            />
          ))
        )}
      </View>

      <View className="gap-3">
        <Text
          className="text-[11px] font-bold uppercase"
          style={{ color: C.textMuted, letterSpacing: 1.1 }}
        >
          Inactive
        </Text>
        {inactiveTasks.length === 0 ? (
          <EmptyState title="No inactive tasks" />
        ) : (
          inactiveTasks.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              isSelected={false}
              onPress={() => onSelectTask(task)}
            />
          ))
        )}
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
      className="rounded-xl p-4"
      style={{
        backgroundColor: isSelected ? 'rgba(93,211,158,0.12)' : C.surface,
        borderWidth: 1,
        borderColor: isSelected ? Colors.statusDone : C.border,
      }}
    >
      <View className="flex-row items-start gap-3">
        <View
          className="h-11 w-11 items-center justify-center rounded-lg"
          style={{ backgroundColor: isSelected ? 'rgba(93,211,158,0.18)' : Colors.iconBg }}
        >
          <MaterialIcon
            name="image"
            color={isSelected ? Colors.statusDone : Colors.textMuted}
            size={22}
          />
        </View>

        <View className="flex-1 gap-2">
          <View className="flex-row items-start justify-between gap-3">
            <Text className="flex-1 text-[15px] font-bold" style={{ color: C.text }}>
              {version.materials.title}
            </Text>
            {isSelected ? (
              <MaterialIcon name="check_circle" color={Colors.statusDone} size={20} />
            ) : null}
          </View>

          {version.materials.note ? (
            <Text className="text-[13px] leading-5" style={{ color: C.textMuted }}>
              {version.materials.note}
            </Text>
          ) : null}

          <View className="flex-row flex-wrap gap-x-4 gap-y-2">
            <Text className="text-[12px]" style={{ color: C.textMuted }}>
              {version.createdByName ?? 'Unknown creator'}
            </Text>
            <Text className="text-[12px]" style={{ color: C.textMuted }}>
              {formatDate(version.createdAt)}
            </Text>
            <Text className="text-[12px]" style={{ color: C.textMuted }}>
              {(version.materials.layers ?? []).length} layers
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export function MaterialsPanel({
  selectedVersionId,
  versions,
  onSelectVersion,
}: {
  selectedVersionId: string | null;
  versions: ResourceFileMaterialVersion[];
  onSelectVersion: (version: ResourceFileMaterialVersion) => void;
}) {
  return (
    <View className="mt-6 gap-3">
      <Text
        className="text-[11px] font-bold uppercase"
        style={{ color: C.textMuted, letterSpacing: 1.1 }}
      >
        Previous Versions
      </Text>

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
  );
}
