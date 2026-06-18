import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { Colors } from '@/src/constants/colors';
import { PROFILE_USER, PROFILE_STATS } from '@/src/constants/profileData';
import MaterialIcon from '@/src/components/shared/MaterialIcon';

interface ProfileHeaderCardProps {
  onSettingsPress?: () => void;
}

/**
 * ProfileHeaderCard — Avatar, tên, email, role/studio + stats (Tasks, Reviews, Projects)
 */
export default function ProfileHeaderCard({ onSettingsPress }: ProfileHeaderCardProps) {
  return (
    <View
      className="rounded-[22px] p-5"
      style={{
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
      }}
    >
      {/* Avatar + Info row */}
      <View className="flex-row items-start gap-4">
        {/* Avatar */}
        <View
          className="w-16 h-16 rounded-full overflow-hidden"
          style={{ borderWidth: 2, borderColor: Colors.surface }}
        >
          <Image
            source={{ uri: PROFILE_USER.avatarUri }}
            className="w-full h-full"
            resizeMode="cover"
          />
        </View>

        {/* Name / email / badge */}
        <View className="flex-1">
          <Text className="text-[18px] font-semibold" style={{ color: Colors.text }}>
            {PROFILE_USER.name}
          </Text>
          <Text className="text-[14px] mt-0.5" style={{ color: Colors.textMuted }}>
            {PROFILE_USER.email}
          </Text>

          {/* Role + Studio */}
          <View className="flex-row items-center gap-2 mt-2 flex-wrap">
            <View
              className="px-2 py-1 rounded"
              style={{ backgroundColor: Colors.surfaceContainer }}
            >
              <Text className="text-[11px] font-medium" style={{ color: Colors.text }}>
                {PROFILE_USER.role}
              </Text>
            </View>
            <View className="flex-row items-center gap-1">
              <MaterialIcon name="apartment" color={Colors.textMuted} size={13} />
              <Text className="text-[11px]" style={{ color: Colors.textMuted }}>
                {PROFILE_USER.studio}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Stats row */}
      <View className="flex-row gap-2 mt-5">
        {PROFILE_STATS.map((stat) => (
          <View
            key={stat.id}
            className="flex-1 rounded-xl p-3 items-center justify-center"
            style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
          >
            <Text className="text-[20px] font-semibold" style={{ color: Colors.text }}>
              {stat.value}
            </Text>
            <Text className="text-[11px] mt-0.5" style={{ color: Colors.textMuted }}>
              {stat.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
