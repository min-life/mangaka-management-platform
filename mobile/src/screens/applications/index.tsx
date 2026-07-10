import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
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
  ApplicationSearchBar,
  getApplicationStatusLabel,
  getApplicationTypeLabel,
} from './components';
import ApplicationTopBar from './components/ApplicationTopBar';

type ApplicationsScreenProps = NativeStackScreenProps<RootStackParamList, 'Applications'>;
type StatusFilter = ApplicationStatus | 'ALL';
type TypeFilter = ApplicationType | 'ALL';

const APPLICATION_STATUS_FILTERS: StatusFilter[] = [
  'ALL',
  'PENDING',
  'APPROVE',
  'REJECT',
  'CANCELLED',
];

const APPLICATION_TYPE_FILTERS: TypeFilter[] = ['ALL', 'MANUSCRIPT_REVIEW', 'PUBLISH_REQUEST'];

const statusOptions = APPLICATION_STATUS_FILTERS.map((status) => ({
  label: status === 'ALL' ? 'All status' : getApplicationStatusLabel(status),
  shortLabel: status === 'ALL' ? 'All' : getApplicationStatusLabel(status),
  value: status,
}));

const typeOptions = APPLICATION_TYPE_FILTERS.map((type) => ({
  label: type === 'ALL' ? 'All type' : getApplicationTypeLabel(type),
  shortLabel: type === 'ALL' ? 'All' : type === 'MANUSCRIPT_REVIEW' ? 'Review' : 'Publish',
  value: type,
}));

export default function ApplicationsScreen({ navigation, route }: ApplicationsScreenProps) {
  const projectId = route.params?.projectId;
  const isProjectScoped = Boolean(projectId);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('ALL');
  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [projectName, setProjectName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const loadApplications = useCallback(
    async (options: { showLoading?: boolean } = {}) => {
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
        setErrorMessage(error instanceof Error ? error.message : 'Unable to load applications.');
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [projectId, search, statusFilter, typeFilter],
  );

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
          <View className="relative z-20 flex-row items-center gap-3">
            <ApplicationSearchBar search={search} onSearchChange={setSearch} />
            <ApplicationFilterSelect
              statusValue={statusFilter}
              typeValue={typeFilter}
              statusOptions={statusOptions}
              typeOptions={typeOptions}
              onStatusChange={setStatusFilter}
              onTypeChange={setTypeFilter}
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
                  <Text
                    className="mt-1 text-center text-[13px]"
                    style={{ color: Colors.textMuted }}
                  >
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
