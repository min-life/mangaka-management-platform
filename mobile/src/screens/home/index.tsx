import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import ApiStateView from '@/src/components/shared/ApiStateView';
import AppRefreshControl from '@/src/components/shared/AppRefreshControl';
import { RootStackNavProp } from '@/src/navigation/types';
import { navigateToNotificationTarget } from '@/src/navigation/notificationTargetNavigation';
import { Colors } from '@/src/constants/colors';
import BottomNavBar from '@/src/components/shared/BottomNavBar';
import { fetchHomeSummary } from '@/src/services/homeApi';
import { ActivityItem, WorkItem } from '@/src/types/home';
import HomeSectionTitle from './components/HomeSectionTitle';
import HomeTopBar from './components/HomeTopBar';
import TodayActivitySection from './components/TodayActivitySection';
import WorkItemsSection from './components/WorkItemsSection';

export default function HomeScreen() {
  const navigation = useNavigation<RootStackNavProp>();
  const scrollY = useRef(new Animated.Value(0)).current;
  const [workItems, setWorkItems] = useState<WorkItem[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const loadHome = useCallback(async (options: { showLoading?: boolean } = {}) => {
    const showLoading = options.showLoading ?? true;
    if (showLoading) setIsLoading(true);
    else setIsRefreshing(true);
    setErrorMessage('');

    try {
      const result = await fetchHomeSummary();
      setWorkItems(result.workItems);
      setActivities(result.activities);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Không thể tải Home.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadHome();
  }, [loadHome]);

  const handleRefresh = useCallback(() => {
    void loadHome({ showLoading: false });
  }, [loadHome]);

  const handleActivityPress = useCallback(
    (activity: ActivityItem) => {
      navigateToNotificationTarget(navigation, activity.target);
    },
    [navigation],
  );

  const headerBg = scrollY.interpolate({
    inputRange: [0, 20],
    outputRange: ['rgba(34,40,49,0.95)', 'rgba(34,40,49,0.99)'],
    extrapolate: 'clamp',
  });

  return (
    <View className="flex-1" style={{ backgroundColor: Colors.bg }}>
      <HomeTopBar headerBg={headerBg} />

      <Animated.ScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 16, paddingBottom: 112 }}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
          useNativeDriver: false,
        })}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        // style={{ flex: 1 }}
        // refreshControl={
        //   <AppRefreshControl onRefresh={handleRefresh} refreshing={isRefreshing} />
        // }
      >
        <HomeSectionTitle />
        {isLoading ? (
          <ApiStateView type="loading" />
        ) : errorMessage ? (
          <ApiStateView type="error" message={errorMessage} onRetry={loadHome} />
        ) : (
          <>
            <WorkItemsSection
              workItems={workItems}
              onApplicationsPress={() => navigation.navigate('Applications')}
              onEditorBoardsPress={() => navigation.navigate('EditorBoards')}
              onTasksPress={() => navigation.navigate('Tasks')}
              onProjectsPress={() => navigation.navigate('Projects')}
            />
            <TodayActivitySection activities={activities} onActivityPress={handleActivityPress} />
          </>
        )}
      </Animated.ScrollView>

      <BottomNavBar activeTab="home" />
    </View>
  );
}
