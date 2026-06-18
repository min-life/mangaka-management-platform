import React from 'react';
import { Text, View } from 'react-native';

import ContributorRow from '@/src/components/sub-component/ContributorRow';
import { CONTRIBUTORS, TASK_INFO } from '@/src/constants/taskDetailData';

import { C } from './theme';

export default function OverviewTab() {
  return (
    <View className="mt-6 gap-4">
      <View
        className="rounded-xl p-5"
        style={{ backgroundColor: C.surface, borderWidth: 1, borderColor: C.border }}
      >
        <Text
          className="text-[10px] font-bold uppercase tracking-widest mb-3"
          style={{ color: C.textMuted }}
        >
          Description
        </Text>
        <Text style={{ color: C.text, lineHeight: 22 }}>{TASK_INFO.description}</Text>
      </View>

      <View
        className="rounded-xl p-5"
        style={{ backgroundColor: C.surface, borderWidth: 1, borderColor: C.border }}
      >
        <Text
          className="text-[10px] font-bold uppercase tracking-widest mb-4"
          style={{ color: C.textMuted }}
        >
          Contributors
        </Text>
        <View className="gap-4">
          {CONTRIBUTORS.map((contributor) => (
            <ContributorRow key={contributor.id} contributor={contributor} />
          ))}
        </View>
      </View>
    </View>
  );
}

