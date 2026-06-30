import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import ApiStateView from '@/src/components/shared/ApiStateView';
import MaterialIcon from '@/src/components/shared/MaterialIcon';
import { Colors } from '@/src/constants/colors';
import { RootStackParamList } from '@/src/navigation/types';
import { fetchApplication } from '@/src/services/applicationApi';
import { ApplicationItem } from '@/src/types/applications';

import {
  ApplicationMaterialRow,
  ApplicationStatusBadge,
  ApplicationTypeBadge,
} from '@/src/screens/applications/components';
import ApplicationTopBar from '@/src/screens/applications/components/ApplicationTopBar';

type ApplicationDetailScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'ApplicationDetail'
>;

export default function ApplicationDetailScreen({
  navigation,
  route,
}: ApplicationDetailScreenProps) {
  const [application, setApplication] = useState<ApplicationItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const loadApplication = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const result = await fetchApplication(route.params.applicationId);
      setApplication(result);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Không thể tải application.');
    } finally {
      setIsLoading(false);
    }
  }, [route.params.applicationId]);

  useEffect(() => {
    void loadApplication();
  }, [loadApplication]);

  return (
    <View className="flex-1" style={{ backgroundColor: Colors.bg }}>
      <ApplicationTopBar
        onBack={() => navigation.goBack()}
        subtitle={`Project ${route.params.projectId}`}
        title="Application"
      />

      {isLoading ? (
        <ApiStateView type="loading" />
      ) : errorMessage || !application ? (
        <ApiStateView
          type="error"
          message={errorMessage || 'Application not found'}
          onRetry={loadApplication}
        />
      ) : (
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          <View
            className="rounded-2xl p-5"
            style={{
              backgroundColor: Colors.surface,
              borderWidth: 1,
              borderColor: Colors.borderFaint,
            }}
          >
            <View className="flex-row items-start justify-between gap-3">
              <View className="flex-1 gap-2">
                <ApplicationTypeBadge type={application.type} />
                <Text className="text-[24px] font-black" style={{ color: Colors.text }}>
                  {application.title}
                </Text>
              </View>
              <ApplicationStatusBadge status={application.status} />
            </View>

            <Text className="mt-4 text-[14px] leading-6" style={{ color: Colors.textMuted }}>
              {application.description || 'No description.'}
            </Text>

            <View className="mt-5 gap-2">
              <View className="flex-row items-center gap-2">
                <MaterialIcon name="person" color={Colors.textFaint} size={16} />
                <Text className="text-[13px]" style={{ color: Colors.textMuted }}>
                  Created by {application.createdBy}
                </Text>
              </View>
              <View className="flex-row items-center gap-2">
                <MaterialIcon name="calendar_today" color={Colors.textFaint} size={16} />
                <Text className="text-[13px]" style={{ color: Colors.textMuted }}>
                  {application.createdAtLabel} - {application.updatedAtLabel}
                </Text>
              </View>
            </View>
          </View>

          <View className="mt-5 gap-3">
            <Text
              className="text-[12px] font-bold uppercase"
              style={{ color: Colors.textMuted, letterSpacing: 1 }}
            >
              Materials
            </Text>
            {application.materials.pages.length > 0 ? (
              application.materials.pages.map((material) => (
                <ApplicationMaterialRow key={material.id} material={material} />
              ))
            ) : (
              <View
                className="items-center rounded-xl p-6"
                style={{
                  backgroundColor: Colors.surface,
                  borderWidth: 1,
                  borderColor: Colors.borderSubtle,
                }}
              >
                <MaterialIcon name="attach" color={Colors.textFaint} size={26} />
                <Text className="mt-3 text-[14px] font-bold" style={{ color: Colors.text }}>
                  No material linked
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

