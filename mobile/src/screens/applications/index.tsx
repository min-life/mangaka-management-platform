import React, { useMemo, useState } from 'react';
import { ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import MaterialIcon from '@/src/components/shared/MaterialIcon';
import { Colors } from '@/src/constants/colors';
import {
  APPLICATION_STATUS_FILTERS,
  APPLICATION_TYPE_FILTERS,
  getProjectApplications,
  getUserProjectApplications,
} from '@/src/constants/applicationsData';
import { PROJECTS } from '@/src/constants/projectsData';
import { RootStackParamList } from '@/src/navigation/types';
import { ApplicationStatus, ApplicationType } from '@/src/types/applications';

import {
  ApplicationCard,
  ApplicationFilterBar,
  getApplicationStatusLabel,
  getApplicationTypeLabel,
} from './components';
import ApplicationTopBar from './components/ApplicationTopBar';

type ApplicationsScreenProps = NativeStackScreenProps<RootStackParamList, 'Applications'>;
type StatusFilter = ApplicationStatus | 'ALL';
type TypeFilter = ApplicationType | 'ALL';

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
  const project = projectId ? PROJECTS.find((item) => item.id === projectId) : undefined;
  const isProjectScoped = Boolean(projectId);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('ALL');

  const applications = useMemo(
    () =>
      projectId
        ? getProjectApplications(projectId)
        : getUserProjectApplications(PROJECTS.map((item) => item.id)),
    [projectId],
  );

  const filteredApplications = applications.filter((application) => {
    const normalizedSearch = search.trim().toLowerCase();
    const matchesSearch =
      normalizedSearch.length === 0 ||
      application.title.toLowerCase().includes(normalizedSearch) ||
      application.description.toLowerCase().includes(normalizedSearch) ||
      application.createdBy.toLowerCase().includes(normalizedSearch);
    const matchesStatus = statusFilter === 'ALL' || application.status === statusFilter;
    const matchesType = typeFilter === 'ALL' || application.type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  return (
    <View className="flex-1" style={{ backgroundColor: Colors.bg }}>
      <ApplicationTopBar
        actionIcon="add"
        onActionPress={() =>
          navigation.navigate('ApplicationCreate', {
            projectId: projectId ?? PROJECTS[0].id,
          })
        }
        onBack={() => navigation.goBack()}
        subtitle={project?.name ?? 'My Projects'}
        title="Applications"
      />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 112 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="px-4 pt-4">
          <View
            className="rounded-xl p-4"
            style={{
              backgroundColor: Colors.surface,
              borderWidth: 1,
              borderColor: Colors.borderSubtle,
            }}
          >
            <Text className="text-[11px] font-bold uppercase" style={{ color: Colors.textMuted }}>
              Current queue
            </Text>
            <View className="mt-3 flex-row gap-3">
              <View className="flex-1">
                <Text className="text-[24px] font-bold" style={{ color: Colors.text }}>
                  {isProjectScoped ? applications.length : PROJECTS.length}
                </Text>
                <Text className="text-[12px]" style={{ color: Colors.textMuted }}>
                  {isProjectScoped ? 'Total applications' : 'User projects'}
                </Text>
              </View>
              <View className="flex-1">
                <Text className="text-[24px] font-bold" style={{ color: Colors.statusReview }}>
                  {applications.filter((item) => item.status === 'PENDING').length}
                </Text>
                <Text className="text-[12px]" style={{ color: Colors.textMuted }}>
                  Pending review
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View className="px-4 pt-4">
          <View className="relative">
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
        </View>

        <View className="mt-3 gap-2">
          <ApplicationFilterBar
            activeValue={statusFilter}
            options={statusOptions}
            onChange={setStatusFilter}
          />
          <ApplicationFilterBar
            activeValue={typeFilter}
            options={typeOptions}
            onChange={setTypeFilter}
          />
        </View>

        <View className="px-4 pt-4">
          <View className="mb-3 flex-row items-center justify-between">
            <Text
              className="text-[12px] font-bold uppercase"
              style={{ color: Colors.textMuted, letterSpacing: 1 }}
            >
              {isProjectScoped ? 'Project applications' : 'My project applications'}
            </Text>
            <Text className="text-[12px]" style={{ color: Colors.textFaint }}>
              {filteredApplications.length} shown
            </Text>
          </View>

          <View className="gap-3">
            {filteredApplications.length > 0 ? (
              filteredApplications.map((application) => (
                <ApplicationCard
                  key={application.id}
                  application={application}
                  contextLabel={
                    isProjectScoped
                      ? undefined
                      : PROJECTS.find((item) => item.id === application.projectId)?.name
                  }
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
        </View>
      </ScrollView>

      <TouchableOpacity
        activeOpacity={0.82}
        onPress={() =>
          navigation.navigate('ApplicationCreate', {
            projectId: projectId ?? PROJECTS[0].id,
          })
        }
        accessibilityRole="button"
        accessibilityLabel="Create application"
        className="absolute bottom-6 right-5 h-14 w-14 items-center justify-center rounded-full"
        style={{ backgroundColor: Colors.accent }}
      >
        <MaterialIcon name="add" color={Colors.bg} size={28} />
      </TouchableOpacity>
    </View>
  );
}
