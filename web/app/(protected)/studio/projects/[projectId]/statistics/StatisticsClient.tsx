'use client';

import { useEffect, useState } from 'react';
import { BarChart3, DollarSign, Eye, MessageSquareText, Star, TrendingUp } from 'lucide-react';
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts';

import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LoadingState } from '@/components/ui/loading-state';

import {
  getProjectStatistics,
  isStatisticsEmpty,
  type ProjectStatistics,
  type StatisticsSeriesPoint,
} from '@/services/project-statistics.service';

type StatisticsClientProps = {
  projectId: number;
};

const MONTH_OPTIONS = [
  { label: 'January', value: 1 },
  { label: 'February', value: 2 },
  { label: 'March', value: 3 },
  { label: 'April', value: 4 },
  { label: 'May', value: 5 },
  { label: 'June', value: 6 },
  { label: 'July', value: 7 },
  { label: 'August', value: 8 },
  { label: 'September', value: 9 },
  { label: 'October', value: 10 },
  { label: 'November', value: 11 },
  { label: 'December', value: 12 },
];

function getYearOptions() {
  const currentYear = new Date().getFullYear();
  return Array.from({ length: 5 }, (_, index) => currentYear - index);
}

// Temporary local sample data so the UI can be previewed before the backend
// implements GET /projects/:id/statistics (see web/docs/statistics-module-api-notes.md).
// Only shown when the user explicitly clicks "Xem dữ liệu mẫu" — never fetched from
// the API and never shown by default. Remove once real data is wired up.
const SAMPLE_STATISTICS: ProjectStatistics = {
  salesOverTime: [
    { date: '2026-02', value: 6200 },
    { date: '2026-03', value: 7400 },
    { date: '2026-04', value: 8100 },
    { date: '2026-05', value: 9600 },
    { date: '2026-06', value: 11200 },
    { date: '2026-07', value: 12800 },
  ],
  totals: {
    averageRating: 4.6,
    totalRatingsCount: 340,
    totalSales: 12800,
    totalViews: 482000,
  },
  viewsOverTime: [
    { date: '2026-02', value: 210000 },
    { date: '2026-03', value: 265000 },
    { date: '2026-04', value: 301000 },
    { date: '2026-05', value: 358000 },
    { date: '2026-06', value: 420000 },
    { date: '2026-07', value: 482000 },
  ],
};

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
        <p className="text-[11px] font-black uppercase tracking-[0.04em] text-[#aeb7c2]">
          {label}
        </p>
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-2xl font-black text-white">{value}</span>
        <span className="text-xs font-black text-[#FFD369]">{meta}</span>
      </div>
    </article>
  );
}

function StatisticsLineChart({
  color,
  data,
  icon,
  title,
  valueFormatter,
}: {
  color: string;
  data: StatisticsSeriesPoint[];
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
          <XAxis dataKey="date" fontSize={11} stroke="#5b626d" tickLine={false} />
          <YAxis
            fontSize={11}
            stroke="#5b626d"
            tickFormatter={(value) => valueFormatter(Number(value))}
            tickLine={false}
            width={56}
          />
          <ChartTooltip content={<ChartTooltipContent />} cursor={{ stroke: '#39424f' }} />
          <Line
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

function StatisticsFilterBar({
  disabled,
  month,
  onMonthChange,
  onYearChange,
  year,
}: {
  disabled: boolean;
  month: number;
  onMonthChange: (month: number) => void;
  onYearChange: (year: number) => void;
  year: number;
}) {
  const yearOptions = getYearOptions();

  return (
    <div className="flex items-end gap-2">
      <div className="flex flex-col gap-1">
        <span className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#aeb7c2]">
          Month
        </span>
        <Select
          disabled={disabled}
          onValueChange={(value) => onMonthChange(Number(value))}
          value={String(month)}
        >
          <SelectTrigger className="h-9 w-[152px] rounded-[4px] border-[#50555D] bg-[#161c25] text-xs text-[#dde3ef]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="border-[#50555D] bg-[#1a2029] text-white">
            {MONTH_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={String(option.value)}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#aeb7c2]">
          Year
        </span>
        <Select
          disabled={disabled}
          onValueChange={(value) => onYearChange(Number(value))}
          value={String(year)}
        >
          <SelectTrigger className="h-9 w-[110px] rounded-[4px] border-[#50555D] bg-[#161c25] text-xs text-[#dde3ef]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="border-[#50555D] bg-[#1a2029] text-white">
            {yearOptions.map((yearOption) => (
              <SelectItem key={yearOption} value={String(yearOption)}>
                {yearOption}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

function EmptyStatisticsState({ onPreviewSample }: { onPreviewSample: () => void }) {
  return (
    <div className="flex h-[280px] flex-col items-center justify-center gap-3 rounded-[5px] border border-dashed border-[#303842] bg-[#1a222d]">
      <BarChart3 className="size-7 text-[#5b626d]" />
      <p className="text-xs font-bold text-[#8b94a1]">Không có dữ liệu thống kê.</p>
      <button
        className="text-xs font-black text-[#FFD369] hover:underline"
        onClick={onPreviewSample}
        type="button"
      >
        Xem giao diện với dữ liệu mẫu
      </button>
    </div>
  );
}

export function StatisticsClient({ projectId }: StatisticsClientProps) {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [stats, setStats] = useState<ProjectStatistics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSample, setShowSample] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadStatistics() {
      setIsLoading(true);
      setError(null);

      try {
        const result = await getProjectStatistics(projectId, { month, year });
        if (isMounted) {
          setStats(result);
        }
      } catch {
        if (isMounted) {
          setStats(null);
          setError('Unable to load statistics.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadStatistics();

    return () => {
      isMounted = false;
    };
  }, [projectId, month, year]);

  const showEmptyState = !showSample && !error && stats !== null && isStatisticsEmpty(stats);
  const displayStats = showSample ? SAMPLE_STATISTICS : stats;

  return (
    <section className="px-5 py-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-[24px] font-black leading-8 text-white">Statistics</h1>
            {showSample ? (
              <span className="rounded-full border border-[#6c5516] bg-[#30270d] px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-[#ffd35b]">
                Dữ liệu mẫu
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-sm font-medium text-[#aeb7c2]">
            Sales, views, and ratings for this manga.
          </p>
        </div>

        <StatisticsFilterBar
          disabled={isLoading}
          month={month}
          onMonthChange={setMonth}
          onYearChange={setYear}
          year={year}
        />
      </div>

      <div className="mt-5">
        {isLoading ? (
          <LoadingState message="Loading statistics..." variant="detail" />
        ) : error ? (
          <p className="rounded-[6px] border border-red-400/30 bg-red-950/20 px-4 py-3 text-xs font-bold text-red-300">
            {error}
          </p>
        ) : showEmptyState || !displayStats ? (
          <EmptyStatisticsState onPreviewSample={() => setShowSample(true)} />
        ) : (
          <div className="space-y-5">
            {showSample ? (
              <button
                className="text-[11px] font-bold text-[#8b94a1] hover:text-white hover:underline"
                onClick={() => setShowSample(false)}
                type="button"
              >
                Ẩn dữ liệu mẫu
              </button>
            ) : null}

            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <KpiCard
                icon={<DollarSign className="size-4" />}
                label="Total Sales"
                meta="This period"
                value={displayStats.totals.totalSales.toLocaleString()}
              />
              <KpiCard
                icon={<Eye className="size-4" />}
                label="Total Views"
                meta="This period"
                value={displayStats.totals.totalViews.toLocaleString()}
              />
              <KpiCard
                icon={<MessageSquareText className="size-4" />}
                label="Total Ratings"
                meta="This period"
                value={displayStats.totals.totalRatingsCount.toLocaleString()}
              />
              <KpiCard
                icon={<Star className="size-4" />}
                label="Average Rating"
                meta="Out of 5"
                value={displayStats.totals.averageRating.toFixed(1)}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              <StatisticsLineChart
                color="#FFD369"
                data={displayStats.salesOverTime}
                icon={<TrendingUp className="size-4" />}
                title="Sales Over Time"
                valueFormatter={(value) => value.toLocaleString()}
              />
              <StatisticsLineChart
                color="#60A5FA"
                data={displayStats.viewsOverTime}
                icon={<Eye className="size-4" />}
                title="Views Over Time"
                valueFormatter={(value) => value.toLocaleString()}
              />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
