import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import ApiStateView from '@/src/components/shared/ApiStateView';
import BottomNavBar from '@/src/components/shared/BottomNavBar';
import { Colors } from '@/src/constants/colors';
import { RootStackParamList } from '@/src/navigation/types';
import ApplicationCard from '@/src/screens/applications/components/ApplicationCard';
import EditorBoardTopBar from '@/src/screens/editorBoards/components/EditorBoardTopBar';
import { fetchEditorBoardBundle } from '@/src/services/editorBoardApi';
import { ApplicationItem } from '@/src/types/applications';
import { EditorBoardItem } from '@/src/types/editorBoards';

type EditorBoardApplicationsScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'EditorBoardApplications'
>;

export default function EditorBoardApplicationsScreen({
  navigation,
  route,
}: EditorBoardApplicationsScreenProps) {
  const [board, setBoard] = useState<EditorBoardItem | null>(null);
  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const loadApplications = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const bundle = await fetchEditorBoardBundle(route.params.boardId);
      setBoard(bundle.board);
      setApplications(bundle.applications);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Không thể tải applications.');
    } finally {
      setIsLoading(false);
    }
  }, [route.params.boardId]);

  useEffect(() => {
    void loadApplications();
  }, [loadApplications]);

  return (
    <View className="flex-1" style={{ backgroundColor: Colors.bg }}>
      <EditorBoardTopBar
        onBack={() => navigation.goBack()}
        subtitle={board?.name ?? 'Editor Board'}
        title="Application"
      />

      {isLoading ? (
        <ApiStateView type="loading" />
      ) : errorMessage ? (
        <ApiStateView type="error" message={errorMessage} onRetry={loadApplications} />
      ) : applications.length > 0 ? (
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 16, paddingBottom: 100, gap: 12 }}
          showsVerticalScrollIndicator={false}
        >
          {applications.map((application) => (
            <ApplicationCard
              key={application.id}
              application={application}
              onPress={() =>
                navigation.navigate('ApplicationDetail', {
                  applicationId: application.id,
                  projectId: application.projectId,
                })
              }
            />
          ))}
        </ScrollView>
      ) : (
        <ApiStateView
          type="empty"
          title="Không có application"
          message="Editor board này chưa có application nào."
        />
      )}

      <BottomNavBar activeTab="home" />
    </View>
  );
}
