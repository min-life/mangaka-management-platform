import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';

import ApiStateView from '@/src/components/shared/ApiStateView';
import BottomNavBar from '@/src/components/shared/BottomNavBar';
import { Colors } from '@/src/constants/colors';
import { navigateToNotificationTarget } from '@/src/navigation/notificationTargetNavigation';
import { RootStackParamList } from '@/src/navigation/types';
import { fetchProjectActivityLogs } from '@/src/services/activityLogApi';
import { ApiEditorBoard } from '@/src/services/apiTypes';
import { uploadProjectImageToCloudinary } from '@/src/services/cloudinaryUpload';
import { fetchProjectBundle, updateProject } from '@/src/services/projectApi';
import { ActivityItem } from '@/src/types/home';
import { ProjectItem } from '@/src/types/projects';

import {
  ProjectActivitySection,
  ProjectDetailHero,
  ProjectDetailMenuItem,
  ProjectDetailTopBar,
  ProjectEditorBoardSection,
  ProjectRenameModal,
} from './components';

type ProjectDetailScreenProps = NativeStackScreenProps<RootStackParamList, 'ProjectDetail'>;

export default function ProjectDetailScreen({ navigation, route }: ProjectDetailScreenProps) {
  const scrollViewRef = useRef<ScrollView>(null);
  const [project, setProject] = useState<ProjectItem | null>(null);
  const [editorBoard, setEditorBoard] = useState<ApiEditorBoard | null>(null);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isActivityLoading, setIsActivityLoading] = useState(true);
  const [activityErrorMessage, setActivityErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [isRenameVisible, setIsRenameVisible] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameErrorMessage, setRenameErrorMessage] = useState('');
  const [renameForm, setRenameForm] = useState('');
  const [projectImageAsset, setProjectImageAsset] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [projectImagePreviewUri, setProjectImagePreviewUri] = useState<string | undefined>();

  const loadProject = useCallback(async () => {
    setIsLoading(true);
    setIsActivityLoading(true);
    setErrorMessage('');
    setActivityErrorMessage('');

    try {
      const bundle = await fetchProjectBundle(route.params.projectId, {
        includeResourceStats: true,
      });
      setProject(bundle.project);
      setEditorBoard(bundle.board);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to load project.');
    } finally {
      setIsLoading(false);
    }

    try {
      const activityResult = await fetchProjectActivityLogs(route.params.projectId, {
        limit: 12,
      });
      setActivities(activityResult.activities);
    } catch (error) {
      setActivityErrorMessage(
        error instanceof Error ? error.message : 'Unable to load project activity.',
      );
    } finally {
      setIsActivityLoading(false);
    }
  }, [route.params.projectId]);

  useEffect(() => {
    void loadProject();
  }, [loadProject]);

  useFocusEffect(
    useCallback(() => {
      requestAnimationFrame(() => {
        scrollViewRef.current?.scrollTo({ y: 0, animated: false });
      });
    }, []),
  );

  const handleActivityPress = useCallback(
    (activity: ActivityItem) => {
      navigateToNotificationTarget(navigation, activity.target);
    },
    [navigation],
  );

  const openRenameModal = useCallback(() => {
    if (!project) return;
    setRenameForm(project.name);
    setProjectImageAsset(null);
    setProjectImagePreviewUri(project.coverUri);
    setRenameErrorMessage('');
    setIsRenameVisible(true);
  }, [project]);

  const closeRenameModal = useCallback(() => {
    if (isRenaming) return;
    setIsRenameVisible(false);
    setRenameErrorMessage('');
    setProjectImageAsset(null);
  }, [isRenaming]);

  const handlePickProjectImage = useCallback(async () => {
    if (isRenaming) return;

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setRenameErrorMessage('Please allow access to your photo library.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [16, 9],
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.88,
    });

    if (result.canceled || !result.assets[0]) return;

    setProjectImageAsset(result.assets[0]);
    setProjectImagePreviewUri(result.assets[0].uri);
    setRenameErrorMessage('');
  }, [isRenaming]);

  const handleSubmitRename = useCallback(async () => {
    if (!project || isRenaming) return;

    const nextName = renameForm.trim();
    if (!nextName) {
      setRenameErrorMessage('Please enter a project name.');
      return;
    }

    if (nextName === project.name && !projectImageAsset) {
      setIsRenameVisible(false);
      return;
    }

    setIsRenaming(true);
    setRenameErrorMessage('');

    try {
      const nextImageUrl = projectImageAsset
        ? await uploadProjectImageToCloudinary(projectImageAsset)
        : undefined;
      const updatedProject = await updateProject(project.id, {
        ...(nextImageUrl ? { imageUrl: nextImageUrl } : {}),
        name: nextName,
      });
      setProject((currentProject) =>
        currentProject
          ? {
              ...currentProject,
              coverUri: updatedProject.imageUrl ?? currentProject.coverUri,
              name: updatedProject.name,
              updatedAt: updatedProject.updatedAt,
            }
          : currentProject,
      );
      setIsRenameVisible(false);
      setProjectImageAsset(null);
      setProjectImagePreviewUri(undefined);
    } catch (error) {
      setRenameErrorMessage(
        error instanceof Error ? error.message : 'Unable to update project.',
      );
    } finally {
      setIsRenaming(false);
    }
  }, [isRenaming, project, projectImageAsset, renameForm]);

  if (isLoading) {
    return (
      <View className="flex-1" style={{ backgroundColor: Colors.bg }}>
        <ProjectDetailTopBar onBack={() => navigation.goBack()} />
        <ApiStateView type="loading" />
      </View>
    );
  }

  if (errorMessage || !project) {
    return (
      <View className="flex-1" style={{ backgroundColor: Colors.bg }}>
        <ProjectDetailTopBar onBack={() => navigation.goBack()} />
        <ApiStateView
          type="error"
          message={errorMessage || 'Project not found'}
          onRetry={loadProject}
        />
      </View>
    );
  }

  const menuItems = [
    {
      label: 'Resource',
      subtitle: `${project.folders} folders - ${project.files} files - ${project.materials} materials`,
      count: project.files,
      icon: 'folder',
      iconColor: '#FFFFFF',
      iconBg: '#22C55E',
      onPress: () => navigation.navigate('Resources', { projectId: project.id }),
    },
    {
      label: 'Application',
      count: project.applicationTotal,
      icon: 'apps',
      iconColor: '#FFFFFF',
      iconBg: Colors.statusProgress,
      onPress: () => navigation.navigate('Applications', { projectId: project.id }),
    },
    {
      label: 'Task',
      count: project.taskTotal,
      icon: 'checklist',
      iconColor: '#FFFFFF',
      iconBg: Colors.accent,
      onPress: () => navigation.navigate('Tasks', { projectId: project.id }),
    },
    {
      label: 'Contribute',
      count: project.contributors,
      icon: 'group_add',
      iconColor: '#FFFFFF',
      iconBg: '#DB2777',
      onPress: () => navigation.navigate('ProjectContributors', { projectId: project.id }),
    },
    {
      label: 'Report',
      subtitle: `${project.stats.completionRate}% complete - ${project.stats.lastUpdated}`,
      icon: 'assessment',
      iconColor: '#FFFFFF',
      iconBg: '#8B5CF6',
      onPress: () => navigation.navigate('ProjectReport', { projectId: project.id }),
    },
  ];

  return (
    <View className="flex-1" style={{ backgroundColor: Colors.bg }}>
      <ProjectDetailTopBar onBack={() => navigation.goBack()} onMorePress={openRenameModal} />

      <ScrollView
        ref={scrollViewRef}
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 112 }}
        showsVerticalScrollIndicator={false}
      >
        <ProjectDetailHero project={project} />

        <View
          style={{
            borderTopWidth: 1,
            borderBottomWidth: 1,
            borderColor: Colors.borderFaint,
          }}
        >
          {menuItems.map((item, index) => (
            <ProjectDetailMenuItem
              key={item.label}
              icon={item.icon}
              iconColor={item.iconColor}
              iconBg={item.iconBg}
              label={item.label}
              subtitle={item.subtitle}
              count={item.count}
              onPress={item.onPress}
              isLast={index === menuItems.length - 1}
            />
          ))}
        </View>

        <ProjectActivitySection
          activities={activities}
          errorMessage={activityErrorMessage}
          isLoading={isActivityLoading}
          onActivityPress={handleActivityPress}
        />

        <ProjectEditorBoardSection board={editorBoard} />
      </ScrollView>

      <BottomNavBar activeTab="home" />

      <ProjectRenameModal
        errorMessage={renameErrorMessage}
        imagePreviewUri={projectImagePreviewUri}
        isSubmitting={isRenaming}
        name={renameForm}
        onChangeName={setRenameForm}
        onClose={closeRenameModal}
        onPickImage={handlePickProjectImage}
        onSubmit={handleSubmitRename}
        visible={isRenameVisible}
      />
    </View>
  );
}
