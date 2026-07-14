'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Activity, Check, MessageSquare, Plus, Upload, Circle, Pencil } from 'lucide-react';

import { getActivityVerbPhrase, getActorLabel } from '@/lib/activity-message';
import { resolveActivityRoute } from '@/lib/activity-route';
import { getFileActivityLogs } from '@/services/file.service';
import { useRealtimeProjectActivity } from '@/hooks/use-realtime-activity';
import { type FileActivityItem } from '../file-ui';

const activityToneClassName = {
  default: 'text-[#8b94a1]',
  success: 'text-[#9df2c7]',
  warning: 'text-[#FFD369]',
};

function ActivitySkeleton() {
  return (
    <div className="mt-4 space-y-4">
      {Array.from({ length: 5 }).map((_, index) => (
        <div className="relative ml-2 border-l-2 border-dashed border-[#39424f] pb-2 pl-4" key={index}>
          <div className="absolute -left-2 top-1 size-4 rounded-full border border-[#39424f] bg-[#0d151e]" />
          <div className="h-3 w-4/5 animate-pulse rounded-[4px] bg-[#1f2937]" />
          <div className="mt-2 h-3 w-20 animate-pulse rounded-[4px] bg-[#1f2937]" />
        </div>
      ))}
    </div>
  );
}

type FileActivityPanelProps = {
  fileId: number | string;
  projectId: number | string;
};

function formatRelativeTime(dateString: string) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit',
  });
}

function formatDateGrouping(dateString: string) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;
  const now = new Date();

  const isSameDay = (d1: Date, d2: Date) =>
    d1.getDate() === d2.getDate() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getFullYear() === d2.getFullYear();

  if (isSameDay(date, now)) return 'Today';

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (isSameDay(date, yesterday)) return 'Yesterday';

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  });
}

const activityTone: Record<string, 'default' | 'success' | 'warning'> = {
  FILE_CREATED: 'success',
  FILE_DELETED: 'warning',
  MATERIAL_UPLOADED: 'success',
  TASK_COMPLETED: 'success',
  TASK_DELETED: 'warning',
  COMMENT_DELETED: 'warning',
  MEMBER_INVITED: 'success',
  MEMBER_REMOVED: 'warning',
  FOLDER_CREATED: 'success',
  FOLDER_DELETED: 'warning',
  APPLICATION_INTERNAL_APPROVED: 'success',
  APPLICATION_SUBMITTED: 'success',
  APPLICATION_APPROVED: 'success',
  APPLICATION_REJECTED: 'warning',
};

function formatActivityLog(log: any, projectId: number | string): FileActivityItem {
  const actor = log.actor?.displayName || log.actor?.email || `User #${log.actorId}`;
  let label = '';
  let tone: 'default' | 'success' | 'warning' = 'default';
  let type: FileActivityItem['type'] = 'default';
  let metadata: FileActivityItem['metadata'] = undefined;

  switch (log.action) {
    case 'FILE_CREATED':
      label = 'created the file';
      tone = 'success';
      type = 'create';
      break;
    case 'FILE_DELETED':
      label = 'deleted the file';
      tone = 'warning';
      break;
    case 'MATERIAL_UPLOADED':
      label = 'uploaded a new material';
      tone = 'success';
      type = 'upload';
      metadata = {
        materialId: log.metadata?.materialId,
        materialName: log.metadata?.materialName || log.metadata?.fileName || log.metadata?.title
      };
      break;
    case 'MATERIAL_RESTORED':
      label = 'restored a material';
      tone = 'default';
      break;
    case 'TASK_CREATED':
      label = 'created task';
      tone = 'default';
      type = 'create';
      metadata = { taskId: log.metadata?.taskId, taskName: log.metadata?.title || 'Unknown Task' };
      break;
    case 'TASK_ASSIGNED':
      label = 'assigned task';
      tone = 'default';
      metadata = { taskId: log.metadata?.taskId, taskName: log.metadata?.title || 'Unknown Task' };
      break;
    case 'TASK_UPDATED':
      label = 'updated task';
      tone = 'default';
      type = 'edit';
      metadata = { taskId: log.metadata?.taskId, taskName: log.metadata?.title || 'Unknown Task' };
      break;
    case 'TASK_COMPLETED':
      label = 'completed task';
      tone = 'success';
      type = 'complete';
      metadata = { taskId: log.metadata?.taskId, taskName: log.metadata?.title || 'Unknown Task' };
      break;
    case 'TASK_DELETED':
      label = 'deleted a task';
      tone = 'warning';
      break;
    case 'COMMENT_CREATED':
      label = 'added a comment';
      tone = 'default';
      type = 'comment';
      if (log.metadata?.taskId) {
        metadata = { taskId: log.metadata.taskId, taskName: log.metadata.taskTitle || 'Unknown Task' };
      }
      break;
    case 'COMMENT_DELETED':
      label = 'deleted a comment';
      tone = 'warning';
      break;
    case 'MEMBER_INVITED':
      label = 'invited a new member';
      tone = 'success';
      type = 'create';
      break;
    case 'MEMBER_REMOVED':
      label = 'removed a member';
      tone = 'warning';
      break;
    case 'ROLE_CHANGED':
      label = 'changed member role';
      tone = 'default';
      break;
    case 'FOLDER_CREATED':
      label = 'created a folder';
      tone = 'success';
      type = 'create';
      break;
    case 'FOLDER_MOVED':
      label = 'moved a folder';
      tone = 'default';
      break;
    case 'FOLDER_DELETED':
      label = 'deleted a folder';
      tone = 'warning';
      break;
    case 'APPLICATION_CREATED':
      label = 'created review application';
      tone = 'default';
      type = 'create';
      break;
    case 'APPLICATION_INTERNAL_APPROVED':
      label = 'internally approved the application';
      tone = 'success';
      type = 'complete';
      break;
    case 'APPLICATION_SUBMITTED':
      label = 'submitted the application';
      tone = 'success';
      type = 'complete';
      break;
    case 'APPLICATION_APPROVED':
      label = 'approved the application';
      tone = 'success';
      type = 'complete';
      break;
    case 'APPLICATION_REJECTED':
      label = 'rejected the application';
      tone = 'warning';
      break;
    default:
      label = String(log.action).toLowerCase().replace(/_/g, ' ');
      tone = 'default';
  }

  const route = resolveActivityRoute({
    action: log.action,
    editorBoardId: log.editorBoardId ?? null,
    entityId: log.entityId,
    entityType: log.entityType,
    fileId: log.fileId ?? null,
    metadata: log.metadata,
    projectId: Number(projectId),
  });
  // Suppress links that just point back at the file page already open.
  const href = route && route !== `/studio/projects/${projectId}/files/${log.fileId}` ? route : undefined;

  return {
    id: String(log.id),
    actor: getActorLabel(log.actor, log.actorId),
    href,
    label: getActivityVerbPhrase(log),
    time: formatRelativeTime(log.createdAt),
    rawDate: log.createdAt,
    type,
    metadata,
    tone,
  };
}

export function FileActivityPanel({ fileId, projectId }: FileActivityPanelProps) {
  const router = useRouter();
  const [activities, setActivities] = useState<FileActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { activities: realtimeLogs } = useRealtimeProjectActivity(projectId);

  useEffect(() => {
    async function loadActivities() {
      setIsLoading(true);
      setError(null);
      try {
        const response = await getFileActivityLogs(fileId);
        const mapped = (response.data || []).map((log) => formatActivityLog(log, projectId));
        setActivities(mapped);
      } catch (err) {
        console.error('Failed to load file activities:', err);
        setError('Failed to load activity logs.');
      } finally {
        setIsLoading(false);
      }
    }

    loadActivities();
  }, [fileId, projectId]);

  useEffect(() => {
    if (realtimeLogs.length > 0) {
      const latestLog = realtimeLogs[0];
      if (latestLog?.fileId === Number(fileId)) {
        const formatted = formatActivityLog(latestLog, projectId);
        setActivities((prev) => {
          if (prev.some((x) => x.id === formatted.id)) return prev;
          return [formatted, ...prev];
        });
      }
    }
  }, [realtimeLogs, fileId, projectId]);

  const groupedActivities = useMemo(() => {
    const groups: { dateLabel: string; items: FileActivityItem[] }[] = [];
    activities.forEach((item) => {
      const dateLabel = formatDateGrouping(item.rawDate);
      const lastGroup = groups[groups.length - 1];
      if (lastGroup && lastGroup.dateLabel === dateLabel) {
        lastGroup.items.push(item);
      } else {
        groups.push({ dateLabel, items: [item] });
      }
    });
    return groups;
  }, [activities]);

  const renderBadge = (item: FileActivityItem) => {
    const commonClass = "absolute -bottom-1 -right-1 flex size-3 items-center justify-center rounded-full border border-[#151c25] bg-[#0d151e]";
    switch (item.type) {
      case 'create':
        return <div className={commonClass}><Plus className="size-2 text-[#9df2c7]" /></div>;
      case 'comment':
        return <div className={commonClass}><MessageSquare className="size-2 text-[#8b94a1]" /></div>;
      case 'upload':
        return <div className={commonClass}><Upload className="size-2 text-[#9df2c7]" /></div>;
      case 'complete':
        return <div className={commonClass}><Check className="size-2 text-[#9df2c7]" /></div>;
      case 'edit':
        return <div className={commonClass}><Pencil className="size-2 text-[#8b94a1]" /></div>;
      default:
        return <div className={commonClass}><Circle className="size-1.5 fill-[#8b94a1] text-[#8b94a1]" /></div>;
    }
  };

  return (
    <section>


      {isLoading ? (
        <ActivitySkeleton />
      ) : error ? (
        <div className="flex h-32 items-center justify-center text-xs font-bold text-[#f29f9f]">
          {error}
        </div>
      ) : activities.length === 0 ? (
        <p className="mt-6 text-center text-xs font-bold text-[#8b94a1] italic">
          No activity logs recorded for this file yet.
        </p>
      ) : (
        <div className="mt-4">
          {groupedActivities.map((group, groupIdx) => (
            <div key={group.dateLabel} className="mb-4">
              <div className="mb-3 pl-6 text-[10px] font-black text-[#8b94a1] uppercase tracking-wider">
                {group.dateLabel}
              </div>
              <div className="space-y-0">
                {group.items.map((item, itemIdx) => {
                  const isLastInGroup = itemIdx === group.items.length - 1;
                  const isLastOverall = groupIdx === groupedActivities.length - 1 && isLastInGroup;

                  return (
                    <article className={`relative ml-[11px] pl-6 ${!isLastOverall ? 'border-l-2 border-dashed border-[#39424f] pb-4' : 'pb-0'}`} key={item.id}>
                      <div className="absolute -left-[11px] top-0">
                        <div className="relative flex size-5 items-center justify-center rounded-full bg-[#303842] text-[10px] font-black text-white">
                          {item.actor.charAt(0).toUpperCase()}
                          {renderBadge(item)}
                        </div>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <p className="text-[11px] font-medium leading-5 text-[#dce7f3]">
                          <span className="font-black text-white mr-1">{item.actor}</span>
                          {item.label}
                          {item.metadata?.taskName && (
                            <span
                              className={
                                item.href
                                  ? 'ml-1 font-bold text-[#FFD369] cursor-pointer hover:underline'
                                  : 'ml-1 font-bold text-[#FFD369]'
                              }
                              onClick={() => item.href && router.push(item.href)}
                            >
                              "{item.metadata.taskName}"
                            </span>
                          )}
                          {item.metadata?.materialId && !item.metadata?.taskName && (
                            <span className="ml-1 font-bold text-[#FFD369]">
                              "{item.metadata.materialName || `Material #${item.metadata.materialId}`}"
                            </span>
                          )}
                        </p>
                        <p className="text-[10px] font-bold text-[#8b94a1]">{item.time}</p>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
