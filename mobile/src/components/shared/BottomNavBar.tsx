import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import MaterialIcon from '@/src/components/shared/MaterialIcon';
import { Colors } from '@/src/constants/colors';
import { RootStackNavProp, RootStackParamList } from '@/src/navigation/types';

export type BottomTab = 'inbox' | 'home' | 'profile';

interface BottomNavBarProps {
  activeTab?: BottomTab;
  avatarUri?: string;
}

const TABS: Array<{
  key: BottomTab;
  label: string;
  icon: string;
  route: keyof Pick<RootStackParamList, 'Home' | 'Notifications' | 'Profile'>;
}> = [
  { key: 'inbox', label: 'Inbox', icon: 'mail', route: 'Notifications' },
  { key: 'home', label: 'Home', icon: 'dashboard', route: 'Home' },
  { key: 'profile', label: 'Profile', icon: 'person', route: 'Profile' },
];

export default function BottomNavBar({
  activeTab = 'home',
  avatarUri,
}: BottomNavBarProps) {
  const navigation = useNavigation<RootStackNavProp>();

  const handlePress = (tab: BottomTab) => {
    const target = TABS.find((item) => item.key === tab);
    if (target) {
      navigation.navigate(target.route);
    }
  };

  const activeColor = '#1F2329';
  const inactiveColor = Colors.textPlaceholder;

  return (
    <SafeAreaView
      edges={['bottom']}
      style={{
        backgroundColor: 'transparent',
        bottom: 0,
        elevation: 24,
        left: 0,
        position: 'absolute',
        right: 0,
        zIndex: 24,
      }}
    >
      <View className="px-4 pb-2 pt-2">
        <View
          className="flex-row items-center justify-between rounded-full px-2 py-2"
          style={{
            backgroundColor: 'rgba(57, 62, 70, 0.96)',
            borderWidth: 1,
            borderColor: Colors.borderFaint,
            boxShadow: '0 12px 28px rgba(0, 0, 0, 0.34)',
          }}
        >
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            const iconColor = isActive ? activeColor : inactiveColor;
            const textColor = isActive ? activeColor : Colors.textMuted;

            return (
              <TouchableOpacity
                key={tab.key}
                activeOpacity={0.78}
                onPress={() => handlePress(tab.key)}
                className="min-w-0 flex-1 flex-row items-center justify-center rounded-full"
                style={{
                  height: 48,
                  gap: 7,
                  backgroundColor: isActive ? Colors.accent : 'transparent',
                  borderWidth: isActive ? 1 : 0,
                  borderColor: isActive ? 'rgba(255, 255, 255, 0.38)' : 'transparent',
                }}
              >
                {tab.key === 'profile' && avatarUri ? (
                  <View
                    className="h-7 w-7 overflow-hidden rounded-full"
                    style={{
                      borderWidth: 1,
                      borderColor: isActive ? 'rgba(31, 35, 41, 0.2)' : Colors.borderFaint,
                    }}
                  >
                    <Image
                      source={{ uri: avatarUri }}
                      className="h-full w-full"
                      style={{ resizeMode: 'cover' }}
                    />
                  </View>
                ) : (
                  <View
                    className="h-7 w-7 items-center justify-center rounded-full"
                    style={{
                      backgroundColor: isActive
                        ? 'rgba(31, 35, 41, 0.1)'
                        : 'rgba(237, 241, 251, 0.08)',
                    }}
                  >
                    <MaterialIcon name={tab.icon} color={iconColor} size={18} />
                  </View>
                )}
                <Text
                  className="text-[11px] font-semibold"
                  numberOfLines={1}
                  style={{
                    color: textColor,
                    letterSpacing: 0,
                    maxWidth: 58,
                  }}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </SafeAreaView>
  );
}
