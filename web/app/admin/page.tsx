'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ShieldCheck, UserCheck, UserPlus, Users } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { getAdminRoles, getAdminUserStats, getAdminUsers } from './admin-api';
import { MetricCard } from './components/MetricCard';
import { PageHeader } from './components/PageHeader';

type GrowthPoint = {
  label: string;
  value: number;
};

function getRecentMonthKeys(count: number) {
  const now = new Date();

  return Array.from({ length: count }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (count - 1 - index), 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const label = date.toLocaleDateString('en-US', { month: 'short' });

    return { key, label };
  });
}

function buildGrowthPoints(growthByMonth: Record<string, number> = {}) {
  return getRecentMonthKeys(12).map(({ key, label }) => ({
    label,
    value: growthByMonth[key] ?? 0,
  }));
}

// Codex #admin-ui start
export default function AdminDashboardPage() {
  const [totalUsers, setTotalUsers] = useState(0);
  const [activeUsers, setActiveUsers] = useState(0);
  const [newUsersThisMonth, setNewUsersThisMonth] = useState(0);
  const [totalRoles, setTotalRoles] = useState(0);
  const [growthPoints, setGrowthPoints] = useState<GrowthPoint[]>(() => buildGrowthPoints());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    queueMicrotask(() => {
      void Promise.all([getAdminUserStats(), getAdminUsers({ limit: 100 }), getAdminRoles()])
        .then(([stats, usersResult, roles]) => {
          const currentMonth = new Date().getMonth();
          const currentYear = new Date().getFullYear();
          const monthlyUsers = usersResult.users.filter((user) => {
            const createdAt = new Date(user.createdAt);
            return createdAt.getMonth() === currentMonth && createdAt.getFullYear() === currentYear;
          });

          setTotalUsers(stats.total);
          setActiveUsers(stats.active);
          setTotalRoles(roles.length);
          setNewUsersThisMonth(monthlyUsers.length);
          setGrowthPoints(buildGrowthPoints(stats.growthByMonth));
        })
        .catch(() => setError('Unable to load admin dashboard metrics.'));
    });
  }, []);

  const maxGrowthValue = Math.max(...growthPoints.map((point) => point.value), 1);

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
        <MetricCard
          label="Total Users"
          value={`${totalUsers}`}
          change="From users/stats"
          icon={Users}
        />
        <MetricCard
          label="Total Roles"
          value={`${totalRoles}`}
          change="SYS and PRJ roles"
          icon={ShieldCheck}
        />
        <MetricCard
          label="Active Users"
          value={`${activeUsers}`}
          change="Currently enabled"
          icon={UserCheck}
        />
        <MetricCard
          label="New Users This Month"
          value={`${newUsersThisMonth}`}
          change="Based on createdAt"
          icon={UserPlus}
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.45fr_0.8fr]">
        <Card className="border-[var(--admin-border)] bg-[var(--admin-table)] shadow-sm">
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle className="text-lg text-[var(--admin-text)]">User Growth</CardTitle>
              <p className="mt-1 text-sm font-medium text-[var(--admin-text-secondary)]">
                Monthly user volume across the admin module.
              </p>
            </div>
            <Badge className="bg-[#FFD369] text-[#222831]">Live-ready</Badge>
          </CardHeader>
          <CardContent>
            <div className="flex h-72 items-end gap-3 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-table-row)] p-5">
              {growthPoints.map((point) => (
                <div className="flex h-full flex-1 flex-col justify-end gap-2" key={point.label}>
                  <div
                    aria-label={`${point.label}: ${point.value} users`}
                    className="w-full rounded-t-md bg-[var(--admin-chart-bar)] transition-[height]"
                    style={{ height: `${Math.max((point.value / maxGrowthValue) * 100, 4)}%` }}
                  />
                  <span className="text-center text-[10px] font-semibold text-[var(--admin-text-muted)]">
                    {point.label}
                  </span>
                </div>
              ))}
            </div>
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
              <Link href="/admin/users?create=staff">
                <UserPlus className="size-4" />
                Create Staff
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
// Codex #admin-ui end
