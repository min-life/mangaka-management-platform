import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import ApiStateView from '@/src/components/shared/ApiStateView';
import { RootStackNavProp } from '@/src/navigation/types';
import { Colors } from '@/src/constants/colors';
import BottomNavBar from '@/src/components/shared/BottomNavBar';
import { logout } from '@/src/services/authApi';
import { disconnectRealtime } from '@/src/services/realtimeClient';
import { clearAccessToken, getAccessToken } from '@/src/services/tokenStorage';
import { fetchMe, updateMe, updatePassword } from '@/src/services/userApi';
import { AccountMenuItem } from '@/src/types/profile';
import {
  ProfileFormModal,
  ProfileHeaderSection,
  ProfileMenuSection,
  ProfileTopBar,
} from './components';

const ACCOUNT_MENU_ITEMS: AccountMenuItem[] = [
  { id: 'info', icon: 'person', label: 'Personal Information' },
  { id: 'security', icon: 'security', label: 'Security' },
  { id: 'logout', icon: 'logout', label: 'Sign Out', isDestructive: true },
];

type ActiveProfileForm = 'profile' | 'security' | null;

const EMPTY_PASSWORD_FORM = {
  confirmPassword: '',
  currentPassword: '',
  newPassword: '',
};

export default function ProfileScreen() {
  const navigation = useNavigation<RootStackNavProp>();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [user, setUser] = useState<Awaited<ReturnType<typeof fetchMe>> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [activeForm, setActiveForm] = useState<ActiveProfileForm>(null);
  const [formErrorMessage, setFormErrorMessage] = useState('');
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);
  const [profileForm, setProfileForm] = useState({ avatarUrl: '', displayName: '' });
  const [passwordForm, setPasswordForm] = useState(EMPTY_PASSWORD_FORM);

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

  const roleLabel = useMemo(() => {
    const primaryRole = user?.roles?.[0];
    return primaryRole?.name || primaryRole?.code || 'Viewer';
  }, [user?.roles]);

  const openProfileForm = () => {
    setFormErrorMessage('');
    setProfileForm({
      avatarUrl: user?.avatarUrl ?? '',
      displayName: user?.displayName ?? '',
    });
    setActiveForm('profile');
  };

  const openSecurityForm = () => {
    setFormErrorMessage('');
    setPasswordForm(EMPTY_PASSWORD_FORM);
    setActiveForm('security');
  };

  const closeForm = () => {
    if (isSubmittingForm) return;
    setActiveForm(null);
    setFormErrorMessage('');
  };

  const handleProfileFieldChange = (id: string, value: string) => {
    setProfileForm((current) => ({ ...current, [id]: value }));
  };

  const handlePasswordFieldChange = (id: string, value: string) => {
    setPasswordForm((current) => ({ ...current, [id]: value }));
  };

  const handleSubmitProfile = async () => {
    const displayName = profileForm.displayName.trim();
    const avatarUrl = profileForm.avatarUrl.trim();

    if (displayName && displayName.length < 5) {
      setFormErrorMessage('Display name phải có ít nhất 5 ký tự.');
      return;
    }

    if (!displayName && !avatarUrl) {
      setFormErrorMessage('Vui lòng nhập display name hoặc avatar URL.');
      return;
    }

    setIsSubmittingForm(true);
    setFormErrorMessage('');

    try {
      const nextUser = await updateMe({
        avatarUrl: avatarUrl || undefined,
        displayName: displayName || undefined,
      });

      setUser((currentUser) => ({
        ...currentUser,
        ...nextUser,
        roles: nextUser.roles ?? currentUser?.roles,
      }));
      setActiveForm(null);
      Alert.alert('Updated', 'Personal information has been updated.');
    } catch (error) {
      setFormErrorMessage(
        error instanceof Error ? error.message : 'Không thể cập nhật profile.',
      );
    } finally {
      setIsSubmittingForm(false);
    }
  };

  const handleSubmitPassword = async () => {
    if (!passwordForm.currentPassword) {
      setFormErrorMessage('Vui lòng nhập mật khẩu hiện tại.');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setFormErrorMessage('Mật khẩu mới phải có ít nhất 6 ký tự.');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setFormErrorMessage('Mật khẩu xác nhận không khớp.');
      return;
    }

    setIsSubmittingForm(true);
    setFormErrorMessage('');

    try {
      await updatePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });

      setPasswordForm(EMPTY_PASSWORD_FORM);
      setActiveForm(null);
      Alert.alert('Updated', 'Password has been changed.');
    } catch (error) {
      setFormErrorMessage(
        error instanceof Error ? error.message : 'Không thể cập nhật mật khẩu.',
      );
    } finally {
      setIsSubmittingForm(false);
    }
  };

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
      disconnectRealtime();
      await clearAccessToken();
      setIsSigningOut(false);
      navigation.replace('Login');
    }
  };

  const handleMenuPress = (id: string) => {
    if (id === 'info') return openProfileForm();
    if (id === 'security') return openSecurityForm();
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
            roleLabel={roleLabel}
          />
        )}

        <ProfileMenuSection
          title="Account"
          items={ACCOUNT_MENU_ITEMS}
          onItemPress={handleMenuPress}
        />
      </ScrollView>

      <ProfileFormModal
        errorMessage={formErrorMessage}
        fields={[
          {
            autoCapitalize: 'none',
            editable: false,
            id: 'email',
            keyboardType: 'email-address',
            label: 'Email',
            value: user?.email ?? '',
          },
          {
            id: 'displayName',
            label: 'Display name',
            placeholder: 'Your display name',
            value: profileForm.displayName,
          },
          {
            autoCapitalize: 'none',
            id: 'avatarUrl',
            keyboardType: 'url',
            label: 'Avatar URL',
            placeholder: 'https://example.com/avatar.png',
            value: profileForm.avatarUrl,
          },
        ]}
        isSubmitting={isSubmittingForm}
        onChangeField={handleProfileFieldChange}
        onClose={closeForm}
        onSubmit={handleSubmitProfile}
        submitLabel="Save"
        subtitle="Update basic account details."
        title="Personal Information"
        visible={activeForm === 'profile'}
      />

      <ProfileFormModal
        errorMessage={formErrorMessage}
        fields={[
          {
            id: 'currentPassword',
            label: 'Current password',
            placeholder: 'Enter current password',
            secureTextEntry: true,
            textContentType: 'password',
            value: passwordForm.currentPassword,
          },
          {
            id: 'newPassword',
            label: 'New password',
            placeholder: 'Enter new password',
            secureTextEntry: true,
            textContentType: 'newPassword',
            value: passwordForm.newPassword,
          },
          {
            id: 'confirmPassword',
            label: 'Confirm password',
            placeholder: 'Confirm new password',
            secureTextEntry: true,
            textContentType: 'newPassword',
            value: passwordForm.confirmPassword,
          },
        ]}
        isSubmitting={isSubmittingForm}
        onChangeField={handlePasswordFieldChange}
        onClose={closeForm}
        onSubmit={handleSubmitPassword}
        submitLabel="Change"
        subtitle="Change your account password."
        title="Security"
        visible={activeForm === 'security'}
      />

      <BottomNavBar activeTab="profile" />
    </View>
  );
}
