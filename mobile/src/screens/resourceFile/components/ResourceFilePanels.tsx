import React from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';

import CommentBubble from '@/src/components/sub-component/CommentBubble';
import FrameListPanel from '@/src/components/sub-component/FrameListPanel';
import MaterialIcon from '@/src/components/shared/MaterialIcon';
import { Colors } from '@/src/constants/colors';
import {
  ResourceFileMaterialVersion,
  ResourceFileTask,
  ResourceTaskFrame,
  ResourceTaskStatus,
} from '@/src/types/resources';

import { C } from '@/src/screens/taskDetail/components';
import MarkdownLite from './MarkdownLite';

export type ResourceFileTab = 'Overview' | 'Tasks' | 'Materials';

const FILE_TABS: ResourceFileTab[] = ['Overview', 'Tasks', 'Materials'];

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
}: {
  activeTab: ResourceFileTab;
  onTabChange: (tab: ResourceFileTab) => void;
}) {
  return (
    <View className="mt-6 flex-row" style={{ borderBottomWidth: 1, borderBottomColor: C.border }}>
      {FILE_TABS.map((tab) => {
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
  comment,
  onCommentChange,
  selectedFrame,
  task,
  onSelectFrame,
}: {
  comment: string;
  onCommentChange: (value: string) => void;
  selectedFrame: ResourceTaskFrame | null;
  task: ResourceFileTask;
  onSelectFrame: (frame: ResourceTaskFrame) => void;
}) {
  const visibleComments = selectedFrame
    ? task.comments.filter((item) => item.frameId === selectedFrame.id)
    : task.comments;

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
            {visibleComments.map((item) => (
              <CommentBubble key={item.id} comment={item} />
            ))}
          </View>
        ) : (
          <EmptyState title="No discussion yet" />
        )}

        <View
          className="flex-row items-center gap-3 rounded-xl px-4 py-2"
          style={{ backgroundColor: C.surface, borderWidth: 1, borderColor: C.borderFaint }}
        >
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
            onChangeText={onCommentChange}
            placeholder={
              selectedFrame
                ? `Nhận xét về "${selectedFrame.name}"...`
                : 'Trao đổi với team về task này...'
            }
            placeholderTextColor={C.textFaint}
            className="flex-1 py-2 text-sm"
            style={{ color: C.text }}
            multiline
          />
        </View>
      </View>
    </View>
  );
}

function TaskSection({
  comment,
  onCommentChange,
  onSelectFrame,
  onSelectTask,
  selectedFrame,
  selectedTaskId,
  tasks,
  title,
}: {
  comment: string;
  onCommentChange: (value: string) => void;
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
                  comment={comment}
                  onCommentChange={onCommentChange}
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
  comment,
  onCommentChange,
  onSelectFrame,
  onSelectTask,
  selectedFrame,
  selectedTaskId,
  tasks,
}: {
  comment: string;
  onCommentChange: (value: string) => void;
  onSelectFrame: (frame: ResourceTaskFrame) => void;
  onSelectTask: (task: ResourceFileTask | null) => void;
  selectedFrame: ResourceTaskFrame | null;
  selectedTaskId: string | null;
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

        <TaskDiscussion
          comment={comment}
          onCommentChange={onCommentChange}
          selectedFrame={selectedFrame}
          task={selectedTask}
          onSelectFrame={onSelectFrame}
        />
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
