'use client';

import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from 'recharts';
import { Clock3, GitBranch, Target, TrendingUp } from 'lucide-react';

import { ChartContainer, ChartTooltip } from '@/components/ui/chart';
import { cn } from '@/lib/utils';
import type { ProjectMetrics as ProjectMetricsValue, ProjectStatus } from '@/services/project-metrics';

const STATUS_STYLES: Record<ProjectStatus, { bg: string; border: string; color: string; label: string }> = {
  HIATUS: { bg: '#30270d', border: '#6c5516', color: '#ffd35b', label: 'Hiatus' },
  IN_PRODUCTION: { bg: '#14291f', border: '#315846', color: '#9df2c7', label: 'In Production' },
  STORYBOARDING: { bg: '#2a454a', border: '#4f6e73', color: '#9ddde8', label: 'Storyboarding' },
};

const PROGRESS_COLOR = '#FFD369';
const CYCLE_TIME_COLOR = '#60A5FA';

function niceCycleTimeMax(value: number) {
  return Math.max(10, Math.ceil((value * 1.4) / 5) * 5);
}

function MetricCard({
  children,
  icon,
  label,
}: {
  children: React.ReactNode;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <div className="rounded-[5px] border border-[#39424f] bg-[#0e141c] p-4">
      <div className="flex items-center gap-2 text-[#8b94a1]">
        {icon}
        <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#aeb7c2]">{label}</p>
      </div>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function MetricTooltip({
  active,
  color,
  formatValue,
  payload,
}: {
  active?: boolean;
  color: string;
  formatValue: (value: number) => string;
  payload?: Array<{ value?: number }>;
}) {
  if (!active || !payload?.length || payload[0].value == null) {
    return null;
  }

  return (
    <div className="rounded-[6px] border border-[#39424f] bg-[#161c25] px-3 py-2 shadow-lg shadow-black/40">
      <div className="flex items-center gap-2">
        <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: color }} />
        <span className="text-sm font-black text-white">{formatValue(payload[0].value)}</span>
      </div>
    </div>
  );
}

function MetricBarChart({
  color,
  formatValue,
  max,
  name,
  value,
}: {
  color: string;
  formatValue: (value: number) => string;
  max: number;
  name: string;
  value: number;
}) {
  const data = [{ name, value }];

  return (
    <ChartContainer className="aspect-auto h-[110px] w-full" config={{ value: { color, label: name } }}>
      <BarChart data={data} margin={{ bottom: 0, left: 4, right: 4, top: 20 }}>
        <CartesianGrid stroke="#26303c" vertical={false} />
        <XAxis dataKey="name" hide />
        <YAxis domain={[0, max]} hide />
        <ChartTooltip content={<MetricTooltip color={color} formatValue={formatValue} />} cursor={false} />
        <Bar dataKey="value" fill={color} maxBarSize={28} name={name} radius={[4, 4, 0, 0]}>
          <LabelList
            className="fill-white text-xs font-black"
            dataKey="value"
            formatter={(v) => formatValue(Number(v))}
            position="top"
          />
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}

export function ProjectMetrics({
  className,
  columns = 4,
  metrics,
  updatedAt,
}: {
  className?: string;
  columns?: 2 | 4;
  metrics: ProjectMetricsValue;
  updatedAt?: string;
}) {
  const status = STATUS_STYLES[metrics.status];
  const progress = Math.max(0, Math.min(100, Math.round(metrics.progress)));
  const cycleTimeDays = Math.max(0, metrics.cycleTimeDays);

  return (
    <div
      className={cn(
        'grid gap-4',
        columns === 2 ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-4',
        className,
      )}
    >
      <MetricCard icon={<TrendingUp className="size-4" />} label="Progress">
        <MetricBarChart
          color={PROGRESS_COLOR}
          formatValue={(v) => `${Math.round(v)}%`}
          max={100}
          name="Progress"
          value={progress}
        />
      </MetricCard>

      <MetricCard icon={<Clock3 className="size-4" />} label="Cycle Time">
        <MetricBarChart
          color={CYCLE_TIME_COLOR}
          formatValue={(v) => `${v}d`}
          max={niceCycleTimeMax(cycleTimeDays)}
          name="Cycle Time"
          value={cycleTimeDays}
        />
      </MetricCard>

      <MetricCard icon={<GitBranch className="size-4" />} label="Status">
        <span
          className="inline-flex rounded-[4px] border px-2.5 py-1 text-[11px] font-black"
          style={{ backgroundColor: status.bg, borderColor: status.border, color: status.color }}
        >
          {status.label}
        </span>
      </MetricCard>

      <MetricCard icon={<Target className="size-4" />} label="Target Chapter">
        <span className="text-[15px] font-bold text-white">{metrics.targetChapter}</span>
      </MetricCard>

      {updatedAt ? (
        <p className="col-span-full text-[10px] font-bold text-[#5b626d]">
          Metrics updated {new Date(updatedAt).toLocaleDateString()}
        </p>
      ) : null}
    </div>
  );
}
