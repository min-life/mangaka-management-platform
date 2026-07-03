import React, { useCallback, useEffect, useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import ApiStateView from '@/src/components/shared/ApiStateView';
import { RootStackNavProp } from '@/src/navigation/types';
import { Colors } from '@/src/constants/colors';
import BottomNavBar from '@/src/components/shared/BottomNavBar';
import { logout } from '@/src/services/authApi';
import { clearAccessToken, getAccessToken } from '@/src/services/tokenStorage';
import { fetchMe } from '@/src/services/userApi';
import { AccountMenuItem } from '@/src/types/profile';
import { ProfileHeaderSection, ProfileMenuSection, ProfileTopBar } from './components';

const ACCOUNT_MENU_ITEMS: AccountMenuItem[] = [
  { id: 'info', icon: 'person', label: 'Personal Information' },
  { id: 'notifs', icon: 'notifications', label: 'Notifications' },
  { id: 'security', icon: 'security', label: 'Security' },
  { id: 'appearance', icon: 'palette', label: 'Appearance' },
  { id: 'help', icon: 'help', label: 'Help & Support' },
  { id: 'logout', icon: 'logout', label: 'Sign Out', isDestructive: true },
];

export default function ProfileScreen() {
  const navigation = useNavigation<RootStackNavProp>();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [user, setUser] = useState<Awaited<ReturnType<typeof fetchMe>> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const loadProfile = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      setUser(await fetchMe());
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Không thể tải profile.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const performSignOut = async () => {
    if (isSigningOut) return;

    setIsSigningOut(true);

    try {
      const accessToken = await getAccessToken();
      await logout(accessToken);
    } catch (error) {
      console.warn(
        '[ProfileScreen] Server logout failed; clearing local session.',
        error,
      );
    } finally {
      await clearAccessToken();
      setIsSigningOut(false);
      navigation.replace('Login');
    }
  };

  const handleMenuPress = (id: string) => {
    if (id === 'tasks') return navigation.navigate('Tasks');
    if (id === 'logout' && !isSigningOut)
      return Alert.alert('Sign Out', 'Are you sure?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: performSignOut },
      ]);
  };

  return (
    <View className="flex-1" style={{ backgroundColor: Colors.bg }}>
      <ProfileTopBar />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100, gap: 12 }}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <ApiStateView type="loading" />
        ) : errorMessage ? (
          <ApiStateView type="error" message={errorMessage} onRetry={loadProfile} />
        ) : (
          <ProfileHeaderSection
            avatarUri={user?.avatarUrl}
            email={user?.email}
            name={user?.displayName}
          />
        )}

        <ProfileMenuSection
          title="Account"
          items={ACCOUNT_MENU_ITEMS}
          onItemPress={handleMenuPress}
        />
      </ScrollView>

      <BottomNavBar activeTab="profile" />
    </View>
  );
}
