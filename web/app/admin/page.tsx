'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Activity, ShieldCheck, UserCheck, UserPlus, Users } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { MetricCard } from './components/MetricCard';
import { PageHeader } from './components/PageHeader';
import { useAdminStore } from './store/admin-store';

type ChartPoint = {
  key: string;
  label: string;
  value: number;
};

const EMPTY_GROWTH_BY_MONTH: Record<string, number> = {};

function formatMonthKey(year: number, monthIndex: number) {
  return `${year}-${String(monthIndex + 1).padStart(2, '0')}`;
}

function getYearMonthKeys(year: number) {
  const now = new Date();
  const monthCount = year === now.getFullYear() ? now.getMonth() + 1 : 12;

  return Array.from({ length: monthCount }, (_, index) => {
    const date = new Date(year, index, 1);

    return {
      key: formatMonthKey(year, index),
      label: date.toLocaleDateString('en-US', { month: 'short' }),
    };
  });
}

function buildGrowthPoints(growthByMonth: Record<string, number>, year: number) {
  return getYearMonthKeys(year).map(({ key, label }) => ({
    key,
    label,
    value: growthByMonth[key] ?? 0,
  }));
}

function getGrowthYears(growthByMonth: Record<string, number>) {
  const currentYear = new Date().getFullYear();
  const years = Object.keys(growthByMonth)
    .map((key) => Number(key.slice(0, 4)))
    .filter((year) => Number.isFinite(year));

  return Array.from(new Set([currentYear, ...years])).sort(
    (firstYear, secondYear) => secondYear - firstYear,
  );
}

function formatMetric(value: number) {
  return new Intl.NumberFormat('en-US').format(value);
}

function getNiceChartScale(maxValue: number, tickCount = 5) {
  if (maxValue <= 0) {
    return {
      max: 4,
      ticks: [4, 3, 2, 1, 0],
    };
  }

  const stepBase = maxValue / (tickCount - 1);
  const magnitude = 10 ** Math.floor(Math.log10(stepBase));
  const normalizedStep = stepBase / magnitude;
  const niceStep = normalizedStep <= 1 ? 1 : normalizedStep <= 2 ? 2 : normalizedStep <= 5 ? 5 : 10;
  const step = niceStep * magnitude;
  const max = step * (tickCount - 1);

  return {
    max,
    ticks: Array.from({ length: tickCount }, (_, index) => max - step * index),
  };
}

function buildLinePoints(values: number[], axisMax: number) {
  const width = 1000;
  const height = 230;
  const horizontalPadding = 44;
  const verticalPadding = 26;
  const drawableWidth = width - horizontalPadding * 2;
  const drawableHeight = height - verticalPadding * 2;

  return values.map((value, index) => {
    const x =
      horizontalPadding + (values.length <= 1 ? 0 : (index / (values.length - 1)) * drawableWidth);
    const y = height - verticalPadding - (value / axisMax) * drawableHeight;

    return { x, y };
  });
}

function UserGrowthLineChart({ points }: { points: ChartPoint[] }) {
  const maxValue = Math.max(...points.map((point) => point.value), 0);
  const axis = getNiceChartScale(maxValue);
  const linePoints = buildLinePoints(
    points.map((point) => point.value),
    axis.max,
  );
  const linePath = linePoints.map((point) => `${point.x},${point.y}`).join(' ');
  const gridLines = axis.ticks.map((_, index) => 26 + index * 44.5);

  return (
    <div className="rounded-[5px] border border-[#303842] bg-[#0f1720] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
      <div className="mb-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.08em] text-[#aeb7c2]">
        <Activity className="size-4" />
        Users Over Time
      </div>
      <div>
        <div className="h-[230px] border-b border-[#303842]">
          <svg
            aria-label="User growth"
            className="h-full w-full overflow-visible"
            preserveAspectRatio="none"
            role="img"
            viewBox="0 0 1000 230"
          >
            {gridLines.map((y) => (
              <line
                key={y}
                stroke="#26303b"
                strokeWidth="1"
                vectorEffect="non-scaling-stroke"
                x1="0"
                x2="1000"
                y1={y}
                y2={y}
              />
            ))}
            <polyline
              fill="none"
              points={linePath}
              stroke="#FFD369"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="3"
              vectorEffect="non-scaling-stroke"
            />
            {linePoints.map((point, index) => (
              <g key={points[index].key}>
                <circle
                  cx={point.x}
                  cy={point.y}
                  fill="#FFD369"
                  r="5"
                  stroke="#101820"
                  strokeWidth="2"
                  vectorEffect="non-scaling-stroke"
                />
                <text
                  className="fill-[#dce7f3] text-[13px] font-black"
                  textAnchor="middle"
                  x={point.x}
                  y={Math.max(point.y - 14, 14)}
                >
                  {formatMetric(points[index].value)}
                </text>
              </g>
            ))}
          </svg>
        </div>
        <div
          className="mt-2 grid text-[11px] font-medium text-[#5f6875]"
          style={{ gridTemplateColumns: `repeat(${points.length}, minmax(0, 1fr))` }}
        >
          {points.map((point) => (
            <span className="text-center" key={point.key}>
              {point.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const [growthYear, setGrowthYear] = useState(new Date().getFullYear());
  const stats = useAdminStore((state) => state.stats);
  const allRoles = useAdminStore((state) => state.allRoles);
  const error = useAdminStore((state) => state.dashboardError);
  const loadDashboardData = useAdminStore((state) => state.loadDashboardData);
  const growthByMonth = stats?.growthByMonth ?? EMPTY_GROWTH_BY_MONTH;
  const currentYearKey = String(new Date().getFullYear());
  const totalUsers = stats?.total ?? 0;
  const activeUsers = stats?.active ?? 0;
  const totalRoles = allRoles.length;
  const newUsersCurrentYear = stats?.growthByYear?.[currentYearKey] ?? 0;
  const growthYears = getGrowthYears(growthByMonth);
  const growthPoints = useMemo(
    () => buildGrowthPoints(growthByMonth, growthYear),
    [growthByMonth, growthYear],
  );

  useEffect(() => {
    queueMicrotask(() => {
      void loadDashboardData();
    });
  }, [loadDashboardData]);

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Operational overview for admin staff, users, and role coverage."
      />

      {error ? (
        <p className="rounded-lg border border-red-400/40 bg-red-950/30 px-4 py-3 text-sm font-medium text-red-200">
          {error}
        </p>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Total Users" value={`${totalUsers}`} icon={Users} />
        <MetricCard label="Total Roles" value={`${totalRoles}`} icon={ShieldCheck} />
        <MetricCard label="Active Users" value={`${activeUsers}`} icon={UserCheck} />
        <MetricCard
          label="New Users In Current Year"
          value={`${newUsersCurrentYear}`}
          icon={UserPlus}
        />
      </section>

      <section className="grid w-full gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(260px,360px)]">
        <Card className="border-[var(--admin-border)] bg-[var(--admin-table)] shadow-sm">
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle className="text-lg text-[var(--admin-text)]">User Growth</CardTitle>
            </div>
            <Select
              onValueChange={(value) => setGrowthYear(Number(value))}
              value={String(growthYear)}
            >
              <SelectTrigger className="h-9 w-28 border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-text)]">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent
                align="start"
                className="w-[var(--radix-select-trigger-width)] min-w-0 border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-text)]"
                position="popper"
              >
                {growthYears.map((year) => (
                  <SelectItem key={year} value={String(year)}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent>
            <UserGrowthLineChart points={growthPoints} />
          </CardContent>
        </Card>

        <Card className="border-[var(--admin-border)] bg-[var(--admin-surface)] shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg text-[var(--admin-text)]">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <Button
              asChild
              className="justify-start !bg-[#FFD369] !text-[#222831] hover:!bg-[#ffe29a]"
            >
              <Link href="/admin/users?create=user">
                <UserPlus className="size-4" />
                Create User
              </Link>
            </Button>
            <Button
              asChild
              className="justify-start border-[#4A5260] bg-[#393E46] text-[#EEEEEE] hover:border-[#FFD369] hover:bg-[#303640]"
              variant="outline"
            >
              <Link href="/admin/roles">
                <ShieldCheck className="size-4" />
                Review Roles
              </Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    </>
  );
}
