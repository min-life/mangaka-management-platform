import React from 'react';
import { Text, View } from 'react-native';

import ContributorRow from '@/src/components/sub-component/ContributorRow';
import { CONTRIBUTORS, TASK_INFO } from '@/src/constants/taskDetailData';
import { Contributor } from '@/src/types/taskDetail';

import { C } from './theme';

interface OverviewTabProps {
  contributors?: Contributor[];
  description?: string;
}

export default function OverviewTab({
  contributors = CONTRIBUTORS,
  description = TASK_INFO.description,
}: OverviewTabProps) {
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
        <Text style={{ color: C.text, lineHeight: 22 }}>{description}</Text>
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
          {contributors.map((contributor) => (
            <ContributorRow key={contributor.id} contributor={contributor} />
          ))}
        </View>
      </View>
    </View>
  );
}
