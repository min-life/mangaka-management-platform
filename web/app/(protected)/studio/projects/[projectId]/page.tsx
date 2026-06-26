import {
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  FileText,
  Upload,
  Users,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

const statCards = [
  { label: 'Active Applications', meta: '+8%', value: '12' },
  { label: 'Open Tasks', meta: 'High Load', value: '47' },
  { label: 'Active Members', meta: 'Artists & Editors', value: '8' },
  { label: 'Publishing Requests', meta: 'Pending Approval', value: '3' },
];

const deadlines = [
  {
    label: 'Chapter 43 Initial Draft',
    meta: '2 days left - June 14',
    tone: 'text-red-300',
    value: 78,
  },
  {
    label: 'Tankobon Vol. 4 Layout',
    meta: '8 days left - June 20',
    tone: 'text-[#aeb7c2]',
    value: 42,
  },
];

const approvals = [
  { icon: FileText, label: 'Chapter 42 Cover Art', meta: 'Submitted by J. Arisawa' },
  { icon: FileText, label: 'Script Review - Act 3', meta: 'Submitted by M. Chen' },
  { icon: FileText, label: 'Color Plates - Spread 2', meta: 'Submitted by K. Tanaka' },
];

export default function ProjectDashboardPage() {
  return (
    <section className="px-5 py-6">
      <div className="flex items-start justify-between gap-6">
        <div className="flex items-center gap-4">
          <img
            alt=""
            className="size-16 rounded-[5px] border border-[#39424f] object-cover"
            src="https://images.unsplash.com/photo-1519608487953-e999c86e7455?q=80&w=160&auto=format&fit=crop"
          />
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-[24px] font-black leading-8 text-white">Neon Tokyo Drifters</h1>
              <Badge
                className="h-6 rounded-full border border-[#315846] bg-[#14291f] px-3 text-[10px] font-black text-[#9df2c7]"
                variant="outline"
              >
                In Production
              </Badge>
            </div>
            <p className="mt-1 text-xs font-bold text-[#aeb7c2]">
              Editor Board: Shonen Weekly - Unit Alpha
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            className="h-9 rounded-[4px] border-[#4b535f] bg-[#222a34] px-4 text-xs font-black text-white hover:bg-[#303842]"
            variant="outline"
          >
            <Upload className="size-4" />
            Upload Assets
          </Button>
          <Button className="h-9 rounded-[4px] bg-white px-4 text-xs font-black text-[#101820] hover:bg-[#e6e8eb]">
            Create Task
          </Button>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <article className="rounded-[5px] border border-[#39424f] bg-[#1a222d] p-4" key={stat.label}>
            <p className="text-[11px] font-black uppercase tracking-[0.04em] text-[#aeb7c2]">
              {stat.label}
            </p>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-white">{stat.value}</span>
              <span className="text-xs font-black text-[#FFD369]">{stat.meta}</span>
            </div>
          </article>
        ))}
      </div>

      <div className="mt-5 grid grid-cols-[minmax(0,1fr)_280px] gap-5">
        <section className="rounded-[5px] border border-[#39424f] bg-[#1a222d] p-5">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-sm font-black text-white">Production Velocity</h2>
            <div className="flex items-center gap-2 text-[#aeb7c2]">
              <CalendarDays className="size-4" />
              <CheckCircle2 className="size-4" />
            </div>
          </div>
          <div className="flex h-[190px] items-end gap-5 border-b border-[#39424f] px-2 pb-3">
            {[38, 54, 46, 62, 86, 58].map((height, index) => (
              <div className="flex flex-1 flex-col items-center gap-3" key={height + index}>
                <div className="flex h-[140px] w-full items-end justify-center">
                  <span
                    className="w-7 rounded-t-[3px] bg-[#FFD369]"
                    style={{ height: `${height}%` }}
                  />
                </div>
                <span className="text-[11px] font-bold text-[#aeb7c2]">CH {38 + index}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center gap-5 text-xs font-bold text-[#aeb7c2]">
            <span className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-[#FFD369]" />
              Completed Panels
            </span>
            <span className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-[#5b626d]" />
              Remaining Work
            </span>
          </div>
        </section>

        <aside className="rounded-[5px] border border-[#39424f] bg-[#1a222d] p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-black text-white">Deadlines</h2>
            <CalendarDays className="size-4 text-[#dce7f3]" />
          </div>
          <div className="grid gap-3">
            {deadlines.map((deadline) => (
              <article className="rounded-[5px] border border-[#303842] bg-[#202832] p-4" key={deadline.label}>
                <div className="flex items-start justify-between gap-3">
                  <p className="text-xs font-black leading-5 text-white">{deadline.label}</p>
                  <span className={`text-[10px] font-black ${deadline.tone}`}>Queue</span>
                </div>
                <p className="mt-1 flex items-center gap-1 text-[11px] font-bold text-[#aeb7c2]">
                  <Clock3 className="size-3" />
                  {deadline.meta}
                </p>
                <Progress
                  className="mt-3 h-1.5 rounded-none bg-[#39424f] [&_[data-slot=progress-indicator]]:bg-[#FFD369]"
                  value={deadline.value}
                />
              </article>
            ))}
          </div>
        </aside>
      </div>

      <div className="mt-5 grid grid-cols-[minmax(0,1fr)_360px] gap-5">
        <section className="rounded-[5px] border border-[#39424f] bg-[#1a222d] p-5">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-sm font-black text-white">Recent Activity</h2>
            <button className="text-xs font-black text-[#FFD369]" type="button">
              View All
            </button>
          </div>
          <div className="grid gap-5">
            {['K. Tanaka uploaded Chapter 42 inks', 'S. Sato commented on Storyboard', 'System finalized Chapter 41 metadata'].map(
              (activity, index) => (
                <div className="flex gap-4" key={activity}>
                  <span className="grid size-8 place-items-center rounded-full bg-[#303842] text-[#dce7f3]">
                    {index === 0 ? <Upload className="size-4" /> : <Users className="size-4" />}
                  </span>
                  <div>
                    <p className="text-xs font-black text-white">{activity}</p>
                    <p className="mt-1 text-[11px] font-bold leading-5 text-[#aeb7c2]">
                      Chapter production activity synced across the editorial board.
                    </p>
                    <p className="mt-1 text-[10px] font-black text-[#8b94a1]">{index + 1}h ago</p>
                  </div>
                </div>
              ),
            )}
          </div>
        </section>

        <section className="rounded-[5px] border border-[#39424f] bg-[#1a222d] p-5">
          <h2 className="mb-5 text-sm font-black text-white">Approval Queue</h2>
          <div className="grid gap-3">
            {approvals.map((approval) => {
              const Icon = approval.icon;

              return (
                <article
                  className="flex items-center gap-3 rounded-[5px] border border-[#303842] bg-[#202832] p-3"
                  key={approval.label}
                >
                  <span className="grid size-10 place-items-center rounded-[4px] bg-[#0f151d] text-[#dce7f3]">
                    <Icon className="size-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-black text-white">{approval.label}</p>
                    <p className="mt-1 truncate text-[11px] font-bold text-[#aeb7c2]">
                      {approval.meta}
                    </p>
                  </div>
                  <Badge className="h-6 rounded-[3px] bg-[#30270d] px-2 text-[9px] font-black text-[#ffd35b]">
                    Pending
                  </Badge>
                  <ChevronRight className="size-4 text-[#aeb7c2]" />
                </article>
              );
            })}
          </div>
        </section>
      </div>
    </section>
  );
}
