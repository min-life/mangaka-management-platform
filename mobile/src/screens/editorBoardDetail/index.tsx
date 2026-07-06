import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import ApiStateView from '@/src/components/shared/ApiStateView';
import BottomNavBar from '@/src/components/shared/BottomNavBar';
import MaterialIcon from '@/src/components/shared/MaterialIcon';
import { Colors } from '@/src/constants/colors';
import { RootStackParamList } from '@/src/navigation/types';
import { fetchEditorBoardBundle, leaveEditorBoard } from '@/src/services/editorBoardApi';
import { ProjectDetailMenuItem, ProjectDetailTopBar } from '@/src/screens/projectDetail/components';
import { ApplicationItem } from '@/src/types/applications';
import { EditorBoardItem, EditorBoardMember } from '@/src/types/editorBoards';
import { ProjectItem } from '@/src/types/projects';

type EditorBoardDetailScreenProps = NativeStackScreenProps<RootStackParamList, 'EditorBoardDetail'>;

function getBoardInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

function EditorBoardDetailHero({
  description,
  leadName,
  name,
  role,
  updatedAtLabel,
}: {
  description: string;
  leadName?: string;
  name: string;
  role: string;
  updatedAtLabel: string;
}) {
  const subtitle = leadName ? `${role} - Lead: ${leadName}` : role;

  return (
    <View className="pb-6">
      <View
        className="h-[260px] items-center justify-center overflow-hidden"
        style={{ backgroundColor: Colors.iconBg }}
      >
        <View
          className="h-28 w-28 items-center justify-center rounded-3xl"
          style={{
            backgroundColor: Colors.overlayLight,
            borderWidth: 1,
            borderColor: Colors.borderFaint,
          }}
        >
          <MaterialIcon name="groups" color={Colors.accent} size={54} />
        </View>
        <Text className="mt-4 text-[22px] font-black" style={{ color: Colors.text }}>
          {getBoardInitials(name)}
        </Text>
      </View>

      <View className="px-4">
        <Text
          className="mt-5 text-[31px] font-black leading-tight"
          style={{ color: Colors.text }}
          numberOfLines={2}
        >
          {name}
        </Text>

        <Text className="mt-3 text-[14px] leading-6" style={{ color: Colors.textMuted }}>
          {description}
        </Text>

        <Text className="mt-4 text-[13px] leading-5" style={{ color: Colors.textFaint }}>
          {subtitle} - {updatedAtLabel}
        </Text>
      </View>
    </View>
  );
}

export default function EditorBoardDetailScreen({
  navigation,
  route,
}: EditorBoardDetailScreenProps) {
  const [board, setBoard] = useState<EditorBoardItem | null>(null);
  const [members, setMembers] = useState<EditorBoardMember[]>([]);
  const [boardProjects, setBoardProjects] = useState<ProjectItem[]>([]);
  const [publishRequests, setPublishRequests] = useState<ApplicationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLeavingBoard, setIsLeavingBoard] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const loadBoard = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const bundle = await fetchEditorBoardBundle(route.params.boardId);
      setBoard(bundle.board);
      setMembers(bundle.members);
      setBoardProjects(bundle.projects);
      setPublishRequests(bundle.applications);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Không thể tải editor board.');
    } finally {
      setIsLoading(false);
    }
  }, [route.params.boardId]);

  useFocusEffect(
    useCallback(() => {
      void loadBoard();
    }, [loadBoard]),
  );

  if (isLoading) {
    return (
      <View className="flex-1" style={{ backgroundColor: Colors.bg }}>
        <ProjectDetailTopBar onBack={() => navigation.goBack()} />
        <ApiStateView type="loading" />
      </View>
    );
  }

  if (errorMessage || !board) {
    return (
      <View className="flex-1" style={{ backgroundColor: Colors.bg }}>
        <ProjectDetailTopBar onBack={() => navigation.goBack()} />
        <ApiStateView
          type="error"
          message={errorMessage || 'Editor board not found'}
          onRetry={loadBoard}
        />
      </View>
    );
  }

  const lead = members.find((member) => member.role === 'Lead');
  const primaryProject = boardProjects[0];

  const performLeaveBoard = async () => {
    if (isLeavingBoard) return;

    setIsMoreMenuOpen(false);
    setIsLeavingBoard(true);
    try {
      await leaveEditorBoard(route.params.boardId);
      navigation.navigate('EditorBoards');
    } catch (error) {
      Alert.alert(
        'Cannot leave board',
        error instanceof Error ? error.message : 'Không thể rời editor board.',
      );
    } finally {
      setIsLeavingBoard(false);
    }
  };

  const handleOutPress = () => {
    setIsMoreMenuOpen(false);
    Alert.alert('Out', `Leave ${board.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Out', style: 'destructive', onPress: performLeaveBoard },
    ]);
  };

  const menuItems = [
    {
      label: 'Project',
      count: boardProjects.length,
      icon: 'folder',
      iconColor: '#FFFFFF',
      iconBg: Colors.accent,
      onPress: () =>
        boardProjects.length === 1 && primaryProject
          ? navigation.navigate('ProjectReport', { projectId: primaryProject.id })
          : navigation.navigate('EditorBoardProjects', { boardId: route.params.boardId }),
    },
    {
      label: 'Members',
      count: members.length,
      icon: 'group_add',
      iconColor: '#FFFFFF',
      iconBg: '#DB2777',
      onPress: () => navigation.navigate('EditorBoardMembers', { boardId: route.params.boardId }),
    },
    {
      label: 'Application',
      count: publishRequests.length,
      icon: 'apps',
      iconColor: '#FFFFFF',
      iconBg: '#22C55E',
      onPress: () =>
        navigation.navigate('EditorBoardApplications', { boardId: route.params.boardId }),
    },
  ];

  return (
    <View className="flex-1" style={{ backgroundColor: Colors.bg }}>
      <ProjectDetailTopBar
        onBack={() => navigation.goBack()}
        onMorePress={() => setIsMoreMenuOpen((value) => !value)}
      />

      {isMoreMenuOpen ? (
        <View
          className="absolute right-4 top-20 z-50 rounded-xl p-2"
          style={{
            backgroundColor: Colors.surface,
            borderColor: Colors.borderSubtle,
            borderWidth: 1,
          }}
        >
          <TouchableOpacity
            activeOpacity={0.76}
            accessibilityRole="button"
            disabled={isLeavingBoard}
            className="min-w-[132px] flex-row items-center rounded-lg px-3 py-3"
            onPress={handleOutPress}
            style={{ opacity: isLeavingBoard ? 0.56 : 1 }}
          >
            {isLeavingBoard ? (
              <ActivityIndicator color="#EF4444" size="small" />
            ) : (
              <MaterialIcon name="logout" color="#EF4444" size={18} />
            )}
            <Text className="ml-2 text-[14px] font-semibold" style={{ color: '#EF4444' }}>
              Out
            </Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 112 }}
        showsVerticalScrollIndicator={false}
      >
        <EditorBoardDetailHero
          description={board.description}
          leadName={lead?.name}
          name={board.name}
          role={board.currentUserRole}
          updatedAtLabel={board.updatedAtLabel}
        />

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
              count={item.count}
              onPress={item.onPress}
              isLast={index === menuItems.length - 1}
            />
          ))}
        </View>
      </ScrollView>

      <BottomNavBar activeTab="home" />
    </View>
  );
}
