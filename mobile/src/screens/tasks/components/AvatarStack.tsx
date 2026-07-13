import React from 'react';
import { Image, View } from 'react-native';

import MaterialIcon from '@/src/components/shared/MaterialIcon';
import { Colors } from '@/src/constants/colors';

interface AvatarStackProps {
  uris: string[];
}

export default function AvatarStack({ uris }: AvatarStackProps) {
  if (uris.length === 0) {
    return (
      <View
        className="h-8 w-8 items-center justify-center rounded-full"
        style={{
          backgroundColor: 'rgba(237,241,251,0.08)',
          borderWidth: 1,
          borderColor: Colors.borderFaint,
        }}
      >
        <MaterialIcon name="person" color={Colors.textFaint} size={16} />
      </View>
    );
  }

  return (
    <View className="flex-row">
      {uris.map((uri, index) => (
        <View
          key={`${uri}-${index}`}
          className="w-8 h-8 rounded-full overflow-hidden"
          style={{
            marginLeft: index > 0 ? -8 : 0,
            borderWidth: 2,
            borderColor: Colors.surface,
          }}
        >
          <Image source={{ uri }} className="w-full h-full" resizeMode="cover" />
        </View>
      ))}
    </View>
  );
}

