import React from 'react';
import { Image, View } from 'react-native';

import { Colors } from '@/src/constants/colors';

interface AvatarStackProps {
  uris: string[];
}

export default function AvatarStack({ uris }: AvatarStackProps) {
  return (
    <View className="flex-row">
      {uris.map((uri, index) => (
        <View
          key={uri}
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

