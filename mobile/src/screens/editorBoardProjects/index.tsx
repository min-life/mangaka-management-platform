import React, { useCallback, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import ApiStateView from '@/src/components/shared/ApiStateView';
import BottomNavBar from '@/src/components/shared/BottomNavBar';
import { Colors } from '@/src/constants/colors';
import { RootStackParamList } from '@/src/navigation/types';
import EditorBoardTopBar from '@/src/screens/editorBoards/components/EditorBoardTopBar';
import { BoardProjectRow } from '@/src/screens/editorBoards/components';
import { fetchEditorBoardBundle } from '@/src/services/editorBoardApi';
import { EditorBoardItem } from '@/src/types/editorBoards';
import { ProjectItem } from '@/src/types/projects';

type EditorBoardProjectsScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'EditorBoardProjects'
>;

export default function EditorBoardProjectsScreen({
  navigation,
  route,
}: EditorBoardProjectsScreenProps) {
  const [board, setBoard] = useState<EditorBoardItem | null>(null);
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const loadProjects = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const bundle = await fetchEditorBoardBundle(route.params.boardId);
      setBoard(bundle.board);
      setProjects(bundle.projects);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to load projects.');
    } finally {
      setIsLoading(false);
    }
  }, [route.params.boardId]);

  useFocusEffect(
    useCallback(() => {
      void loadProjects();
    }, [loadProjects]),
  );

  return (
    <View className="flex-1" style={{ backgroundColor: Colors.bg }}>
      <EditorBoardTopBar
        onBack={() => navigation.goBack()}
        subtitle={board?.name ?? 'Editor Board'}
        title="Projects"
      />

      {isLoading ? (
        <ApiStateView type="loading" />
      ) : errorMessage ? (
        <ApiStateView type="error" message={errorMessage} onRetry={loadProjects} />
      ) : projects.length > 0 ? (
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 16, paddingBottom: 100, gap: 12 }}
          showsVerticalScrollIndicator={false}
        >
          {projects.map((project) => (
            <BoardProjectRow
              key={project.id}
              project={project}
              onPress={() => navigation.navigate('ProjectReport', { projectId: project.id })}
            />
          ))}
        </ScrollView>
      ) : (
        <ApiStateView
          type="empty"
          title="No projects"
          message="This editor board is not linked to any projects yet."
        />
      )}

      <BottomNavBar activeTab="home" />
    </View>
  );
}
