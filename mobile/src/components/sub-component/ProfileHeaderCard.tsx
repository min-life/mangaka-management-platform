import React from 'react';
import { View, Text, Image } from 'react-native';
import { Colors } from '@/src/constants/colors';
import MaterialIcon from '@/src/components/shared/MaterialIcon';

interface ProfileHeaderCardProps {
  avatarUri?: string | null;
  email?: string;
  name?: string | null;
  onSettingsPress?: () => void;
  roleLabel?: string;
}

/**
 * ProfileHeaderCard — Avatar, tên, email, role/studio + stats (Tasks, Reviews, Projects)
 */
export default function ProfileHeaderCard({
  avatarUri,
  email,
  name,
  onSettingsPress,
  roleLabel,
}: ProfileHeaderCardProps) {
  const displayName = name || 'Current user';
  const displayEmail = email || 'No email';
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'U';

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
          className="w-16 h-16 rounded-full overflow-hidden items-center justify-center"
          style={{ borderWidth: 2, borderColor: Colors.surface }}
        >
          {avatarUri ? (
            <Image
              source={{ uri: avatarUri }}
              className="w-full h-full"
              resizeMode="cover"
            />
          ) : (
            <Text className="text-[20px] font-bold" style={{ color: Colors.accent }}>
              {initials}
            </Text>
          )}
        </View>

        {/* Name / email / badge */}
        <View className="flex-1">
          <Text className="text-[18px] font-semibold" style={{ color: Colors.text }}>
            {displayName}
          </Text>
          <Text className="text-[14px] mt-0.5" style={{ color: Colors.textMuted }}>
            {displayEmail}
          </Text>

          {/* Role + Studio */}
          <View className="flex-row items-center gap-2 mt-2 flex-wrap">
            <View
              className="px-2 py-1 rounded"
              style={{ backgroundColor: Colors.surfaceContainer }}
            >
              <Text className="text-[11px] font-medium" style={{ color: Colors.text }}>
                {roleLabel || 'Viewer'}
              </Text>
            </View>
            <View className="flex-row items-center gap-1">
              <MaterialIcon name="apartment" color={Colors.textMuted} size={13} />
              <Text className="text-[11px]" style={{ color: Colors.textMuted }}>
                Mangaka workspace
              </Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}
