import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';

import HomeScreen from '@/src/screens/home';
import TasksScreen from '@/src/screens/tasks';
import TaskDetailScreen from '@/src/screens/taskDetail';
import ProfileScreen from '@/src/screens/profile';
import NotificationsScreen from '@/src/screens/notifications';
import LoginScreen from '@/src/screens/login';

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
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{
          // Ẩn header mặc định — mỗi screen tự quản lý header riêng
          headerShown: false,
          // Animation giống iOS native
          animation: 'slide_from_right',
          // Màu nền khi transition
          contentStyle: { backgroundColor: '#222831' },
        }}
      >
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Tasks" component={TasksScreen} />
        <Stack.Screen name="TaskDetail" component={TaskDetailScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="Notifications" component={NotificationsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
