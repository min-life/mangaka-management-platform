'use client';

import { useEffect, useState } from 'react';
import { Calendar, Clock, Mail, ShieldCheck, Trash2, UserCog } from 'lucide-react';

import { Can } from '@/components/auth/Can';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  getProjectMember,
  type ProjectMemberResponse,
} from '@/services/project.service';

import { formatOptionalDate, getInitials, getRoleClassName } from './member-ui';
import { useAuth } from '@/hooks/useAuth';

type MemberDetailDrawerProps = {
  member: ProjectMemberResponse | null;
  onChangeRole: (member: ProjectMemberResponse) => void;
  onClose: () => void;
  onRemoveMember: (member: ProjectMemberResponse) => void;
  canUpdateMember?: boolean;
  canRemoveMember?: boolean;
  projectId: number;
  project: any;
};

type InfoRowProps = {
  label: string;
  value: string;
};

function InfoRow({ label, value }: InfoRowProps) {
  return (
    <div className="border-b border-[#303842] px-4 py-3 last:border-b-0">
      <p className="text-[10px] font-black uppercase tracking-[0.08em] text-[#8b94a1]">
        {label}
      </p>
      <p className="mt-1 break-words text-sm font-black text-white">{value}</p>
    </div>
  );
}

type TaskMetricProps = {
  label: string;
  tone: string;
  value: number;
};

function TaskMetric({ label, tone, value }: TaskMetricProps) {
  return (
    <div className="rounded-[5px] border border-[#303842] bg-[#101820] px-3 py-2.5">
      <p className="text-[10px] font-black uppercase tracking-[0.06em] text-[#8b94a1]">
        {label}
      </p>
      <p className={`mt-1 text-xl font-black leading-6 ${tone}`}>{value}</p>
    </div>
  );
}

export function MemberDetailDrawer({
  member,
  onChangeRole,
  onClose,
  onRemoveMember,
  canUpdateMember,
  canRemoveMember,
  projectId,
  project,
}: MemberDetailDrawerProps) {
  const [detailMember, setDetailMember] = useState<ProjectMemberResponse | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    let isMounted = true;

    if (!member) {
      setDetailMember(null);
      setDetailError(null);
      setIsDetailLoading(false);
      return;
    }

    setDetailMember(member);
    setIsDetailLoading(true);
    setDetailError(null);

    void getProjectMember(projectId, member.id)
      .then((result) => {
        if (isMounted) {
          const isOwner = project && (project.createdBy === result.id || project.createdByUser?.id === result.id);
          if (isOwner) {
            setDetailMember({
              ...result,
              role: {
                ...result.role,
                name: 'Owner',
              },
            });
          } else {
            setDetailMember(result);
          }
        }
      })
      .catch(() => {
        if (isMounted) {
          setDetailError('Unable to load member task summary.');
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsDetailLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [member, projectId, project]);

  const activeMember = detailMember ?? member;
  const taskOverview = activeMember?.taskOverview;

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
        className="flex w-[400px] flex-col border-l-[#39424f] bg-[#0c1219] p-0 sm:max-w-[400px]"
        showCloseButton={false}
        side="right"
      >
        {activeMember ? (
          <>
            <SheetHeader className="shrink-0 border-b border-[#303842] bg-[#101820] px-5 py-6 text-left">
              <div className="flex items-start gap-4">
                {activeMember.avatarUrl ? (
                  <img
                    alt={activeMember.displayName ?? activeMember.email}
                    className="size-16 rounded-lg border border-[#39424f] object-cover"
                    src={activeMember.avatarUrl}
                  />
                ) : (
                  <span className="grid size-16 place-items-center rounded-lg border border-[#39424f] bg-[#202832] text-lg font-black text-[#FFD369]">
                    {getInitials(activeMember)}
                  </span>
                )}

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <SheetTitle className="truncate text-lg font-black leading-6 text-white">
                      {activeMember.displayName ?? activeMember.email}
                    </SheetTitle>
                    <Badge
                      className={`h-5 shrink-0 rounded-[3px] border px-2 text-[9px] font-black ${getRoleClassName(activeMember.role.name)}`}
                      variant="outline"
                    >
                      {activeMember.role.name}
                    </Badge>
                  </div>

                  <SheetDescription className="mt-1.5 text-xs font-bold text-[#aeb7c2]">
                    <span className="flex items-center gap-1.5">
                      <Mail className="size-3.5 text-[#8b94a1]" />
                      <span className="truncate">{activeMember.email}</span>
                    </span>
                    <span className="mt-1 flex items-center gap-1.5">
                      <Calendar className="size-3.5 text-[#8b94a1]" />
                      Joined {formatOptionalDate(activeMember.createdAt)}
                    </span>
                  </SheetDescription>
                </div>
              </div>
            </SheetHeader>

            <div className="min-h-0 flex-1 space-y-7 overflow-y-auto px-5 py-5">
              <section>
                <h3 className="text-xs font-black uppercase tracking-[0.08em] text-white">
                  Member
                </h3>
                <div className="mt-3 overflow-hidden rounded-lg border border-[#303842] bg-[#151c25]">
                  <InfoRow label="Project Role" value={activeMember.role.name} />
                  <InfoRow label="Role Code" value={activeMember.role.code} />
                  <InfoRow label="Last Updated" value={formatOptionalDate(activeMember.updatedAt)} />
                </div>
              </section>

              <section>
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-xs font-black uppercase tracking-[0.08em] text-white">
                    Task Summary
                  </h3>
                  {isDetailLoading ? (
                    <span className="text-[10px] font-black uppercase tracking-[0.06em] text-[#8b94a1]">
                      Loading
                    </span>
                  ) : null}
                </div>

                {detailError ? (
                  <p className="mt-3 rounded-lg border border-red-400/30 bg-red-950/20 px-4 py-3 text-xs font-bold text-red-300">
                    {detailError}
                  </p>
                ) : (
                  <div className="mt-3 rounded-lg border border-[#303842] bg-[#151c25] p-4">
                    <div className="rounded-[6px] border border-[#3f4855] bg-[#101820] px-4 py-4">
                      <p className="text-[10px] font-black uppercase tracking-[0.08em] text-[#8b94a1]">
                        Assigned
                      </p>
                      <p className="mt-2 text-4xl font-black leading-none text-white">
                        {activeMember.numberOfTasks ?? taskOverview?.total ?? 0}
                      </p>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <TaskMetric
                        label="Pending"
                        tone="text-[#7ec8f8]"
                        value={taskOverview?.pending ?? 0}
                      />
                      <TaskMetric
                        label="Review"
                        tone="text-[#c084fc]"
                        value={taskOverview?.review ?? 0}
                      />
                      <TaskMetric
                        label="In Progress"
                        tone="text-[#FFD369]"
                        value={taskOverview?.inprogress ?? 0}
                      />
                      <TaskMetric
                        label="Done"
                        tone="text-[#4ade80]"
                        value={taskOverview?.done ?? 0}
                      />
                    </div>
                  </div>
                )}
              </section>

              <section>
                <h3 className="text-xs font-black uppercase tracking-[0.08em] text-white">
                  Permissions
                </h3>
                <div className="mt-3 flex items-center gap-3 rounded-lg border border-[#303842] bg-[#151c25] px-4 py-3">
                  <span className="grid size-9 shrink-0 place-items-center rounded-[5px] border border-[#3f4855] bg-[#101820] text-[#FFD369]">
                    <ShieldCheck className="size-4" />
                  </span>
                  <div>
                    <p className="text-sm font-black text-white">Inherited from project role</p>
                    <p className="mt-1 text-xs font-bold text-[#8b94a1]">
                      {activeMember.role.name}
                    </p>
                  </div>
                </div>
              </section>

              {activeMember.role.name !== 'Owner' && (
                <section>
                  <h3 className="text-xs font-black uppercase tracking-[0.08em] text-white">
                    Actions
                  </h3>
                  <div className="mt-3 overflow-hidden rounded-lg border border-[#303842] bg-[#151c25]">
                    <div className="divide-y divide-[#303842]">
                      {canUpdateMember && (
                        <button
                          className="flex h-10 w-full items-center gap-3 px-4 text-left text-xs font-black text-[#dce7f3] transition-colors hover:bg-[#202832] hover:text-white"
                          onClick={() => onChangeRole(activeMember)}
                          type="button"
                        >
                          <UserCog className="size-4 text-[#FFD369]" />
                          Change Role
                        </button>
                      )}
                    </div>
                    <div className="border-t border-[#303842]">
                      {(canRemoveMember || activeMember.id === user?.id) && (
                        <button
                          className="flex h-10 w-full items-center gap-3 px-4 text-left text-xs font-black text-red-300 transition-colors hover:bg-red-950/30 hover:text-red-200"
                          onClick={() => onRemoveMember(activeMember)}
                          type="button"
                        >
                          <Trash2 className="size-4" />
                          {activeMember.id === user?.id ? 'Leave Project' : 'Remove Member'}
                        </button>
                      )}
                    </div>
                  </div>
                </section>
              )}
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
