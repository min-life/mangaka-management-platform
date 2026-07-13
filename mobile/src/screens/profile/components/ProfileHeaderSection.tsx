import React from 'react';
import { View } from 'react-native';

import ProfileHeaderCard from '@/src/components/sub-component/ProfileHeaderCard';

interface ProfileHeaderSectionProps {
  avatarUri?: string | null;
  email?: string;
  isAvatarUploading?: boolean;
  name?: string | null;
  onAvatarPress?: () => void;
  onEditNamePress?: () => void;
  roleLabel?: string;
}

export default function ProfileHeaderSection({
  avatarUri,
  email,
  isAvatarUploading,
  name,
  onAvatarPress,
  onEditNamePress,
  roleLabel,
}: ProfileHeaderSectionProps) {
  return (
    <View className="mt-4">
      <ProfileHeaderCard
        avatarUri={avatarUri}
        email={email}
        isAvatarUploading={isAvatarUploading}
        name={name}
        onAvatarPress={onAvatarPress}
        onEditNamePress={onEditNamePress}
        roleLabel={roleLabel}
      />
    </View>
  );
}
