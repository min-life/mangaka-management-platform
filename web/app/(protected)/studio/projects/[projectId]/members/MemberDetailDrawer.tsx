'use client';

import { ArrowRight, Calendar, ClipboardList, Mail, Trash2, UserCog } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Can } from '@/components/auth/Can';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import type { ProjectMemberResponse } from '@/services/project.service';

import {
  formatOptionalDate,
  getInitials,
  getMemberTaskSummary,
  getRoleClassName,
} from './member-ui';

type MemberDetailDrawerProps = {
  member: ProjectMemberResponse | null;
  onChangeRole: (member: ProjectMemberResponse) => void;
  onClose: () => void;
  onRemoveMember: (member: ProjectMemberResponse) => void;
  projectId: number;
};

const STAT_CARDS: {
  color: string;
  dotColor: string;
  key: 'assigned' | 'inProgress' | 'review' | 'done';
  label: string;
}[] = [
  { color: 'text-[#7ec8f8]', dotColor: 'bg-[#7ec8f8]', key: 'assigned', label: 'Assigned' },
  { color: 'text-[#FFD369]', dotColor: 'bg-[#FFD369]', key: 'inProgress', label: 'In Progress' },
  { color: 'text-[#c084fc]', dotColor: 'bg-[#c084fc]', key: 'review', label: 'Review' },
  { color: 'text-[#4ade80]', dotColor: 'bg-[#4ade80]', key: 'done', label: 'Done' },
];

// Placeholder assignments until backend provides real data
function getCurrentAssignments(member: ProjectMemberResponse) {
  return [
    {
      chapter: 'Chapter 07',
      context: 'Storyboard',
      status: 'In Progress' as const,
      title: `${member.role.name} production pass`,
    },
    {
      chapter: 'Chapter 12',
      context: 'Inking',
      status: 'Review' as const,
      title: 'Chapter panel correction',
    },
    {
      chapter: 'Chapter 07',
      context: 'Dialogue',
      status: 'Pending' as const,
      title: 'Dialogue cleanup task',
    },
  ];
}

function getStatusDotColor(status: string) {
  switch (status) {
    case 'In Progress':
      return 'bg-[#FFD369]';
    case 'Review':
      return 'bg-[#c084fc]';
    case 'Done':
      return 'bg-[#4ade80]';
    default:
      return 'bg-[#7ec8f8]';
  }
}

export function MemberDetailDrawer({
  member,
  onChangeRole,
  onClose,
  onRemoveMember,
  projectId,
}: MemberDetailDrawerProps) {
  const taskSummary = member ? getMemberTaskSummary(member) : null;
  const currentAssignments = member ? getCurrentAssignments(member) : [];

  // Build "Working On" line from the first in-progress assignment
  const workingOn = currentAssignments.find((a) => a.status === 'In Progress');

  return (
    <Sheet
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
      open={Boolean(member)}
    >
      <SheetContent
        className="flex h-dvh w-[420px] max-w-[92vw] flex-col gap-0 border-[#39424f] bg-[#101820] p-0 text-white sm:max-w-[420px]"
        showCloseButton={false}
        side="right"
      >
        {member && taskSummary ? (
          <>
            {/* ─── Header ─── */}
            <SheetHeader className="border-b border-[#303842] px-5 pb-5 pt-6 text-left">
              <div className="flex items-start gap-4">
                {member.avatarUrl ? (
                  <img
                    alt=""
                    className="size-14 rounded-lg border border-[#39424f] object-cover"
                    src={member.avatarUrl}
                  />
                ) : (
                  <span className="grid size-14 place-items-center rounded-lg border border-[#39424f] bg-[#202832] text-base font-black text-[#FFD369]">
                    {getInitials(member)}
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <SheetTitle className="truncate text-lg font-black leading-6 text-white">
                      {member.displayName ?? member.email}
                    </SheetTitle>
                    <Badge
                      className={`h-5 shrink-0 rounded-[3px] border px-2 text-[9px] font-black ${getRoleClassName(member.role.name)}`}
                      variant="outline"
                    >
                      {member.role.name}
                    </Badge>
                  </div>

                  <SheetDescription className="mt-1.5 space-y-1 text-xs text-[#aeb7c2]">
                    <span className="flex items-center gap-1.5 font-bold">
                      <Calendar className="size-3 shrink-0 text-[#8b94a1]" />
                      Joined {formatOptionalDate(member.createdAt)}
                    </span>
                    <span className="flex items-center gap-1.5 font-medium">
                      <Mail className="size-3 shrink-0 text-[#8b94a1]" />
                      <span className="truncate">{member.email}</span>
                    </span>
                  </SheetDescription>
                </div>
              </div>
            </SheetHeader>

            {/* ─── Scrollable Body ─── */}
            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-5">
              {/* ── Stats Cards ── */}
              <section>
                <h3 className="text-xs font-black uppercase tracking-[0.08em] text-white">
                  Task Overview
                </h3>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {STAT_CARDS.map((card) => (
                    <div
                      className="rounded-lg border border-[#303842] bg-[#151c25] px-3.5 py-3"
                      key={card.key}
                    >
                      <div className="flex items-center gap-1.5">
                        <span className={`size-1.5 rounded-full ${card.dotColor}`} />
                        <span className="text-[10px] font-bold uppercase tracking-[0.06em] text-[#8b94a1]">
                          {card.label}
                        </span>
                      </div>
                      <p className={`mt-1.5 text-2xl font-black leading-7 ${card.color}`}>
                        {taskSummary[card.key]}
                      </p>
                    </div>
                  ))}
                </div>
                <p className="mt-2 text-[10px] font-bold text-[#8b94a1]">
                  * Task counts use UI fallback data
                </p>
              </section>

              {/* ── Working On (single line) ── */}
              {workingOn ? (
                <section>
                  <h3 className="text-xs font-black uppercase tracking-[0.08em] text-white">
                    Working On
                  </h3>
                  <div className="mt-2 flex items-center gap-2 rounded-lg border border-[#303842] bg-[#151c25] px-3.5 py-2.5">
                    <span className="size-1.5 shrink-0 rounded-full bg-[#FFD369]" />
                    <p className="truncate text-xs font-bold text-[#dce7f3]">
                      {workingOn.title}
                      <span className="ml-1 text-[#8b94a1]">
                        • {workingOn.chapter} • {workingOn.context}
                      </span>
                    </p>
                  </div>
                </section>
              ) : null}

              {/* ── Current Assignments ── */}
              <section>
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase tracking-[0.08em] text-white">
                    Recent Assignments
                  </h3>
                  <span className="text-[10px] font-bold text-[#8b94a1]">Top 3</span>
                </div>
                <div className="mt-3 divide-y divide-[#303842] rounded-lg border border-[#303842] bg-[#151c25]">
                  {currentAssignments.map((assignment) => (
                    <div className="px-4 py-3" key={assignment.title}>
                      <div className="flex items-center gap-2">
                        <span className={`size-1.5 shrink-0 rounded-full ${getStatusDotColor(assignment.status)}`} />
                        <p className="truncate text-xs font-black text-white">
                          {assignment.title}
                        </p>
                      </div>
                      <p className="mt-1 pl-3.5 text-[10px] font-bold text-[#8b94a1]">
                        {assignment.chapter} • {assignment.context}
                      </p>
                    </div>
                  ))}
                  <button
                    className="flex h-10 w-full items-center justify-between px-4 text-xs font-black text-[#dce7f3] transition-colors hover:bg-[#202832] hover:text-white"
                    type="button"
                  >
                    <span className="flex items-center gap-2">
                      <ClipboardList className="size-3.5 text-[#8b94a1]" />
                      View member tasks
                    </span>
                    <ArrowRight className="size-4" />
                  </button>
                </div>
              </section>

              {/* ── Actions ── */}
              <section>
                <div className="border-t border-[#303842] pt-4">
                  <h3 className="text-xs font-black uppercase tracking-[0.08em] text-white">
                    Actions
                  </h3>
                  <div className="mt-3 divide-y divide-[#303842] rounded-lg border border-[#303842] bg-[#151c25]">
                    <Can
                      any={['project:member.update', 'project:owner']}
                      resource="PROJECT"
                      resourceId={projectId}
                    >
                      <button
                        className="flex h-10 w-full items-center gap-3 px-4 text-left text-xs font-black text-[#dce7f3] transition-colors hover:bg-[#202832] hover:text-white"
                        onClick={() => onChangeRole(member)}
                        type="button"
                      >
                        <UserCog className="size-4 text-[#FFD369]" />
                        Change Role
                      </button>
                    </Can>
                    <Can
                      any={['project:member.remove', 'project:owner']}
                      resource="PROJECT"
                      resourceId={projectId}
                    >
                      <button
                        className="flex h-10 w-full items-center gap-3 px-4 text-left text-xs font-black text-red-300 transition-colors hover:bg-red-950/30 hover:text-red-200"
                        onClick={() => onRemoveMember(member)}
                        type="button"
                      >
                        <Trash2 className="size-4" />
                        Remove Member
                      </button>
                    </Can>
                  </div>
                </div>
              </section>
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
