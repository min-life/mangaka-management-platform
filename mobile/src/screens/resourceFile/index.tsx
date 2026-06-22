import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import BottomNavBar from '@/src/components/shared/BottomNavBar';
import { Colors } from '@/src/constants/colors';
import {
  findResourceFile,
  findResourceNode,
  getProjectResourceTree,
} from '@/src/constants/resourcesData';
import { RootStackParamList } from '@/src/navigation/types';

import { MarkdownLite, ResourceFileTopBar } from './components';

type ResourceFileScreenProps = NativeStackScreenProps<RootStackParamList, 'ResourceFile'>;

export default function ResourceFileScreen({
  navigation,
  route,
}: ResourceFileScreenProps) {
  const root = getProjectResourceTree(route.params.projectId);
  const file = findResourceFile(root, route.params.fileId);
  const parentNode = findResourceNode(root, route.params.parentFolderId);
  const parentName = parentNode?.type === 'folder' ? parentNode.name : 'Resource';

  if (!file) {
    return (
      <View className="flex-1" style={{ backgroundColor: Colors.bg }}>
        <ResourceFileTopBar
          backLabel={parentName}
          title="File"
          subtitle="Resource"
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
    <View className="flex-1" style={{ backgroundColor: Colors.bg }}>
      <ResourceFileTopBar
        backLabel={parentName}
        title={file.name}
        subtitle={parentName}
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator
      >
        <MarkdownLite content={file.content} />
      </ScrollView>

      <BottomNavBar activeTab="home" />
    </View>
  );
}
