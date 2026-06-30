import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import ApiStateView from '@/src/components/shared/ApiStateView';
import { RootStackNavProp } from '@/src/navigation/types';
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
  const [errorMessage, setErrorMessage] = useState('');

  const loadHome = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const result = await fetchHomeSummary();
      setWorkItems(result.workItems);
      setActivities(result.activities);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Không thể tải Home.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadHome();
  }, [loadHome]);

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
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false },
        )}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
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
            <TodayActivitySection activities={activities} />
          </>
        )}
      </Animated.ScrollView>

      <BottomNavBar
        activeTab="home"
        avatarUri="https://lh3.googleusercontent.com/aida-public/AB6AXuBvoZtwFybJZ9npCO41F6kO9bybsgqsNHyXJ2HW0hWsX9BSoeoMW65x6pH5JnYX_gQ1pZthmnVoQKkggIT8YoenvD235m0gTXlwjJYTB6EmUhqmXPelUkJQg6S4pHLTDtqDVtHmBIvPnU1lhUq-AyMvKO3opDCerwY85EIRqkDxaLCWiDJ_rxc3zQ6GCrTJWsCAmXjZfZDNI_tkghRo9fMzNNzl6rta9Z6fGbgxrYzVkcPzdefaqdaueVxSehW6S7q4LezAoU1vYqq9"
      />
    </View>
  );
}
