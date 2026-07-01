'use client';

import { useEffect, useState } from 'react';
import { Activity, Circle, Loader2 } from 'lucide-react';

import { getFileActivityLogs } from '@/services/file.service';
import { type FileActivityItem } from '../file-ui';

const activityToneClassName = {
  default: 'text-[#8b94a1]',
  success: 'text-[#9df2c7]',
  warning: 'text-[#FFD369]',
};

type FileActivityPanelProps = {
  fileId: number | string;
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
    year: 'numeric',
  });
}

function formatActivityLog(log: any): FileActivityItem {
  const actor = log.actor?.displayName || log.actor?.email || `User #${log.actorId}`;
  let label = '';
  let tone: 'default' | 'success' | 'warning' = 'default';

  switch (log.action) {
    case 'FILE_CREATED':
      label = 'created the file';
      tone = 'success';
      break;
    case 'FILE_DELETED':
      label = 'deleted the file';
      tone = 'warning';
      break;
    case 'MATERIAL_UPLOADED':
      label = 'uploaded a new preview / material';
      tone = 'success';
      break;
    case 'MATERIAL_RESTORED':
      label = 'restored a material';
      tone = 'default';
      break;
    case 'TASK_CREATED':
      label = `created task "${log.metadata?.title || 'Unknown Task'}"`;
      tone = 'default';
      break;
    case 'TASK_ASSIGNED':
      label = `assigned task "${log.metadata?.title || 'Unknown Task'}"`;
      tone = 'default';
      break;
    case 'TASK_UPDATED':
      label = `updated task "${log.metadata?.title || 'Unknown Task'}"`;
      tone = 'default';
      break;
    case 'TASK_COMPLETED':
      label = `completed task "${log.metadata?.title || 'Unknown Task'}"`;
      tone = 'success';
      break;
    case 'TASK_DELETED':
      label = `deleted a task`;
      tone = 'warning';
      break;
    case 'COMMENT_CREATED':
      label = 'added a comment';
      tone = 'default';
      break;
    case 'COMMENT_DELETED':
      label = 'deleted a comment';
      tone = 'warning';
      break;
    case 'MEMBER_INVITED':
      label = 'invited a new member';
      tone = 'success';
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
      break;
    case 'APPLICATION_INTERNAL_APPROVED':
      label = 'internally approved the application';
      tone = 'success';
      break;
    case 'APPLICATION_SUBMITTED':
      label = 'submitted the application';
      tone = 'success';
      break;
    case 'APPLICATION_APPROVED':
      label = 'approved the application';
      tone = 'success';
      break;
    case 'APPLICATION_REJECTED':
      label = 'rejected the application';
      tone = 'warning';
      break;
    default:
      label = String(log.action).toLowerCase().replace(/_/g, ' ');
      tone = 'default';
  }

  return {
    id: String(log.id),
    actor,
    label,
    time: formatRelativeTime(log.createdAt),
    tone,
  };
}

export function FileActivityPanel({ fileId }: FileActivityPanelProps) {
  const [activities, setActivities] = useState<FileActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadActivities() {
      setIsLoading(true);
      setError(null);
      try {
        const response = await getFileActivityLogs(fileId);
        const mapped = (response.data || []).map(formatActivityLog);
        setActivities(mapped);
      } catch (err) {
        console.error('Failed to load file activities:', err);
        setError('Failed to load activity logs.');
      } finally {
        setIsLoading(false);
      }
    }

    loadActivities();
  }, [fileId]);

  return (
    <section>
      <div className="flex items-center justify-between gap-3 border-b border-[#26303b] pb-3">
        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.08em] text-white">
          <Activity className="size-4 text-[#FFD369]" />
          Activity
        </div>
        <span className="text-[9px] font-black uppercase tracking-[0.08em] text-[#8b94a1]">
          File #{fileId}
        </span>
      </div>

      {isLoading ? (
        <div className="flex h-32 flex-col items-center justify-center gap-2 text-xs font-bold text-[#8b94a1]">
          <Loader2 className="size-5 animate-spin text-[#FFD369]" />
          Loading activity history...
        </div>
      ) : error ? (
        <div className="flex h-32 items-center justify-center text-xs font-bold text-[#f29f9f]">
          {error}
        </div>
      ) : activities.length === 0 ? (
        <p className="mt-6 text-center text-xs font-bold text-[#8b94a1] italic">
          No activity logs recorded for this file yet.
        </p>
      ) : (
        <div className="mt-3 space-y-1">
          {activities.map((item) => (
            <article className="relative ml-2 border-l border-[#39424f] pb-4 pl-4 last:pb-0" key={item.id}>
              <Circle
                className={`absolute -left-1.5 top-1 size-3 fill-[#0d151e] ${activityToneClassName[item.tone]}`}
              />
              <p className="text-[11px] font-bold leading-5 text-[#dce7f3]">
                <span className="font-black text-white">{item.actor}</span> {item.label}
              </p>
              <p className="mt-1 text-[10px] font-bold text-[#8b94a1]">{item.time}</p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
