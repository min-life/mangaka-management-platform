import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import MaterialIcon from '@/src/components/shared/MaterialIcon';
import { Colors } from '@/src/constants/colors';
import { RootStackNavProp } from '@/src/navigation/types';

export type BottomTab = 'inbox' | 'home' | 'profile';

interface BottomNavBarProps {
  activeTab?: BottomTab;
  avatarUri?: string;
}

/**
 * BottomNavBar — Thanh điều hướng dưới cùng dùng chung cho toàn app.
 * Tự navigate bằng useNavigation — không cần truyền onTabPress từ ngoài.
 * Tab "Home" được nâng lên (elevated pill) giống mẫu Stitch.
 */
export default function BottomNavBar({
  activeTab = 'home',
  avatarUri,
}: BottomNavBarProps) {
  const navigation = useNavigation<RootStackNavProp>();

  const handlePress = (tab: BottomTab) => {
    if (tab === 'home')    navigation.navigate('Home');
    if (tab === 'profile') navigation.navigate('Profile');
    if (tab === 'inbox')   navigation.navigate('Notifications');
  };

  const activeColor   = Colors.text;
  const inactiveColor = Colors.textPlaceholder;

  return (
    <SafeAreaView
      edges={['bottom']}
      style={{
        backgroundColor: Colors.bg,
        borderTopWidth: 1,
        borderTopColor: Colors.borderFaint,
      }}
    >
      <View className="flex-row justify-around items-center px-2 h-14">

        {/* ── Inbox ─────────────────────────────────────────── */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => handlePress('inbox')}
          className="flex-col items-center justify-center flex-1"
        >
          <MaterialIcon
            name="mail"
            color={activeTab === 'inbox' ? activeColor : inactiveColor}
            size={22}
          />
          <Text
            className="text-[11px] mt-1 font-medium"
            style={{ color: activeTab === 'inbox' ? activeColor : inactiveColor }}
          >
            Inbox
          </Text>
        </TouchableOpacity>

        {/* ── Home — elevated pill ──────────────────────────── */}
        <View className="flex-1 items-center justify-center" style={{ marginTop: -20 }}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => handlePress('home')}
            className="flex-col items-center justify-center rounded-full w-[58px] h-[58px]"
            style={{
              backgroundColor: Colors.bg,
              borderWidth: 1,
              borderColor: Colors.borderFaint,
            }}
          >
            <MaterialIcon
              name="dashboard"
              color={activeTab === 'home' ? activeColor : inactiveColor}
              size={26}
            />
            <Text
              className="text-[12px] mt-0.5 font-medium"
              style={{ color: activeTab === 'home' ? activeColor : inactiveColor }}
            >
              Home
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── Profile ───────────────────────────────────────── */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => handlePress('profile')}
          className="flex-col items-center justify-center flex-1"
        >
          {avatarUri ? (
            <View className="w-6 h-6 rounded-full overflow-hidden border border-white/20">
              <Image
                source={{ uri: avatarUri }}
                className="w-full h-full"
                style={{ resizeMode: 'cover' }}
              />
            </View>
          ) : (
            <View
              className="w-6 h-6 rounded-full items-center justify-center border border-white/20"
              style={{ backgroundColor: Colors.overlayLight }}
            >
              <MaterialIcon name="person" color={inactiveColor} size={14} />
            </View>
          )}
          <Text
            className="text-[11px] mt-1 font-medium"
            style={{ color: activeTab === 'profile' ? activeColor : inactiveColor }}
          >
            Profile
          </Text>
        </TouchableOpacity>

      </View>
    </SafeAreaView>
  );
}
