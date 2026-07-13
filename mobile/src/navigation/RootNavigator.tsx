import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';
import { flushPendingNavigationReset, navigationRef } from './navigationRef';

import HomeScreen from '@/src/screens/home';
import TasksScreen from '@/src/screens/tasks';
import ProjectsScreen from '@/src/screens/projects';
import ProjectDetailScreen from '@/src/screens/projectDetail';
import ProjectContributorsScreen from '@/src/screens/projectContributors';
import ProjectReportScreen from '@/src/screens/projectReport';
import ApplicationsScreen from '@/src/screens/applications';
import ApplicationDetailScreen from '@/src/screens/applicationDetail';
import EditorBoardsScreen from '@/src/screens/editorBoards';
import EditorBoardDetailScreen from '@/src/screens/editorBoardDetail';
import EditorBoardProjectsScreen from '@/src/screens/editorBoardProjects';
import EditorBoardMembersScreen from '@/src/screens/editorBoardMembers';
import EditorBoardApplicationsScreen from '@/src/screens/editorBoardApplications';
import ResourcesScreen from '@/src/screens/resources';
import ResourceFolderDetailScreen from '@/src/screens/resourceFolderDetail';
import ResourceFileScreen from '@/src/screens/resourceFile';
import TaskDetailScreen from '@/src/screens/taskDetail';
import ProfileScreen from '@/src/screens/profile';
import NotificationsScreen from '@/src/screens/notifications';
import LoginScreen from '@/src/screens/login';
import ForgotPasswordScreen from '@/src/screens/forgotPassword';

const Stack = createNativeStackNavigator<RootStackParamList>();

/**
 * RootNavigator — Bộ điều hướng chính của app.
 *
 * Thêm màn hình mới:
 *   1. Khai báo type trong `types.ts`
 *   2. Import screen component
 *   3. Thêm <Stack.Screen> bên dưới
 */
export default function RootNavigator() {
  return (
    <NavigationContainer ref={navigationRef} onReady={flushPendingNavigationReset}>
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{
          // Ẩn header mặc định — mỗi screen tự quản lý header riêng
          headerShown: false,
          // Chuyen man hinh nhe hon, tranh cam giac truot ngang gay mat tap trung
          animation: 'fade',
          // Màu nền khi transition
          contentStyle: { backgroundColor: '#222831' },
        }}
      >
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Tasks" component={TasksScreen} />
        <Stack.Screen name="Projects" component={ProjectsScreen} />
        <Stack.Screen name="ProjectDetail" component={ProjectDetailScreen} />
        <Stack.Screen name="ProjectContributors" component={ProjectContributorsScreen} />
        <Stack.Screen name="ProjectReport" component={ProjectReportScreen} />
        <Stack.Screen name="Applications" component={ApplicationsScreen} />
        <Stack.Screen name="ApplicationDetail" component={ApplicationDetailScreen} />
        <Stack.Screen name="EditorBoards" component={EditorBoardsScreen} />
        <Stack.Screen name="EditorBoardDetail" component={EditorBoardDetailScreen} />
        <Stack.Screen name="EditorBoardProjects" component={EditorBoardProjectsScreen} />
        <Stack.Screen name="EditorBoardMembers" component={EditorBoardMembersScreen} />
        <Stack.Screen name="EditorBoardApplications" component={EditorBoardApplicationsScreen} />
        <Stack.Screen name="Resources" component={ResourcesScreen} />
        <Stack.Screen name="ResourceFolderDetail" component={ResourceFolderDetailScreen} />
        <Stack.Screen name="ResourceFile" component={ResourceFileScreen} />
        <Stack.Screen name="TaskDetail" component={TaskDetailScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="Notifications" component={NotificationsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
