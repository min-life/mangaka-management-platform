import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, Text, TextInput, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import ApiStateView from '@/src/components/shared/ApiStateView';
import AppRefreshControl from '@/src/components/shared/AppRefreshControl';
import MaterialIcon from '@/src/components/shared/MaterialIcon';
import { Colors } from '@/src/constants/colors';
import { RootStackParamList } from '@/src/navigation/types';
import { fetchApplications } from '@/src/services/applicationApi';
import { fetchProjectBundle } from '@/src/services/projectApi';
import { ApplicationStatus, ApplicationType } from '@/src/types/applications';
import { ApplicationItem } from '@/src/types/applications';

import {
  ApplicationCard,
  ApplicationFilterSelect,
  getApplicationStatusLabel,
  getApplicationTypeLabel,
} from './components';
import ApplicationTopBar from './components/ApplicationTopBar';

type ApplicationsScreenProps = NativeStackScreenProps<RootStackParamList, 'Applications'>;
type StatusFilter = ApplicationStatus | 'ALL';
type TypeFilter = ApplicationType | 'ALL';
type OpenFilter = 'status' | 'type' | null;

const APPLICATION_STATUS_FILTERS: StatusFilter[] = [
  'ALL',
  'PENDING',
  'APPROVE',
  'REJECT',
  'CANCELLED',
];

const APPLICATION_TYPE_FILTERS: TypeFilter[] = [
  'ALL',
  'MANUSCRIPT_REVIEW',
  'PUBLISH_REQUEST',
];

const statusOptions = APPLICATION_STATUS_FILTERS.map((status) => ({
  label: status === 'ALL' ? 'All status' : getApplicationStatusLabel(status),
  value: status,
}));

const typeOptions = APPLICATION_TYPE_FILTERS.map((type) => ({
  label: type === 'ALL' ? 'All type' : getApplicationTypeLabel(type),
  value: type,
}));

export default function ApplicationsScreen({ navigation, route }: ApplicationsScreenProps) {
  const projectId = route.params?.projectId;
  const isProjectScoped = Boolean(projectId);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('ALL');
  const [openFilter, setOpenFilter] = useState<OpenFilter>(null);
  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [projectName, setProjectName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const loadApplications = useCallback(async (options: { showLoading?: boolean } = {}) => {
    const showLoading = options.showLoading ?? true;
    if (showLoading) setIsLoading(true);
    else setIsRefreshing(true);
    setErrorMessage('');

    try {
      const [applicationsResult, projectResult] = await Promise.all([
        fetchApplications({
          projectId,
          search: search.trim() || undefined,
          status: statusFilter,
          type: typeFilter,
        }),
        projectId ? fetchProjectBundle(projectId).catch(() => null) : Promise.resolve(null),
      ]);
      setApplications(applicationsResult.applications);
      setProjectName(projectResult?.project.name ?? null);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Không thể tải applications.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [projectId, search, statusFilter, typeFilter]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      void loadApplications();
    }, 250);

    return () => clearTimeout(timeout);
  }, [loadApplications]);

  const handleRefresh = useCallback(() => {
    void loadApplications({ showLoading: false });
  }, [loadApplications]);

  return (
    <View className="flex-1" style={{ backgroundColor: Colors.bg }}>
      <ApplicationTopBar
        onBack={() => navigation.goBack()}
        subtitle={projectName ?? 'My Projects'}
        title="Applications"
      />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 40 }}
        // refreshControl={
        //   <AppRefreshControl onRefresh={handleRefresh} refreshing={isRefreshing} />
        // }
        showsVerticalScrollIndicator={false}
      >
        <View className="px-4 pt-4" style={{ zIndex: 20 }}>
          <View className="flex-row items-start gap-3">
            <View className="relative flex-1">
              <View className="absolute bottom-0 left-4 top-0 z-10 justify-center">
                <MaterialIcon name="search" color={Colors.textPlaceholder} size={18} />
              </View>
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search applications"
                placeholderTextColor={Colors.textPlaceholder}
                accessibilityLabel="Search applications"
                className="h-12 rounded-xl pl-10 pr-4 text-[15px]"
                style={{ backgroundColor: Colors.surface, color: Colors.text }}
              />
            </View>
            <ApplicationFilterSelect
              activeValue={statusFilter}
              accessibilityLabel="Select application status"
              icon="fact_check"
              isOpen={openFilter === 'status'}
              options={statusOptions}
              onChange={setStatusFilter}
              onOpenChange={(isOpen) => setOpenFilter(isOpen ? 'status' : null)}
            />
            <ApplicationFilterSelect
              activeValue={typeFilter}
              accessibilityLabel="Select application type"
              icon="tune"
              isOpen={openFilter === 'type'}
              options={typeOptions}
              onChange={setTypeFilter}
              onOpenChange={(isOpen) => setOpenFilter(isOpen ? 'type' : null)}
            />
          </View>
        </View>

        <View className="px-4 pt-4" style={{ zIndex: 0 }}>
          <View className="mb-3 flex-row items-center justify-between">
            <Text
              className="text-[12px] font-bold uppercase"
              style={{ color: Colors.textMuted, letterSpacing: 1 }}
            >
              {isProjectScoped ? 'Project applications' : 'My project applications'}
            </Text>
            <Text className="text-[12px]" style={{ color: Colors.textFaint }}>
              {applications.length} shown
            </Text>
          </View>

          {isLoading ? (
            <ApiStateView type="loading" />
          ) : errorMessage ? (
            <ApiStateView type="error" message={errorMessage} onRetry={loadApplications} />
          ) : (
            <View className="gap-3">
              {applications.length > 0 ? (
                applications.map((application) => (
                <ApplicationCard
                  key={application.id}
                  application={application}
                  contextLabel={isProjectScoped ? undefined : `Project ${application.projectId}`}
                  onPress={() =>
                    navigation.navigate('ApplicationDetail', {
                      applicationId: application.id,
                      projectId: application.projectId,
                    })
                  }
                />
                ))
              ) : (
                <View
                  className="items-center rounded-xl p-8"
                  style={{
                    backgroundColor: Colors.surface,
                    borderWidth: 1,
                    borderColor: Colors.borderSubtle,
                  }}
                >
                  <MaterialIcon name="apps" color={Colors.textFaint} size={30} />
                  <Text className="mt-3 text-[15px] font-bold" style={{ color: Colors.text }}>
                    No applications found
                  </Text>
                  <Text className="mt-1 text-center text-[13px]" style={{ color: Colors.textMuted }}>
                    Try another status, type, or search term.
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
