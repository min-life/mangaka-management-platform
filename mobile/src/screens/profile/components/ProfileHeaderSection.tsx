import React from 'react';
import { View } from 'react-native';

import ProfileHeaderCard from '@/src/components/sub-component/ProfileHeaderCard';

interface ProfileHeaderSectionProps {
  avatarUri?: string | null;
  email?: string;
  name?: string | null;
  roleLabel?: string;
}

export default function ProfileHeaderSection({
  avatarUri,
  email,
  name,
  roleLabel,
}: ProfileHeaderSectionProps) {
  return (
    <View className="mt-4">
      <ProfileHeaderCard avatarUri={avatarUri} email={email} name={name} roleLabel={roleLabel} />
    </View>
  );
}
