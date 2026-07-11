import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import ApiStateView from '@/src/components/shared/ApiStateView';
import BottomNavBar from '@/src/components/shared/BottomNavBar';
import MaterialIcon from '@/src/components/shared/MaterialIcon';
import { Colors } from '@/src/constants/colors';
import { RootStackParamList } from '@/src/navigation/types';
import { fetchProjectBundle } from '@/src/services/projectApi';
import {
  getApplicationStatusColor,
  getApplicationStatusLabel,
  getApplicationTypeLabel,
} from '@/src/screens/applications/components';
import { ProjectDetailTopBar } from '@/src/screens/projectDetail/components';
import { ApplicationStatus, ApplicationType } from '@/src/types/applications';
import { ProjectItem } from '@/src/types/projects';

type ProjectReportScreenProps = NativeStackScreenProps<RootStackParamList, 'ProjectReport'>;

function ReportMetric({
  label,
  value,
  helper,
}: {
  label: string;
  value: string | number;
  helper: string;
}) {
  return (
    <View
      className="rounded-2xl p-4"
      style={{
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.borderFaint,
      }}
    >
      <Text className="text-[28px] font-black" style={{ color: Colors.text }}>
        {value}
      </Text>
      <Text className="mt-1 text-[14px] font-bold" style={{ color: Colors.text }}>
        {label}
      </Text>
      <Text className="mt-1 text-[12px] leading-5" style={{ color: Colors.textMuted }}>
        {helper}
      </Text>
    </View>
  );
}

function StatusRow({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View className="flex-row items-center py-3">
      <View className="h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
      <Text className="ml-3 flex-1 text-[14px] font-semibold" style={{ color: Colors.text }}>
        {label}
      </Text>
      <Text className="text-[13px] font-bold" style={{ color: Colors.textMuted }}>
        {value}
      </Text>
    </View>
  );
}

const APPLICATION_STATUSES: ApplicationStatus[] = ['PENDING', 'APPROVE', 'REJECT', 'CANCELLED'];

const APPLICATION_TYPES: ApplicationType[] = ['CREATE_ARC', 'CREATE_CHAPTER'];

export default function ProjectReportScreen({ navigation, route }: ProjectReportScreenProps) {
  const [project, setProject] = useState<ProjectItem | null>(null);
  const [projectApplications, setProjectApplications] = useState<
    Awaited<
      ReturnType<typeof import('@/src/services/applicationApi').fetchApplications>
    >['applications']
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const loadReport = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const [bundle, applicationsModule] = await Promise.all([
        fetchProjectBundle(route.params.projectId, { includeResourceStats: true }),
        import('@/src/services/applicationApi'),
      ]);
      const applications = await applicationsModule.fetchApplications({
        projectId: route.params.projectId,
      });
      setProject(bundle.project);
      setProjectApplications(applications.applications);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to load report.');
    } finally {
      setIsLoading(false);
    }
  }, [route.params.projectId]);

  useEffect(() => {
    void loadReport();
  }, [loadReport]);

  if (isLoading) {
    return (
      <View className="flex-1" style={{ backgroundColor: Colors.bg }}>
        <ProjectDetailTopBar onBack={() => navigation.goBack()} />
        <ApiStateView type="loading" />
      </View>
    );
  }

  if (errorMessage || !project) {
    return (
      <View className="flex-1" style={{ backgroundColor: Colors.bg }}>
        <ProjectDetailTopBar onBack={() => navigation.goBack()} />
        <ApiStateView
          type="error"
          message={errorMessage || 'Project report not found'}
          onRetry={loadReport}
        />
      </View>
    );
  }

  const totalTasks =
    project.tasks.pending + project.tasks.inProgress + project.tasks.review + project.tasks.done;
  const doneTaskRate = totalTasks > 0 ? Math.round((project.tasks.done / totalTasks) * 100) : 0;

  return (
    <View className="flex-1" style={{ backgroundColor: Colors.bg }}>
      <ProjectDetailTopBar onBack={() => navigation.goBack()} />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="pb-5 pt-3">
          <View
            className="h-12 w-12 items-center justify-center rounded-2xl"
            style={{ backgroundColor: '#8B5CF6' }}
          >
            <MaterialIcon name="assessment" color="#FFFFFF" size={25} />
          </View>
          <Text className="mt-4 text-[30px] font-black" style={{ color: Colors.text }}>
            Report
          </Text>
          <Text className="mt-2 text-[14px] leading-6" style={{ color: Colors.textMuted }}>
            {project.name} production statistics and review progress.
          </Text>
          <View
            className="mt-5 h-2 overflow-hidden rounded-full"
            style={{ backgroundColor: Colors.iconBg }}
          >
            <View
              className="h-full rounded-full"
              style={{ width: `${project.stats.completionRate}%`, backgroundColor: '#8B5CF6' }}
            />
          </View>
          <View className="mt-2 flex-row items-center justify-between">
            <Text className="text-[12px] font-semibold" style={{ color: Colors.textMuted }}>
              Overall progress
            </Text>
            <Text
              className="text-[12px] font-bold"
              style={{ color: Colors.text, fontVariant: ['tabular-nums'] }}
            >
              {project.stats.completionRate}%
            </Text>
          </View>
        </View>

        <View className="gap-3">
          <ReportMetric
            label="Completion"
            value={`${project.stats.completionRate}%`}
            helper="Overall project progress from reviewed work."
          />
          <ReportMetric
            label="Pages Reviewed"
            value={project.stats.pagesReviewed}
            helper="Pages that have passed through review."
          />
          <ReportMetric
            label="Frame Comments"
            value={project.stats.frameComments}
            helper="Annotated review comments on manga frames."
          />
          <ReportMetric
            label="Files And Materials"
            value={`${project.files} / ${project.materials}`}
            helper={`${project.folders} folders with current file count and attached material records.`}
          />
        </View>

        <View
          className="mt-4 rounded-2xl px-4 py-2"
          style={{
            backgroundColor: Colors.surface,
            borderWidth: 1,
            borderColor: Colors.borderFaint,
          }}
        >
          <Text className="py-3 text-[15px] font-bold" style={{ color: Colors.text }}>
            Task Status
          </Text>
          <StatusRow label="Pending" value={project.tasks.pending} color={Colors.statusPending} />
          <StatusRow
            label="In Progress"
            value={project.tasks.inProgress}
            color={Colors.statusProgress}
          />
          <StatusRow label="Review" value={project.tasks.review} color={Colors.statusReview} />
          <StatusRow label="Done" value={project.tasks.done} color={Colors.statusDone} />
          <View className="flex-row border-t py-3" style={{ borderTopColor: Colors.borderFaint }}>
            <Text className="flex-1 text-[14px] font-bold" style={{ color: Colors.text }}>
              Done Rate
            </Text>
            <Text className="text-[13px] font-bold" style={{ color: Colors.textMuted }}>
              {doneTaskRate}% of {totalTasks}
            </Text>
          </View>
        </View>

        <View
          className="mt-4 rounded-2xl px-4 py-4"
          style={{
            backgroundColor: Colors.surface,
            borderWidth: 1,
            borderColor: Colors.borderFaint,
          }}
        >
          <Text className="text-[15px] font-bold" style={{ color: Colors.text }}>
            Applications
          </Text>
          <Text className="mt-2 text-[13px] leading-6" style={{ color: Colors.textMuted }}>
            {projectApplications.length} application records linked to this project.
          </Text>
          <View className="mt-4 gap-2">
            {APPLICATION_TYPES.map((type) => {
              const value = projectApplications.filter((item) => item.type === type).length;

              return (
                <View key={type} className="flex-row items-center justify-between">
                  <Text className="text-[13px] font-semibold" style={{ color: Colors.text }}>
                    {getApplicationTypeLabel(type)}
                  </Text>
                  <Text className="text-[12px] font-bold" style={{ color: Colors.textMuted }}>
                    {value}
                  </Text>
                </View>
              );
            })}
          </View>
          <View className="mt-4" style={{ borderTopWidth: 1, borderTopColor: Colors.borderFaint }}>
            {APPLICATION_STATUSES.map((status) => (
              <StatusRow
                key={status}
                label={getApplicationStatusLabel(status)}
                value={projectApplications.filter((item) => item.status === status).length}
                color={getApplicationStatusColor(status)}
              />
            ))}
          </View>
        </View>
      </ScrollView>

      <BottomNavBar activeTab="home" />
    </View>
  );
}
