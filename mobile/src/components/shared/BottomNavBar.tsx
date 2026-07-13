import React, { useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import MaterialIcon from '@/src/components/shared/MaterialIcon';
import { Colors } from '@/src/constants/colors';
import { RootStackNavProp, RootStackParamList } from '@/src/navigation/types';
import { fetchNotifications } from '@/src/services/notificationApi';

export type BottomTab = 'inbox' | 'home' | 'profile';
type BottomTabRoute = keyof Pick<RootStackParamList, 'Home' | 'Notifications' | 'Profile'>;

interface BottomNavBarProps {
  activeTab?: BottomTab;
  avatarUri?: string;
  unreadInboxCount?: number;
}

const TABS: Array<{
  key: BottomTab;
  label: string;
  icon: string;
  route: BottomTabRoute;
}> = [
  { key: 'inbox', label: 'Inbox', icon: 'mail', route: 'Notifications' },
  { key: 'home', label: 'Home', icon: 'dashboard', route: 'Home' },
  { key: 'profile', label: 'Profile', icon: 'person', route: 'Profile' },
];

const BAR_BACKGROUND = Colors.bg;
const ACTIVE_ICON_COLOR = '#1F2329';
const INACTIVE_ICON_COLOR = 'rgba(237,241,251,0.56)';
const INACTIVE_ICON_BG = 'rgba(237,241,251,0.08)';
const ACTIVE_ICON_BORDER = 'rgba(255,255,255,0.34)';

function UnreadBadge({ count }: { count: number }) {
  if (count <= 0) return null;

  const label = count > 99 ? '99+' : String(count);

  return (
    <View
      className="items-center justify-center"
      style={{
        backgroundColor: Colors.iconTask,
        borderColor: BAR_BACKGROUND,
        borderRadius: 999,
        borderWidth: 1.5,
        height: 18,
        minWidth: label.length > 2 ? 24 : 18,
        paddingHorizontal: label.length > 1 ? 4 : 0,
        position: 'absolute',
        right: 5,
        top: -5,
      }}
    >
      <Text
        className="text-[9px] font-bold"
        numberOfLines={1}
        style={{
          color: '#FFFFFF',
          fontVariant: ['tabular-nums'],
          letterSpacing: 0,
        }}
      >
        {label}
      </Text>
    </View>
  );
}

function TabIcon({
  avatarUri,
  icon,
  isActive,
  isProfile,
}: {
  avatarUri?: string;
  icon: string;
  isActive: boolean;
  isProfile: boolean;
}) {
  if (isProfile && avatarUri) {
    return (
      <View
        className="h-8 w-8 overflow-hidden rounded-full"
        style={{
          borderColor: isActive ? Colors.accent : Colors.borderFaint,
          borderWidth: isActive ? 2 : 1,
        }}
      >
        <Image
          source={{ uri: avatarUri }}
          className="h-full w-full"
          style={{ resizeMode: 'cover' }}
        />
      </View>
    );
  }

  return (
    <View
      className="h-8 w-8 items-center justify-center rounded-full"
      style={{
        backgroundColor: isActive ? Colors.accent : INACTIVE_ICON_BG,
        borderColor: isActive ? ACTIVE_ICON_BORDER : 'transparent',
        borderWidth: isActive ? 1 : 0,
      }}
    >
      <MaterialIcon
        name={icon}
        color={isActive ? ACTIVE_ICON_COLOR : INACTIVE_ICON_COLOR}
        size={18}
      />
    </View>
  );
}

function BottomNavItem({
  avatarUri,
  isActive,
  onPress,
  tab,
  unreadCount,
}: {
  avatarUri?: string;
  isActive: boolean;
  onPress: () => void;
  tab: (typeof TABS)[number];
  unreadCount: number;
}) {
  const showUnreadBadge = tab.key === 'inbox' && unreadCount > 0;

  return (
    <TouchableOpacity
      activeOpacity={0.78}
      accessibilityLabel={
        showUnreadBadge ? `${tab.label}, ${unreadCount} unread notifications` : tab.label
      }
      accessibilityRole="button"
      accessibilityState={{ selected: isActive }}
      onPress={onPress}
      className="min-w-0 flex-1 items-center justify-center"
      style={{ height: 48 }}
    >
      <View className="relative h-8 w-[58px] items-center justify-center">
        <TabIcon
          avatarUri={avatarUri}
          icon={tab.icon}
          isActive={isActive}
          isProfile={tab.key === 'profile'}
        />
        {showUnreadBadge ? <UnreadBadge count={unreadCount} /> : null}
      </View>

      <Text
        className="text-[10px] font-semibold"
        numberOfLines={1}
        style={{
          color: isActive ? Colors.accent : Colors.textMuted,
          letterSpacing: 0,
          maxWidth: 68,
        }}
      >
        {tab.label}
      </Text>
    </TouchableOpacity>
  );
}

export default function BottomNavBar({
  activeTab = 'home',
  avatarUri,
  unreadInboxCount,
}: BottomNavBarProps) {
  const navigation = useNavigation<RootStackNavProp>();
  const [fetchedUnreadCount, setFetchedUnreadCount] = useState(0);

  useFocusEffect(
    useCallback(() => {
      if (unreadInboxCount !== undefined) return undefined;

      let isActive = true;

      void fetchNotifications()
        .then((result) => {
          if (!isActive) return;
          setFetchedUnreadCount(result.items.filter((item) => item.isUnread).length);
        })
        .catch(() => {
          if (isActive) setFetchedUnreadCount(0);
        });

      return () => {
        isActive = false;
      };
    }, [unreadInboxCount]),
  );

  const handlePress = (route: BottomTabRoute) => {
    navigation.navigate(route);
  };

  const resolvedUnreadCount = unreadInboxCount ?? fetchedUnreadCount;

  return (
    <SafeAreaView
      edges={['bottom']}
      style={{
        backgroundColor: Colors.bg,
        borderColor: Colors.borderSubtle,
        borderTopWidth: 1,
        bottom: 0,
        elevation: 24,
        left: 0,
        position: 'absolute',
        right: 0,
        zIndex: 24,
      }}
    >
      <View
        className="w-full px-3 pb-0 pt-1"
        style={{
          boxShadow: '0 -8px 22px rgba(0, 0, 0, 0.28)',
        }}
      >
        <View className="flex-row items-center justify-between">
          {TABS.map((tab) => (
            <BottomNavItem
              key={tab.key}
              avatarUri={avatarUri}
              isActive={activeTab === tab.key}
              onPress={() => handlePress(tab.route)}
              tab={tab}
              unreadCount={resolvedUnreadCount}
            />
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}
