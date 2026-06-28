import React, { useState } from 'react';
import { Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import MaterialIcon from '@/src/components/shared/MaterialIcon';
import { Colors } from '@/src/constants/colors';
import { findApplication } from '@/src/constants/applicationsData';
import { PROJECTS } from '@/src/constants/projectsData';
import { TASK_INFO } from '@/src/constants/taskDetailData';
import { RootStackParamList } from '@/src/navigation/types';

import {
  ApplicationMaterialRow,
  ApplicationStatusBadge,
  ApplicationTypeBadge,
  getApplicationStatusColor,
  getApplicationStatusLabel,
} from '@/src/screens/applications/components';
import ApplicationTopBar from '@/src/screens/applications/components/ApplicationTopBar';

type ApplicationDetailScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'ApplicationDetail'
>;

type DetailTab = 'Overview' | 'Materials' | 'Actions';

const detailTabs: DetailTab[] = ['Overview', 'Materials', 'Actions'];

function DetailTabBar({
  activeTab,
  onChange,
}: {
  activeTab: DetailTab;
  onChange: (tab: DetailTab) => void;
}) {
  return (
    <View className="mt-5 flex-row" style={{ borderBottomWidth: 1, borderColor: Colors.borderSubtle }}>
      {detailTabs.map((tab) => {
        const isActive = tab === activeTab;
        return (
          <TouchableOpacity
            key={tab}
            activeOpacity={0.72}
            onPress={() => onChange(tab)}
            className="flex-1 items-center py-3"
            style={isActive ? { borderBottomWidth: 2, borderBottomColor: Colors.accent } : {}}
          >
            <Text
              className="text-[11px] font-bold uppercase"
              style={{ color: isActive ? Colors.accent : Colors.textMuted }}
            >
              {tab}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between gap-4 py-2">
      <Text className="text-[13px]" style={{ color: Colors.textMuted }}>
        {label}
      </Text>
      <Text className="flex-1 text-right text-[13px] font-semibold" style={{ color: Colors.text }}>
        {value}
      </Text>
    </View>
  );
}

function ActionButton({
  color,
  icon,
  label,
  tone = 'solid',
}: {
  color: string;
  icon: string;
  label: string;
  tone?: 'solid' | 'outline';
}) {
  const isSolid = tone === 'solid';

  return (
    <TouchableOpacity
      activeOpacity={0.82}
      accessibilityRole="button"
      accessibilityLabel={label}
      className="h-14 flex-row items-center justify-center gap-2 rounded-xl px-4"
      style={{
        backgroundColor: isSolid ? color : 'transparent',
        borderWidth: 1,
        borderColor: color,
      }}
    >
      <MaterialIcon name={icon} color={isSolid ? Colors.bg : color} size={20} />
      <Text className="text-[14px] font-bold" style={{ color: isSolid ? Colors.bg : color }}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

export default function ApplicationDetailScreen({
  navigation,
  route,
}: ApplicationDetailScreenProps) {
  const [activeTab, setActiveTab] = useState<DetailTab>('Overview');
  const application = findApplication(route.params.applicationId);
  const project = PROJECTS.find((item) => item.id === route.params.projectId);

  if (!application) {
    return (
      <View className="flex-1" style={{ backgroundColor: Colors.bg }}>
        <ApplicationTopBar
          onBack={() => navigation.goBack()}
          subtitle={project?.name ?? 'Project'}
          title="Application"
        />
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-center text-[15px] font-bold" style={{ color: Colors.text }}>
            Application not found
          </Text>
        </View>
      </View>
    );
  }

  const statusColor = getApplicationStatusColor(application.status);

  return (
    <View className="flex-1" style={{ backgroundColor: Colors.bg }}>
      <ApplicationTopBar
        actionIcon="more_vert"
        onBack={() => navigation.goBack()}
        subtitle={project?.name ?? 'Project'}
        title={application.title}
      />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="mt-4 overflow-hidden rounded-xl" style={{ backgroundColor: Colors.surface }}>
          <View style={{ aspectRatio: 3 / 4, backgroundColor: Colors.surfaceContainer }}>
            <Image
              source={{ uri: TASK_INFO.previewImageUri }}
              className="h-full w-full"
              resizeMode="contain"
              style={{ opacity: 0.9 }}
            />
            <View className="absolute right-4 top-4">
              <ApplicationStatusBadge status={application.status} />
            </View>
          </View>

          <View className="gap-3 p-4">
            <View className="flex-row flex-wrap items-center gap-2">
              <ApplicationTypeBadge type={application.type} />
              <View
                className="rounded-md px-2 py-1"
                style={{ backgroundColor: `${statusColor}22` }}
              >
                <Text className="text-[10px] font-bold uppercase" style={{ color: statusColor }}>
                  {getApplicationStatusLabel(application.status)}
                </Text>
              </View>
            </View>
            <Text className="text-[21px] font-bold leading-7" style={{ color: Colors.text }}>
              {application.title}
            </Text>
            <Text className="text-[14px] leading-6" style={{ color: Colors.textMuted }}>
              {application.description}
            </Text>
          </View>
        </View>

        <DetailTabBar activeTab={activeTab} onChange={setActiveTab} />

        {activeTab === 'Overview' && (
          <View className="mt-5 gap-4">
            <View
              className="rounded-xl p-4"
              style={{
                backgroundColor: Colors.surface,
                borderWidth: 1,
                borderColor: Colors.borderSubtle,
              }}
            >
              <Text className="mb-2 text-[11px] font-bold uppercase" style={{ color: Colors.textMuted }}>
                Review metadata
              </Text>
              <InfoRow label="Project" value={project?.name ?? application.projectId} />
              <InfoRow label="Submitted by" value={application.createdBy} />
              <InfoRow label="Verified by" value={application.verifyBy ?? 'Not verified'} />
              <InfoRow label="Created" value={application.createdAtLabel} />
              <InfoRow label="Updated" value={application.updatedAtLabel} />
            </View>

            <View
              className="rounded-xl p-4"
              style={{
                backgroundColor: Colors.surface,
                borderWidth: 1,
                borderColor: Colors.borderSubtle,
              }}
            >
              <Text className="mb-2 text-[11px] font-bold uppercase" style={{ color: Colors.textMuted }}>
                Material note
              </Text>
              <Text className="text-[14px] leading-6" style={{ color: Colors.text }}>
                {application.materials.note}
              </Text>
            </View>
          </View>
        )}

        {activeTab === 'Materials' && (
          <View className="mt-5 gap-3">
            <View className="flex-row items-center justify-between">
              <Text
                className="text-[11px] font-bold uppercase"
                style={{ color: Colors.textMuted, letterSpacing: 1 }}
              >
                Attached materials
              </Text>
              <Text className="text-[12px]" style={{ color: Colors.textFaint }}>
                {application.materials.pages.length} items
              </Text>
            </View>
            {application.materials.pages.map((material) => (
              <ApplicationMaterialRow key={material.id} material={material} />
            ))}
          </View>
        )}

        {activeTab === 'Actions' && (
          <View className="mt-5 gap-3">
            <ActionButton color={Colors.accent} icon="check_circle" label="Approve" />
            <ActionButton color="#EF4444" icon="cancel" label="Reject" />
            <ActionButton color={Colors.statusPending} icon="close" label="Cancel Request" tone="outline" />
            <ActionButton color={Colors.statusProgress} icon="edit" label="Edit Application" tone="outline" />
            <ActionButton color="#EF4444" icon="delete" label="Delete Application" tone="outline" />
          </View>
        )}
      </ScrollView>
    </View>
  );
}
