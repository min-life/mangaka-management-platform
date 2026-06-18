import React, { useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { RootStackNavProp } from '@/src/navigation/types';
import { Colors } from '@/src/constants/colors';
import { ACCOUNT_MENU_ITEMS } from '@/src/constants/profileData';
import BottomNavBar from '@/src/components/shared/BottomNavBar';
import { logout } from '@/src/services/authApi';
import { clearAccessToken, getAccessToken } from '@/src/services/tokenStorage';
import { ProfileHeaderSection, ProfileMenuSection, ProfileTopBar } from './components';

export default function ProfileScreen() {
  const navigation = useNavigation<RootStackNavProp>();
  const [isSigningOut, setIsSigningOut] = useState(false);

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
        <ProfileHeaderSection />

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
