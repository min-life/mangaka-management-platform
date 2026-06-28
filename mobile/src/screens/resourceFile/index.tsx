import React, { useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Colors } from '@/src/constants/colors';
import {
  findResourceFile,
  findResourceNode,
  getProjectResourceTree,
} from '@/src/constants/resourcesData';
import {
  COMMENTS,
  CONTRIBUTORS,
  FRAMES,
  TASK_INFO,
} from '@/src/constants/taskDetailData';
import { RootStackParamList } from '@/src/navigation/types';
import { FrameAnnotation, ReviewTab } from '@/src/types/taskDetail';

import {
  ActionTab,
  C,
  DiscussionTab,
  OverviewTab,
  ReviewTabBar,
  TaskDetailTopBar,
  TaskPreviewSection,
} from '@/src/screens/taskDetail/components';

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
  const [activeTab, setActiveTab] = useState<ReviewTab>('Overview');
  const [comment, setComment] = useState('');
  const [selectedFrame, setSelectedFrame] = useState<FrameAnnotation | null>(null);
  const root = getProjectResourceTree(route.params.projectId);
  const file = findResourceFile(root, route.params.fileId);
  const parentNode = findResourceNode(root, route.params.parentFolderId);
  const parentName = parentNode?.type === 'folder' ? parentNode.name : 'Resource';

  const description = useMemo(
    () => (file ? buildFileDescription(file.content, file.language) : ''),
    [file],
  );

  const handleSelectFrame = (frame: FrameAnnotation) => {
    setSelectedFrame((prev) => (prev?.id === frame.id ? null : frame));
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
          imageUri={TASK_INFO.previewImageUri}
          selectedFrame={selectedFrame}
          status="In Review"
        />

        <ReviewTabBar activeTab={activeTab} onTabChange={setActiveTab} />

        {activeTab === 'Overview' && (
          <OverviewTab
            contributors={CONTRIBUTORS}
            description={description}
          />
        )}

        {activeTab === 'Discussion' && (
          <DiscussionTab
            comment={comment}
            comments={COMMENTS}
            frames={FRAMES}
            onCommentChange={setComment}
            selectedFrame={selectedFrame}
            onSelectFrame={handleSelectFrame}
          />
        )}

        {activeTab === 'Action' && (
          <ActionTab
            approveLabel="Approve File"
            rejectLabel="Reject File"
          />
        )}
      </ScrollView>
    </View>
  );
}
