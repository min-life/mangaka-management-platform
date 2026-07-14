'use client';

import { useMemo, useState } from 'react';
import {
  BarChart3,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  Eye,
  MessageSquareText,
  Star,
  TrendingUp,
} from 'lucide-react';
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts';

import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { LoadingState } from '@/components/ui/loading-state';
import { RefreshingIndicator } from '@/components/ui/refreshing-indicator';
import { useAsyncResource } from '@/hooks/useAsyncResource';
import {
  getFolderChildren,
  getProjectFolders,
  type ProjectFolderResponse,
} from '@/services/project.service';
import {
  getProjectStats,
  type ProjectStatMonth,
  type ProjectStatsResult,
} from '@/services/project-stats.service';

import { ImportProjectStatsDialog, type ChapterOption } from './ImportProjectStatsDialog';

import { useProjectParams } from '@/hooks/useProjectParams';

const MONTH_LABELS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

const ALL_SCOPE = 'all';

const YEARS_PER_PAGE = 6;
const CURRENT_YEAR = new Date().getFullYear();

function isStatsEmpty(stats: ProjectStatsResult): boolean {
  return (
    stats.summary.totalViews === 0 &&
    stats.summary.totalSales === 0 &&
    stats.summary.totalRevenue === 0 &&
    stats.summary.totalReviews === 0
  );
}

type MetricKey = 'views' | 'sales' | 'revenue' | 'reviews' | 'rating';

function chartData(months: ProjectStatMonth[], key: MetricKey) {
  // The response only contains months that actually have data. Render from Jan
  // up to the LAST month with data, and no further — months after it are hidden
  // entirely (no label, no node). A month missing inside that range renders as
  // null so the line breaks there while its X-axis label is still shown, and a
  // month present with a genuine 0 still gets a node.
  if (months.length === 0) {
    return [];
  }

  const byMonth = new Map(months.map((month) => [month.month, month]));
  const lastMonth = months.reduce((max, month) => Math.max(max, month.month), 0);

  return MONTH_LABELS.slice(0, lastMonth).map((label, index) => {
    const entry = byMonth.get(index + 1);
    return {
      label,
      value: entry ? entry[key] : null,
    };
  });
}

function KpiCard({
  icon,
  label,
  meta,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  meta: string;
  value: string;
}) {
  return (
    <article className="rounded-[5px] border border-[#39424f] bg-[#1a222d] p-4">
      <div className="flex items-center gap-2 text-[#8b94a1]">
        {icon}
        <p className="text-[11px] font-black uppercase tracking-[0.04em] text-[#aeb7c2]">{label}</p>
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-2xl font-black text-white">{value}</span>
      </div>
      <p className="mt-1 text-[10px] font-semibold text-[#5b626d]">{meta}</p>
    </article>
  );
}

function StatsLineChart({
  color,
  data,
  icon,
  title,
  valueFormatter,
}: {
  color: string;
  data: { label: string; value: number | null }[];
  icon: React.ReactNode;
  title: string;
  valueFormatter: (value: number) => string;
}) {
  return (
    <div className="rounded-[5px] border border-[#39424f] bg-[#0e141c] p-4">
      <div className="flex items-center gap-2 text-[#8b94a1]">
        {icon}
        <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#aeb7c2]">
          {title}
        </p>
      </div>
      <ChartContainer
        className="mt-3 aspect-auto h-[220px] w-full"
        config={{ value: { color, label: title } }}
      >
        <LineChart data={data} margin={{ bottom: 0, left: 4, right: 4, top: 8 }}>
          <CartesianGrid stroke="#26303c" vertical={false} />
          <XAxis dataKey="label" fontSize={11} interval={0} stroke="#5b626d" tickLine={false} />
          <YAxis
            fontSize={11}
            stroke="#5b626d"
            tickFormatter={(value) => valueFormatter(value)}
            tickLine={false}
            width={56}
          />
          <ChartTooltip content={<ChartTooltipContent />} cursor={{ stroke: '#39424f' }} />
          <Line
            connectNulls={false}
            dataKey="value"
            dot={{ r: 3, fill: color }}
            name={title}
            stroke={color}
            strokeWidth={2}
            type="monotone"
          />
        </LineChart>
      </ChartContainer>
    </div>
  );
}

function EmptyStatsState() {
  return (
    <div className="flex h-[280px] flex-col items-center justify-center gap-3 rounded-[5px] border border-dashed border-[#303842] bg-[#1a222d]">
      <BarChart3 className="size-7 text-[#5b626d]" />
      <p className="text-xs font-bold text-[#8b94a1]">No stats imported for this scope yet.</p>
      <p className="text-[11px] font-medium text-[#5b626d]">
        Use &quot;Import CSV&quot; to upload a chapter&apos;s yearly numbers.
      </p>
    </div>
  );
}

type StatisticsClientProps = {
  projectId?: number;
};

export function StatisticsClient({ projectId: projectIdProp }: StatisticsClientProps) {
  const { numericId } = useProjectParams();
  const projectId = projectIdProp ?? numericId;
  const [selectedArcId, setSelectedArcId] = useState<number | null>(null);
  const [selectedChapterId, setSelectedChapterId] = useState<number | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [isYearPickerOpen, setIsYearPickerOpen] = useState(false);
  const [yearPageEnd, setYearPageEnd] = useState(CURRENT_YEAR);

  const {
    data: folderData,
    error: folderError,
    isInitialLoading: isFoldersLoading,
  } = useAsyncResource(async () => {
    const result = await getProjectFolders(projectId, { type: 'ARC' });
    const arcs = result.folders;
    const chaptersByArc: Record<number, ProjectFolderResponse[]> = {};

    await Promise.all(
      arcs.map(async (arc) => {
        try {
          const childResult = await getFolderChildren(arc.id);
          chaptersByArc[arc.id] = childResult.folders;
        } catch {
          chaptersByArc[arc.id] = [];
        }
      }),
    );

    return { arcs, chaptersByArc };
  }, [projectId]);

  const arcs = folderData?.arcs ?? [];
  const chaptersByArc = folderData?.chaptersByArc ?? {};
  const chapters = selectedArcId ? (chaptersByArc[selectedArcId] ?? []) : [];

  const allChapterOptions: ChapterOption[] = useMemo(
    () =>
      (folderData?.arcs ?? []).flatMap((arc) =>
        (folderData?.chaptersByArc[arc.id] ?? []).map((chapter) => ({
          arcTitle: arc.title,
          id: chapter.id,
          title: chapter.title,
        })),
      ),
    [folderData],
  );

  const {
    data: stats,
    error: statsError,
    isInitialLoading: isStatsLoading,
    isRefreshing: isStatsRefreshing,
    reload: reloadStats,
  } = useAsyncResource(
    () =>
      getProjectStats(projectId, {
        arcId: selectedChapterId ? undefined : (selectedArcId ?? undefined),
        chapterId: selectedChapterId ?? undefined,
        year: selectedYear ?? undefined,
      }),
    [projectId, selectedArcId, selectedChapterId, selectedYear],
  );

  const dataMinYear = stats?.minYear ?? CURRENT_YEAR;
  const dataMaxYear = stats?.maxYear ?? CURRENT_YEAR;
  const effectiveYear = selectedYear ?? stats?.year ?? CURRENT_YEAR;

  const handleArcChange = (value: string) => {
    if (value === ALL_SCOPE) {
      setSelectedArcId(null);
      setSelectedChapterId(null);
      return;
    }
    setSelectedArcId(Number(value));
    setSelectedChapterId(null);
  };

  const handleChapterChange = (value: string) => {
    setSelectedChapterId(value === ALL_SCOPE ? null : Number(value));
  };

  const handleYearPickerOpenChange = (nextOpen: boolean) => {
    setIsYearPickerOpen(nextOpen);
    if (nextOpen) {
      setYearPageEnd(dataMaxYear);
    }
  };

  const yearPageOptions = Array.from({ length: YEARS_PER_PAGE }, (_, index) => yearPageEnd - index);

  const canGoOlder = yearPageEnd - YEARS_PER_PAGE + 1 > dataMinYear;
  const canGoNewer = yearPageEnd < dataMaxYear;

  const handlePrevYears = () => {
    if (!canGoOlder) return;
    setYearPageEnd((prev) => prev - YEARS_PER_PAGE);
  };

  const handleNextYears = () => {
    if (!canGoNewer) return;
    setYearPageEnd((prev) => Math.min(prev + YEARS_PER_PAGE, CURRENT_YEAR));
  };

  const handleYearSelect = (year: number) => {
    setSelectedYear(year);
    setIsYearPickerOpen(false);
  };

  const isLoading = isFoldersLoading || isStatsLoading;
  const error = folderError ?? statsError;
  const showEmptyState = !error && stats !== null && isStatsEmpty(stats);

  return (
    <section className="px-5 py-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-[24px] font-black leading-8 text-white">Project Stats</h1>
            <RefreshingIndicator isRefreshing={isStatsRefreshing} />
          </div>
          <p className="mt-1 text-sm font-medium text-[#aeb7c2]">
            Views, sales, revenue and reviews imported per chapter from CSV.
            {stats ? ` Showing year ${stats.year}.` : ''}
          </p>
        </div>

        <div className="flex items-end gap-2">
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#aeb7c2]">
              Arc
            </span>
            <Select
              disabled={isFoldersLoading}
              onValueChange={handleArcChange}
              value={selectedArcId ? String(selectedArcId) : ALL_SCOPE}
            >
              <SelectTrigger className="h-9 w-[160px] rounded-[4px] border-[#50555D] bg-[#161c25] text-xs text-[#dde3ef]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-[#50555D] bg-[#1a2029] text-white">
                <SelectItem value={ALL_SCOPE}>All Arcs</SelectItem>
                {arcs.map((arc) => (
                  <SelectItem key={arc.id} value={String(arc.id)}>
                    {arc.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#aeb7c2]">
              Chapter
            </span>
            <Select
              disabled={!selectedArcId || chapters.length === 0}
              onValueChange={handleChapterChange}
              value={selectedChapterId ? String(selectedChapterId) : ALL_SCOPE}
            >
              <SelectTrigger className="h-9 w-[160px] rounded-[4px] border-[#50555D] bg-[#161c25] text-xs text-[#dde3ef]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-[#50555D] bg-[#1a2029] text-white">
                <SelectItem value={ALL_SCOPE}>All Chapters</SelectItem>
                {chapters.map((chapter) => (
                  <SelectItem key={chapter.id} value={String(chapter.id)}>
                    {chapter.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#aeb7c2]">
              Year
            </span>
            <Popover onOpenChange={handleYearPickerOpenChange} open={isYearPickerOpen}>
              <PopoverTrigger asChild>
                <button
                  className="flex h-9 w-[130px] items-center gap-2 rounded-[4px] border border-[#50555D] bg-[#161c25] px-3 text-xs font-bold text-[#dde3ef]"
                  type="button"
                >
                  <CalendarDays className="size-3.5 text-[#8b94a1]" />
                  {effectiveYear}
                </button>
              </PopoverTrigger>
              <PopoverContent
                align="start"
                className="w-[220px] border-[#50555D] bg-[#1a2029] p-2 text-white"
              >
                <div className="flex items-center justify-between px-1 pb-2">
                  <button
                    aria-label="Older years"
                    className="grid size-6 place-items-center rounded-[4px] text-[#8b94a1] hover:bg-[#242a33] hover:text-white disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent"
                    disabled={!canGoOlder}
                    onClick={handlePrevYears}
                    type="button"
                  >
                    <ChevronLeft className="size-4" />
                  </button>
                  <span className="text-[11px] font-bold text-[#aeb7c2]">
                    {yearPageOptions[yearPageOptions.length - 1]}–{yearPageOptions[0]}
                  </span>
                  <button
                    aria-label="Newer years"
                    className="grid size-6 place-items-center rounded-[4px] text-[#8b94a1] hover:bg-[#242a33] hover:text-white disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent"
                    disabled={!canGoNewer}
                    onClick={handleNextYears}
                    type="button"
                  >
                    <ChevronRight className="size-4" />
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {yearPageOptions.map((yearOption) => {
                    const isOutOfRange = yearOption < dataMinYear || yearOption > dataMaxYear;
                    return (
                      <button
                        className={`rounded-[4px] px-2 py-1.5 text-xs font-bold ${
                          isOutOfRange
                            ? 'cursor-not-allowed text-[#4b535f]'
                            : effectiveYear === yearOption
                              ? 'bg-[#FFD369] text-[#101820]'
                              : 'text-[#dde3ef] hover:bg-[#242a33]'
                        }`}
                        disabled={isOutOfRange}
                        key={yearOption}
                        onClick={() => handleYearSelect(yearOption)}
                        type="button"
                      >
                        {yearOption}
                      </button>
                    );
                  })}
                </div>
              </PopoverContent>
            </Popover>
          </div>

          <ImportProjectStatsDialog
            chapters={allChapterOptions}
            defaultChapterId={selectedChapterId}
            onImported={reloadStats}
            projectId={projectId}
          />
        </div>
      </div>

      <div className="mt-5">
        {isLoading ? (
          <LoadingState message="Loading project stats..." minHeight="420px" />
        ) : error ? (
          <p className="rounded-[6px] border border-red-400/30 bg-red-950/20 px-4 py-3 text-xs font-bold text-red-300">
            {error}
          </p>
        ) : showEmptyState || !stats ? (
          <EmptyStatsState />
        ) : (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
              <KpiCard
                icon={<Eye className="size-4" />}
                label="Total Views"
                meta={String(stats.year)}
                value={stats.summary.totalViews.toLocaleString()}
              />
              <KpiCard
                icon={<TrendingUp className="size-4" />}
                label="Total Sales"
                meta={String(stats.year)}
                value={stats.summary.totalSales.toLocaleString()}
              />
              <KpiCard
                icon={<DollarSign className="size-4" />}
                label="Total Revenue"
                meta={String(stats.year)}
                value={stats.summary.totalRevenue.toLocaleString()}
              />
              <KpiCard
                icon={<MessageSquareText className="size-4" />}
                label="Total Reviews"
                meta={String(stats.year)}
                value={stats.summary.totalReviews.toLocaleString()}
              />
              <KpiCard
                icon={<Star className="size-4" />}
                label="Average Rating"
                meta="Out of 5"
                value={stats.summary.averageRating.toFixed(1)}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              <StatsLineChart
                color="#60A5FA"
                data={chartData(stats.months, 'views')}
                icon={<Eye className="size-4" />}
                title="Views Over Time"
                valueFormatter={(value) => value.toLocaleString()}
              />
              <StatsLineChart
                color="#FFD369"
                data={chartData(stats.months, 'sales')}
                icon={<TrendingUp className="size-4" />}
                title="Sales Over Time"
                valueFormatter={(value) => value.toLocaleString()}
              />
              <StatsLineChart
                color="#34D399"
                data={chartData(stats.months, 'revenue')}
                icon={<DollarSign className="size-4" />}
                title="Revenue Over Time"
                valueFormatter={(value) => value.toLocaleString()}
              />
              <StatsLineChart
                color="#F472B6"
                data={chartData(stats.months, 'reviews')}
                icon={<MessageSquareText className="size-4" />}
                title="Reviews Over Time"
                valueFormatter={(value) => value.toLocaleString()}
              />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
