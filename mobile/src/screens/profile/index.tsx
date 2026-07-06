import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';

import ApiStateView from '@/src/components/shared/ApiStateView';
import { navigateToNotificationTarget } from '@/src/navigation/notificationTargetNavigation';
import { RootStackNavProp } from '@/src/navigation/types';
import { Colors } from '@/src/constants/colors';
import BottomNavBar from '@/src/components/shared/BottomNavBar';
import { logout } from '@/src/services/authApi';
import { disconnectRealtime } from '@/src/services/realtimeClient';
import { clearAccessToken, getAccessToken } from '@/src/services/tokenStorage';
import {
  ActivityLogFilterOption,
  ActivityLogFilterType,
  fetchActivityLogFilterOptions,
  fetchActivityLogs,
} from '@/src/services/activityLogApi';
import { fetchMe, updateMe, updatePassword } from '@/src/services/userApi';
import { uploadAvatarToCloudinary } from '@/src/services/cloudinaryUpload';
import { ActivityItem } from '@/src/types/home';
import { AccountMenuItem } from '@/src/types/profile';
import {
  ProfileActivitySection,
  ProfileFormModal,
  ProfileHeaderSection,
  ProfileMenuSection,
  ProfileTopBar,
} from './components';

const ACCOUNT_MENU_ITEMS: AccountMenuItem[] = [
  { id: 'security', icon: 'security', label: 'Security' },
  { id: 'logout', icon: 'logout', label: 'Sign Out', isDestructive: true },
];

type ActiveProfileForm = 'displayName' | 'security' | null;

const EMPTY_PASSWORD_FORM = {
  confirmPassword: '',
  currentPassword: '',
  newPassword: '',
};

const EMPTY_ACTIVITY_FILTER_OPTIONS: Record<ActivityLogFilterType, ActivityLogFilterOption[]> = {
  editorBoard: [],
  file: [],
  project: [],
};

export default function ProfileScreen() {
  const navigation = useNavigation<RootStackNavProp>();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [user, setUser] = useState<Awaited<ReturnType<typeof fetchMe>> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [activityErrorMessage, setActivityErrorMessage] = useState('');
  const [activityFilterType, setActivityFilterType] = useState<ActivityLogFilterType | null>(null);
  const [activityFilterId, setActivityFilterId] = useState<string | null>(null);
  const [activityFilterOptions, setActivityFilterOptions] = useState(
    EMPTY_ACTIVITY_FILTER_OPTIONS,
  );
  const [isActivityFilterLoading, setIsActivityFilterLoading] = useState(false);
  const [isActivityLoading, setIsActivityLoading] = useState(true);
  const [activeForm, setActiveForm] = useState<ActiveProfileForm>(null);
  const [formErrorMessage, setFormErrorMessage] = useState('');
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [displayNameForm, setDisplayNameForm] = useState({ displayName: '' });
  const [passwordForm, setPasswordForm] = useState(EMPTY_PASSWORD_FORM);

  const loadActivityLogs = useCallback(
    async (filter: { id?: string | null; type?: ActivityLogFilterType | null } = {}) => {
      const nextType = filter.type === undefined ? activityFilterType : filter.type;
      const nextId = filter.id === undefined ? activityFilterId : filter.id;

      setIsActivityLoading(true);
      setActivityErrorMessage('');

      try {
        const activityResult = await fetchActivityLogs({
          editorBoardId: nextType === 'editorBoard' ? nextId : undefined,
          fileId: nextType === 'file' ? nextId : undefined,
          limit: 5,
          projectId: nextType === 'project' ? nextId : undefined,
        });
        setActivities(activityResult.activities);
      } catch (error) {
        setActivityErrorMessage(
          error instanceof Error ? error.message : 'Unable to load activity logs.',
        );
      } finally {
        setIsActivityLoading(false);
      }
    },
    [activityFilterId, activityFilterType],
  );

  const ensureActivityFilterOptions = useCallback(
    async (type: ActivityLogFilterType) => {
      if (activityFilterOptions[type].length > 0) return;

      setIsActivityFilterLoading(true);

      try {
        const options = await fetchActivityLogFilterOptions(type);
        setActivityFilterOptions((current) => ({
          ...current,
          [type]: options,
        }));
      } catch (error) {
        setActivityErrorMessage(
          error instanceof Error ? error.message : 'Unable to load filter options.',
        );
      } finally {
        setIsActivityFilterLoading(false);
      }
    },
    [activityFilterOptions],
  );

  const loadProfile = useCallback(async () => {
    setIsLoading(true);
    setIsActivityLoading(true);
    setErrorMessage('');
    setActivityErrorMessage('');

    try {
      const nextUser = await fetchMe();
      setUser(nextUser);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to load profile.');
    } finally {
      setIsLoading(false);
    }

    try {
      const activityResult = await fetchActivityLogs({ limit: 5 });
      setActivities(activityResult.activities);
    } catch (error) {
      setActivityErrorMessage(
        error instanceof Error ? error.message : 'Unable to load activity logs.',
      );
    } finally {
      setIsActivityLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const handleActivityFilterTypeChange = useCallback(
    (type: ActivityLogFilterType | null) => {
      setActivityFilterType(type);
      setActivityFilterId(null);

      if (type) {
        void ensureActivityFilterOptions(type);
      }

      void loadActivityLogs({ id: null, type });
    },
    [ensureActivityFilterOptions, loadActivityLogs],
  );

  const handleActivityFilterOptionChange = useCallback(
    (optionId: string | null) => {
      setActivityFilterId(optionId);
      void loadActivityLogs({ id: optionId, type: activityFilterType });
    },
    [activityFilterType, loadActivityLogs],
  );

  const handleActivityPress = useCallback(
    (activity: ActivityItem) => {
      navigateToNotificationTarget(navigation, activity.target);
    },
    [navigation],
  );

  const roleLabel = useMemo(() => {
    const primaryRole = user?.roles?.[0];
    return primaryRole?.name || primaryRole?.code || 'Viewer';
  }, [user?.roles]);

  const openDisplayNameForm = () => {
    setFormErrorMessage('');
    setDisplayNameForm({
      displayName: user?.displayName ?? '',
    });
    setActiveForm('displayName');
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

  const handleDisplayNameFieldChange = (id: string, value: string) => {
    setDisplayNameForm((current) => ({ ...current, [id]: value }));
  };

  const handlePasswordFieldChange = (id: string, value: string) => {
    setPasswordForm((current) => ({ ...current, [id]: value }));
  };

  const mergeUser = (nextUser: Awaited<ReturnType<typeof updateMe>>) => {
    setUser((currentUser) => ({
      ...currentUser,
      ...nextUser,
      roles: nextUser.roles ?? currentUser?.roles,
    }));
  };

  const handleSubmitDisplayName = async () => {
    const displayName = displayNameForm.displayName.trim();

    if (displayName && displayName.length < 5) {
      setFormErrorMessage('Display name must be at least 5 characters.');
      return;
    }

    if (!displayName) {
      setFormErrorMessage('Please enter a display name.');
      return;
    }

    setIsSubmittingForm(true);
    setFormErrorMessage('');

    try {
      const nextUser = await updateMe({
        displayName,
      });

      mergeUser(nextUser);
      setActiveForm(null);
      Alert.alert('Đã cập nhật', 'Tên hiển thị đã được thay đổi.');
      void loadActivityLogs();
    } catch (error) {
      setFormErrorMessage(
        error instanceof Error ? error.message : 'Unable to update display name.',
      );
    } finally {
      setIsSubmittingForm(false);
    }
  };

  const handlePickAvatar = async () => {
    if (isUploadingAvatar) return;

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission required', 'Please allow access to your photo library.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
    });

    if (result.canceled || !result.assets[0]) return;

    setIsUploadingAvatar(true);

    try {
      const avatarUrl = await uploadAvatarToCloudinary(result.assets[0]);
      const nextUser = await updateMe({ avatarUrl });
      mergeUser(nextUser);
      Alert.alert('Đã cập nhật', 'Ảnh đại diện đã được thay đổi.');
      void loadActivityLogs();
    } catch (error) {
      Alert.alert(
        'Unable to update avatar',
        error instanceof Error ? error.message : 'Please try again.',
      );
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleSubmitPassword = async () => {
    if (!passwordForm.currentPassword) {
      setFormErrorMessage('Please enter your current password.');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setFormErrorMessage('New password must be at least 6 characters.');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setFormErrorMessage('Password confirmation does not match.');
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
      void loadActivityLogs();
    } catch (error) {
      setFormErrorMessage(
        error instanceof Error ? error.message : 'Unable to update password.',
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
            isAvatarUploading={isUploadingAvatar}
            name={user?.displayName}
            onAvatarPress={handlePickAvatar}
            onEditNamePress={openDisplayNameForm}
            roleLabel={roleLabel}
          />
        )}

        <ProfileMenuSection
          title="Account"
          items={ACCOUNT_MENU_ITEMS}
          onItemPress={handleMenuPress}
        />

        {!isLoading && !errorMessage ? (
          <ProfileActivitySection
            activities={activities}
            errorMessage={activityErrorMessage}
            filterOptions={activityFilterType ? activityFilterOptions[activityFilterType] : []}
            filterType={activityFilterType}
            isFilterLoading={isActivityFilterLoading}
            isLoading={isActivityLoading}
            onActivityPress={handleActivityPress}
            onFilterOptionChange={handleActivityFilterOptionChange}
            onFilterTypeChange={handleActivityFilterTypeChange}
            selectedFilterId={activityFilterId}
          />
        ) : null}
      </ScrollView>

      <ProfileFormModal
        errorMessage={formErrorMessage}
        fields={[
          {
            id: 'displayName',
            label: 'Display name',
            placeholder: 'Your display name',
            value: displayNameForm.displayName,
          },
        ]}
        isSubmitting={isSubmittingForm}
        onChangeField={handleDisplayNameFieldChange}
        onClose={closeForm}
        onSubmit={handleSubmitDisplayName}
        submitLabel="Save"
        subtitle="Cập nhật tên hiển thị trên hồ sơ của bạn."
        title="Đổi tên"
        visible={activeForm === 'displayName'}
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
