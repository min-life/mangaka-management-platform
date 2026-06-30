import React from 'react';
import { TouchableOpacity } from 'react-native';

import MaterialIcon from '@/src/components/shared/MaterialIcon';

export default function CreateTaskFab() {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      className="absolute right-6 bottom-24 w-14 h-14 rounded-full items-center justify-center shadow-lg"
      style={{ backgroundColor: '#EEEEEE' }}
    >
      <MaterialIcon name="add" color="#161c25" size={32} />
    </TouchableOpacity>
  );
}

