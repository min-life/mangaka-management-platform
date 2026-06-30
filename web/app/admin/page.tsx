import { Plus, Settings, ShieldCheck, UserCheck, UserPlus, Users } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { MetricCard } from './components/MetricCard';
import { PageHeader } from './components/PageHeader';
import { ADMIN_USERS, RECENT_ACTIVITIES, USER_GROWTH_POINTS } from './data/admin-data';

const USER_GROWTH_BAR_CLASSES = [
  'h-[42%]',
  'h-[50%]',
  'h-[48%]',
  'h-[59%]',
  'h-[56%]',
  'h-[68%]',
  'h-[74%]',
  'h-[81%]',
  'h-[86%]',
  'h-[91%]',
  'h-[94%]',
  'h-[100%]',
] as const;

// Codex #admin-ui start
export default function AdminDashboardPage() {
  const activeUsers = ADMIN_USERS.filter((user) => user.status === 'Active').length;

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Operational overview for admin staff, roles, activity, and access settings."
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Total Staff" value="128" change="+12 this month" icon={Users} />
        <MetricCard label="Total Roles" value="6" change="Default role set" icon={ShieldCheck} />
        <MetricCard label="Active Users" value={`${activeUsers}`} change="Mock active sample" icon={UserCheck} />
        <MetricCard label="New Staff This Month" value="18" change="+9.4% from last month" icon={UserPlus} />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.45fr_0.8fr]">
        <Card className="border-[#4A5260] bg-[#0c1219] shadow-sm">
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle className="text-lg text-[#EEEEEE]">Staff Growth</CardTitle>
              <p className="mt-1 text-sm text-[#aeb7c2]">Monthly staff volume across the admin module.</p>
            </div>
            <Badge className="bg-[#FFD369] text-[#222831]">+24%</Badge>
          </CardHeader>
          <CardContent>
            <div className="flex h-72 items-end gap-3 rounded-lg border border-[#4b535f] bg-[#0b1118] p-5">
              {USER_GROWTH_POINTS.map((point, index) => (
                <div key={point} className="flex h-full flex-1 items-end">
                  <div
                    className={`w-full rounded-t-md bg-[#FFD369] ${USER_GROWTH_BAR_CLASSES[index]}`}
                    aria-label={`Growth point ${point}`}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#4A5260] bg-[#393E46] shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg text-[#EEEEEE]">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <Button className="justify-start bg-[#FFD369] text-[#222831] hover:bg-white">
              <UserPlus className="size-4" />
              Create Staff
            </Button>
            <Button
              variant="outline"
              className="justify-start border-[#4A5260] bg-[#393E46] text-[#EEEEEE] hover:border-[#FFD369] hover:bg-[#303640]"
            >
              <ShieldCheck className="size-4" />
              Review Roles
            </Button>
            <Button
              variant="outline"
              className="justify-start border-[#4A5260] bg-[#393E46] text-[#EEEEEE] hover:border-[#FFD369] hover:bg-[#303640]"
            >
              <Settings className="size-4" />
              Open Settings
            </Button>
          </CardContent>
        </Card>
      </section>

      <Card className="border-[#4A5260] bg-[#0c1219] shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg text-[#EEEEEE]">Recent Activities</CardTitle>
          <Button
            variant="outline"
            size="sm"
            className="border-[#4A5260] bg-[#393E46] text-[#EEEEEE] hover:border-[#FFD369] hover:bg-[#303640]"
          >
            <Plus className="size-4" />
            Export
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader className="bg-[#1d242d]">
              <TableRow className="border-[#4b535f] hover:bg-[#1d242d]">
                <TableHead className="text-[#dce7f3]">Actor</TableHead>
                <TableHead className="text-[#dce7f3]">Activity</TableHead>
                <TableHead className="text-right text-[#dce7f3]">Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {RECENT_ACTIVITIES.map((activity) => (
                <TableRow
                  key={`${activity.actor}-${activity.time}`}
                  className="border-[#4b535f] bg-[#0b1118] hover:bg-[#202832]"
                >
                  <TableCell className="font-medium text-[#EEEEEE]">{activity.actor}</TableCell>
                  <TableCell className="text-[#aeb7c2]">{activity.action}</TableCell>
                  <TableCell className="text-right text-[#aeb7c2]">{activity.time}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
// Codex #admin-ui end
