import React from 'react';
import { ActivityIndicator, Image, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '@/src/constants/colors';
import MaterialIcon from '@/src/components/shared/MaterialIcon';

interface ProfileHeaderCardProps {
  avatarUri?: string | null;
  email?: string;
  isAvatarUploading?: boolean;
  name?: string | null;
  onAvatarPress?: () => void;
  onEditNamePress?: () => void;
  onSettingsPress?: () => void;
  roleLabel?: string;
}

/**
 * ProfileHeaderCard — Avatar, tên, email, role/studio + stats (Tasks, Reviews, Projects)
 */
export default function ProfileHeaderCard({
  avatarUri,
  email,
  isAvatarUploading,
  name,
  onAvatarPress,
  onEditNamePress,
  onSettingsPress,
  roleLabel,
}: ProfileHeaderCardProps) {
  const displayName = name || 'Current user';
  const displayEmail = email || 'No email';
  const initials =
    displayName
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
        <TouchableOpacity
          activeOpacity={0.78}
          className="h-16 w-16 items-center justify-center rounded-full"
          disabled={isAvatarUploading}
          onPress={onAvatarPress}
          style={{ borderWidth: 2, borderColor: Colors.surface }}
        >
          <View className="h-full w-full overflow-hidden rounded-full items-center justify-center">
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} className="h-full w-full" resizeMode="cover" />
            ) : (
              <Text className="text-[20px] font-bold" style={{ color: Colors.accent }}>
                {initials}
              </Text>
            )}

            {isAvatarUploading ? (
              <View
                className="absolute inset-0 items-center justify-center"
                style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
              >
                <ActivityIndicator color={Colors.accent} size="small" />
              </View>
            ) : null}
          </View>

          <View
            className="absolute -right-1 -top-1 h-7 w-7 items-center justify-center rounded-full"
            style={{
              backgroundColor: Colors.accent,
              borderColor: Colors.surface,
              borderWidth: 2,
            }}
          >
            <MaterialIcon name="edit" color={Colors.bg} size={14} />
          </View>
        </TouchableOpacity>

        {/* Name / email / badge */}
        <View className="flex-1">
          <View className="flex-row items-center gap-2">
            <Text
              className="flex-1 text-[18px] font-semibold"
              numberOfLines={1}
              style={{ color: Colors.text }}
            >
              {displayName}
            </Text>
            <TouchableOpacity
              activeOpacity={0.75}
              className="h-8 w-8 items-center justify-center rounded-full"
              onPress={onEditNamePress ?? onSettingsPress}
              style={{ backgroundColor: Colors.surfaceContainer }}
            >
              <MaterialIcon name="edit" color={Colors.text} size={16} />
            </TouchableOpacity>
          </View>
          <Text className="text-[14px] mt-0.5" style={{ color: Colors.textMuted }}>
            {displayEmail}
          </Text>
        </View>
      </View>
    </View>
  );
}
