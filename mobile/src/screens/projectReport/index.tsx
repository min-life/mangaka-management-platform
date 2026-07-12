import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Line as SvgLine, Polyline } from 'react-native-svg';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import ApiStateView from '@/src/components/shared/ApiStateView';
import BottomNavBar from '@/src/components/shared/BottomNavBar';
import HeaderBackButton from '@/src/components/shared/HeaderBackButton';
import MaterialIcon from '@/src/components/shared/MaterialIcon';
import { Colors } from '@/src/constants/colors';
import { RootStackParamList } from '@/src/navigation/types';
import { ApiFolder, ApiProjectStat } from '@/src/services/apiTypes';
import {
  fetchProjectById,
  fetchProjectFolders,
  fetchProjectStats,
} from '@/src/services/projectApi';
import {
  aggregateProjectStats,
  formatProjectStatValue,
  getProjectStatsYears,
  ProjectStatRow,
} from '@/src/services/projectStats';
import { ProjectItem } from '@/src/types/projects';

type ProjectReportScreenProps = NativeStackScreenProps<RootStackParamList, 'ProjectReport'>;

type FilterOption = {
  label: string;
  value: string;
};

const TREND_COLORS = ['#FFD369', '#60A5FA', '#34D399', '#F87171', '#A78BFA'];

function formatUpdatedAt(value?: string) {
  if (!value) return 'No upload recorded';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'No upload recorded';
  return `Updated ${date.toLocaleDateString('en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })}`;
}

function getMetricKindLabel(key: string) {
  const normalized = key.toLowerCase();
  if (normalized.includes('average') || normalized.includes('rating')) return 'Average';
  return 'Total';
}

function ReportHeader({ onBack, project }: { onBack: () => void; project: ProjectItem | null }) {
  return (
    <SafeAreaView edges={['top']} style={{ backgroundColor: Colors.bg }}>
      <View className="h-16 flex-row items-center justify-between px-3">
        <HeaderBackButton iconSize={24} onPress={onBack} />
        <Text className="text-[22px] font-black" style={{ color: Colors.text }}>
          Statistics
        </Text>
        <View className="h-10 w-10" />
      </View>
      {project ? (
        <View className="border-b px-4 pb-4" style={{ borderBottomColor: Colors.borderSubtle }}>
          <Text className="text-[13px] font-semibold" style={{ color: Colors.textMuted }}>
            {project.name}
          </Text>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

function FilterSelect({
  disabled = false,
  label,
  onSelect,
  options,
  value,
}: {
  disabled?: boolean;
  label: string;
  onSelect: (value: string) => void;
  options: FilterOption[];
  value: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find((option) => option.value === value) ?? options[0];
  const isFiltered = value !== options[0]?.value;

  return (
    <View>
      <TouchableOpacity
        activeOpacity={disabled ? 1 : 0.76}
        accessibilityLabel={`Select ${label} filter`}
        accessibilityRole="button"
        accessibilityState={{ disabled, expanded: isOpen, selected: isFiltered }}
        className="h-10 flex-row items-center rounded-full px-3"
        disabled={disabled}
        onPress={() => setIsOpen(true)}
        style={{
          backgroundColor: isFiltered ? Colors.surfaceContainer : Colors.surface,
          borderColor: isFiltered ? 'rgba(255,211,105,0.42)' : Colors.borderFaint,
          borderWidth: 1,
          opacity: disabled ? 0.5 : 1,
        }}
      >
        <MaterialIcon
          name="filter_list"
          color={isFiltered ? Colors.accent : Colors.textMuted}
          size={18}
        />
        <Text
          className="ml-2 max-w-[120px] text-[13px] font-bold"
          numberOfLines={1}
          style={{ color: isFiltered ? Colors.accent : Colors.text }}
        >
          {selectedOption?.label ?? label}
        </Text>
        <MaterialIcon name="expand_more" color={Colors.textMuted} size={18} />
      </TouchableOpacity>

      <Modal animationType="fade" onRequestClose={() => setIsOpen(false)} transparent visible={isOpen}>
        <TouchableOpacity
          activeOpacity={1}
          className="flex-1 justify-end"
          onPress={() => setIsOpen(false)}
          style={{ backgroundColor: 'rgba(0,0,0,0.48)' }}
        >
          <View
            className="rounded-t-3xl p-4"
            onStartShouldSetResponder={() => true}
            style={{ backgroundColor: Colors.bg, borderTopColor: Colors.borderFaint, borderTopWidth: 1 }}
          >
            <View className="mb-3 flex-row items-center justify-between">
              <Text className="text-[17px] font-black" style={{ color: Colors.text }}>
                {label}
              </Text>
              <TouchableOpacity
                accessibilityLabel="Close filter"
                accessibilityRole="button"
                className="h-9 w-9 items-center justify-center rounded-full"
                onPress={() => setIsOpen(false)}
                style={{ backgroundColor: Colors.iconBg }}
              >
                <MaterialIcon name="close" color={Colors.text} size={18} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 320 }} showsVerticalScrollIndicator={false}>
              {options.map((option, index) => {
                const isActive = option.value === value;

                return (
                  <TouchableOpacity
                    key={option.value}
                    activeOpacity={0.72}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isActive }}
                    className="flex-row items-center px-2 py-4"
                    onPress={() => {
                      onSelect(option.value);
                      setIsOpen(false);
                    }}
                    style={{
                      borderBottomColor: Colors.borderFaint,
                      borderBottomWidth: index === options.length - 1 ? 0 : 1,
                    }}
                  >
                    <Text
                      className="flex-1 text-[14px] font-bold"
                      numberOfLines={1}
                      style={{ color: isActive ? Colors.accent : Colors.text }}
                    >
                      {option.label}
                    </Text>
                    {isActive ? <MaterialIcon name="check" color={Colors.accent} size={18} /> : null}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

function KpiCard({ label, value }: { label: string; value: string }) {
  return (
    <View
      className="rounded-xl p-4"
      style={{
        backgroundColor: Colors.surface,
        borderColor: Colors.borderFaint,
        borderWidth: 1,
        width: '48%',
      }}
    >
      <Text className="text-[11px] font-black uppercase" style={{ color: Colors.textMuted }}>
        {label}
      </Text>
      <Text className="mt-2 text-[24px] font-black" style={{ color: Colors.text }} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

function metricValue(row: ProjectStatRow, key: string) {
  const value = row[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function MetricTrendCard({
  color,
  metricKey,
  months,
  summaryValue,
}: {
  color: string;
  metricKey: string;
  months: ProjectStatRow[];
  summaryValue: number;
}) {
  const { width } = useWindowDimensions();
  const chartWidth = Math.max(260, width - 64);
  const chartHeight = 120;
  const chartPadding = 14;
  const points = months
    .map((row, index) => ({ index, value: metricValue(row, metricKey) }))
    .filter((point): point is { index: number; value: number } => point.value !== null);
  const values = points.map((point) => point.value);
  const maxValue = Math.max(...values, 1);
  const minValue = Math.min(...values, 0);
  const valueRange = maxValue - minValue || 1;
  const usableWidth = chartWidth - chartPadding * 2;
  const usableHeight = chartHeight - chartPadding * 2;
  const polylinePoints = points
    .map((point) => {
      const x = chartPadding + (point.index / 11) * usableWidth;
      const y = chartPadding + ((maxValue - point.value) / valueRange) * usableHeight;
      return `${x},${y}`;
    })
    .join(' ');
  const latestPoint = [...points].reverse()[0];

  return (
    <View
      className="rounded-xl p-4"
      style={{
        backgroundColor: Colors.surface,
        borderColor: Colors.borderFaint,
        borderWidth: 1,
      }}
    >
      <View className="flex-row items-start justify-between gap-3">
        <View className="min-w-0 flex-1">
          <Text className="text-[15px] font-black" numberOfLines={1} style={{ color: Colors.text }}>
            {metricKey}
          </Text>
          <Text className="mt-1 text-[12px] font-semibold" style={{ color: Colors.textMuted }}>
            {getMetricKindLabel(metricKey)}
          </Text>
        </View>
        <Text className="text-[18px] font-black" style={{ color }}>
          {formatProjectStatValue(metricKey, summaryValue)}
        </Text>
      </View>

      <View className="mt-4 overflow-hidden rounded-xl" style={{ backgroundColor: Colors.overlayLight }}>
        {points.length > 0 ? (
          <Svg width={chartWidth} height={chartHeight}>
            {[0, 1, 2].map((line) => {
              const y = chartPadding + (line / 2) * usableHeight;
              return (
                <SvgLine
                  key={line}
                  x1={chartPadding}
                  x2={chartWidth - chartPadding}
                  y1={y}
                  y2={y}
                  stroke="rgba(237,241,251,0.08)"
                  strokeWidth={1}
                />
              );
            })}
            <Polyline
              fill="none"
              points={polylinePoints}
              stroke={color}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
            />
            {points.map((point) => {
              const x = chartPadding + (point.index / 11) * usableWidth;
              const y = chartPadding + ((maxValue - point.value) / valueRange) * usableHeight;
              return <Circle key={`${point.index}-${point.value}`} cx={x} cy={y} fill={color} r={3} />;
            })}
          </Svg>
        ) : (
          <View className="h-[120px] items-center justify-center">
            <Text className="text-[12px] font-bold" style={{ color: Colors.textFaint }}>
              No monthly data
            </Text>
          </View>
        )}
      </View>

      <View className="mt-3 flex-row items-center justify-between">
        <Text className="text-[11px] font-bold uppercase" style={{ color: Colors.textFaint }}>
          M1
        </Text>
        {latestPoint ? (
          <Text className="text-[11px] font-bold" style={{ color: Colors.textMuted }}>
            Latest M{latestPoint.index + 1}: {formatProjectStatValue(metricKey, latestPoint.value)}
          </Text>
        ) : null}
        <Text className="text-[11px] font-bold uppercase" style={{ color: Colors.textFaint }}>
          M12
        </Text>
      </View>
    </View>
  );
}

function EmptyStatisticsState() {
  return (
    <View
      className="h-[280px] items-center justify-center rounded-xl border border-dashed px-8"
      style={{
        backgroundColor: Colors.surface,
        borderColor: Colors.borderFaint,
      }}
    >
      <MaterialIcon name="assessment" color={Colors.textFaint} size={32} />
      <Text className="mt-4 text-center text-[15px] font-black" style={{ color: Colors.text }}>
        No statistics data
      </Text>
      <Text className="mt-2 text-center text-[13px] leading-5" style={{ color: Colors.textMuted }}>
        No metrics were found for the selected year, arc, and chapter.
      </Text>
    </View>
  );
}

export default function ProjectReportScreen({ navigation, route }: ProjectReportScreenProps) {
  const [project, setProject] = useState<ProjectItem | null>(null);
  const [statsRecord, setStatsRecord] = useState<ApiProjectStat | null>(null);
  const [folders, setFolders] = useState<ApiFolder[]>([]);
  const [selectedArcId, setSelectedArcId] = useState('all');
  const [selectedChapterId, setSelectedChapterId] = useState('all');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const loadReport = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const [projectResult, statsResult, foldersResult] = await Promise.all([
        fetchProjectById(route.params.projectId).catch(() => null),
        fetchProjectStats(route.params.projectId),
        fetchProjectFolders(route.params.projectId, { limit: 100 }),
      ]);
      setProject(projectResult);
      setStatsRecord(statsResult);
      setFolders(foldersResult.folders);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to load statistics data.');
    } finally {
      setIsLoading(false);
    }
  }, [route.params.projectId]);

  useEffect(() => {
    void loadReport();
  }, [loadReport]);

  const yearOptions = useMemo(
    () =>
      getProjectStatsYears(statsRecord?.metrics).map((year) => ({
        label: String(year),
        value: String(year),
      })),
    [statsRecord?.metrics],
  );

  useEffect(() => {
    if (yearOptions.length === 0) return;
    if (!yearOptions.some((option) => option.value === String(selectedYear))) {
      setSelectedYear(Number(yearOptions[0].value));
    }
  }, [selectedYear, yearOptions]);

  const arcs = useMemo(() => folders.filter((folder) => folder.type === 'ARC'), [folders]);
  const chapters = useMemo(
    () =>
      folders.filter(
        (folder) =>
          folder.type === 'CHAPTER' &&
          (selectedArcId === 'all' || String(folder.parentId) === selectedArcId),
      ),
    [folders, selectedArcId],
  );
  const arcOptions = useMemo<FilterOption[]>(
    () => [{ label: 'All arcs', value: 'all' }, ...arcs.map((arc) => ({ label: arc.title, value: String(arc.id) }))],
    [arcs],
  );
  const chapterOptions = useMemo<FilterOption[]>(
    () => [
      { label: 'All chapters', value: 'all' },
      ...chapters.map((chapter) => ({ label: chapter.title, value: String(chapter.id) })),
    ],
    [chapters],
  );

  const { months, summary } = useMemo(
    () =>
      aggregateProjectStats(
        statsRecord?.metrics,
        {
          arcId: selectedArcId !== 'all' ? selectedArcId : undefined,
          chapterId: selectedChapterId !== 'all' ? selectedChapterId : undefined,
          year: selectedYear,
        },
        folders,
      ),
    [folders, selectedArcId, selectedChapterId, selectedYear, statsRecord?.metrics],
  );

  const summaryKeys = useMemo(() => Object.keys(summary), [summary]);

  if (isLoading) {
    return (
      <View className="flex-1" style={{ backgroundColor: Colors.bg }}>
        <ReportHeader onBack={() => navigation.goBack()} project={project} />
        <ApiStateView type="loading" />
      </View>
    );
  }

  if (errorMessage) {
    return (
      <View className="flex-1" style={{ backgroundColor: Colors.bg }}>
        <ReportHeader onBack={() => navigation.goBack()} project={project} />
        <ApiStateView type="error" message={errorMessage} onRetry={loadReport} />
      </View>
    );
  }

  return (
    <View className="flex-1" style={{ backgroundColor: Colors.bg }}>
      <ReportHeader onBack={() => navigation.goBack()} project={project} />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 110 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="px-4 pt-5">
          <View className="flex-row items-start gap-3">
            <View
              className="h-12 w-12 items-center justify-center rounded-xl"
              style={{ backgroundColor: Colors.iconBg }}
            >
              <MaterialIcon name="assessment" color={Colors.accent} size={26} />
            </View>
            <View className="min-w-0 flex-1">
              <Text className="text-[24px] font-black" style={{ color: Colors.text }}>
                Project Statistics
              </Text>
              <Text className="mt-1 text-[13px] leading-5" style={{ color: Colors.textMuted }}>
                Detailed metrics aggregated from uploaded CSV records.
              </Text>
              <Text className="mt-2 text-[12px] font-semibold" style={{ color: Colors.textFaint }}>
                {formatUpdatedAt(statsRecord?.updatedAt)}
              </Text>
            </View>
          </View>

          <ScrollView
            className="mt-5"
            contentContainerStyle={{ gap: 8, paddingRight: 16 }}
            horizontal
            showsHorizontalScrollIndicator={false}
          >
            <FilterSelect
              label="Year"
              onSelect={(value) => setSelectedYear(Number(value))}
              options={yearOptions}
              value={String(selectedYear)}
            />
            <FilterSelect
              label="Arc"
              onSelect={(value) => {
                setSelectedArcId(value);
                setSelectedChapterId('all');
              }}
              options={arcOptions}
              value={selectedArcId}
            />
            <FilterSelect
              disabled={chapters.length === 0}
              label="Chapter"
              onSelect={setSelectedChapterId}
              options={chapterOptions}
              value={selectedChapterId}
            />
          </ScrollView>

          {summaryKeys.length > 0 ? (
            <>
              <View className="mt-5 flex-row flex-wrap justify-between gap-y-3">
                {summaryKeys.map((key) => (
                  <KpiCard key={key} label={key} value={formatProjectStatValue(key, summary[key])} />
                ))}
              </View>

              <View className="mt-5 gap-4">
                {summaryKeys.map((key, index) => (
                  <MetricTrendCard
                    key={key}
                    color={TREND_COLORS[index % TREND_COLORS.length]}
                    metricKey={key}
                    months={months}
                    summaryValue={summary[key]}
                  />
                ))}
              </View>
            </>
          ) : (
            <View className="mt-5">
              <EmptyStatisticsState />
            </View>
          )}
        </View>
      </ScrollView>

      <BottomNavBar activeTab="home" />
    </View>
  );
}
