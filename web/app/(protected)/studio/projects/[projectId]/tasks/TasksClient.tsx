'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from '@/lib/toast';
import {
  AlertTriangle,
  Columns3,
  ListChecks,
  Search,
  TableProperties,
  UserRoundCheck,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  getProjectFolders,
  getFolderFiles,
  getProjectMembers,
} from '@/services/project.service';
import {
  getFileTasks,
  createFileTask,
  getFileMaterialVersions,
} from '@/services/file.service';
import { updateTask, createTaskComment } from '@/services/task.service';
import { LoadingState } from '@/components/ui/loading-state';
import { RefreshingIndicator } from '@/components/ui/refreshing-indicator';
import { useAsyncResource } from '@/hooks/useAsyncResource';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/use-permissions';

import { useRealtimeProjectActivity } from '@/hooks/use-realtime-activity';

import { CreateTaskDialog } from './CreateTaskDialog';
import { TaskKanban } from './TaskKanban';
import { TaskTable } from './TaskTable';
import { Pagination } from '../../../components/Pagination';
import {
  type TaskWorkspaceItem,
  type TaskStatus,
} from './task-ui';

type TaskScope = 'ALL' | 'MINE' | 'OVERDUE' | 'REVIEW';
type TaskView = 'KANBAN' | 'TABLE';

type TasksClientProps = {
  projectId: number;
};

const scopeLabels: Record<TaskScope, string> = {
  ALL: 'All Tasks',
  MINE: 'My Tasks',
  OVERDUE: 'Overdue',
  REVIEW: 'Review Queue',
};

export function TasksClient({ projectId }: TasksClientProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { can: canProject } = usePermissions({ resource: 'PROJECT', resourceId: projectId });
  const [query, setQuery] = useState('');
  const [scope, setScope] = useState<TaskScope>('ALL');
  const [view, setView] = useState<TaskView>('TABLE');
  const [localTasks, setLocalTasks] = useState<TaskWorkspaceItem[]>([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  useEffect(() => {
    setPage(1);
  }, [query, scope, view]);

  const { activities } = useRealtimeProjectActivity(projectId);

  const { data, error, isInitialLoading, isRefreshing, reload } = useAsyncResource(async () => {
    const foldersRes = await getProjectFolders(projectId);
    const foldersList = foldersRes.folders || [];

    let apiMembers: { id: number; name: string }[] = [];
    try {
      const membersRes = await getProjectMembers(projectId);
      apiMembers = (membersRes.members || []).map((m) => ({
        id: m.id,
        name: m.displayName || m.email,
      }));
    } catch (err) {
      console.error('Failed to load project members:', err);
    }

    const filesPromises = foldersList.map(async (folder) => {
      try {
        const filesResult = await getFolderFiles(folder.id);
        return filesResult.files || [];
      } catch {
        return [];
      }
    });
    const filesArrays = await Promise.all(filesPromises);
    const allFiles = filesArrays.flat();
    const apiProjectFiles = allFiles.map((f) => ({ id: f.id, title: f.title }));

    const tasksPromises = allFiles.map(async (file) => {
      try {
        const dbTasks = await getFileTasks(file.id);

        let previewUrl = '';
        let fileVersions: any[] = [];
        try {
          const versionsRes = await getFileMaterialVersions(file.id);
          const rawArray = (versionsRes as any).data || versionsRes.versions || [];
          fileVersions = rawArray.map((v: any, index: number, arr: any[]) => ({
            createdAt: v.createdAt,
            version: arr.length - index,
          }));
          const latestVersion = rawArray[0];
          if (latestVersion) {
            const thumbnailMaterial =
              latestVersion.materials.find((m: any) => m.isThumbnail) || latestVersion.materials[0];
            previewUrl = thumbnailMaterial?.downloadUrl || thumbnailMaterial?.url || '';
          }
        } catch {
          // ignore previewUrl errors
        }

        return dbTasks.map((t: any) => {
          const frame = t.commentFrames?.[0];
          const region = frame
            ? {
              startX: Number(frame.startX),
              startY: Number(frame.startY),
              endX: Number(frame.endX),
              endY: Number(frame.endY),
            }
            : undefined;

          const assigneeName = t.assignedByUser?.displayName || t.assignedByUser?.email || 'Unassigned';

          const versionMatch = t.description?.match(/\[version:(v\d+)\]/);
          let taskVersion = versionMatch ? versionMatch[1] : undefined;

          if (!taskVersion && fileVersions.length > 0 && t.createdAt) {
            const sorted = [...fileVersions].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
            const taskTime = new Date(t.createdAt).getTime();
            let matchedVer = sorted[0];
            for (const v of sorted) {
              if (new Date(v.createdAt).getTime() <= taskTime) {
                matchedVer = v;
              } else {
                break;
              }
            }
            if (matchedVer) {
              taskVersion = `v${matchedVer.version}`;
            }
          }

          const cleanDesc = t.description ? t.description.replace(/\s*\[version:v\d+\]/g, '') : '';

          return {
            assignee: assigneeName,
            description: cleanDesc,
            dueDate: t.deadline ? new Date(t.deadline).toLocaleDateString() : 'No due date',
            fileId: file.id,
            fileTitle: file.title,
            id: String(t.id),
            isMine: user?.id != null && t.assignedByUser?.id === user.id,
            previewUrl,
            priority: 'MEDIUM',
            region,
            status: t.status,
            submissions: [],
            title: t.title,
            updatedAt: new Date(t.updatedAt).toLocaleDateString(),
            targetVersion: taskVersion,
          } as TaskWorkspaceItem;
        });
      } catch {
        return [];
      }
    });

    const tasksArrays = await Promise.all(tasksPromises);
    const allTasks = tasksArrays.flat();

    return {
      members: apiMembers,
      projectFiles: apiProjectFiles,
      tasks: allTasks
    };
  }, [projectId]);

  const members = data?.members ?? [];
  const projectFiles = data?.projectFiles ?? [];
  const tasks = data?.tasks ?? [];

  // Sync localTasks when API data refreshes
  useEffect(() => {
    setLocalTasks(tasks);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  useEffect(() => {
    if (activities.length > 0) {
      const latestActivity = activities[0];
      if (
        latestActivity?.action?.startsWith('TASK_') ||
        latestActivity?.action?.startsWith('FILE_') ||
        latestActivity?.action?.startsWith('MATERIAL_')
      ) {
        void reload();
      }
    }
  }, [activities.length, reload]);

  // Determine reviewer permission for dragging cards (backend checks specific ownership details)
  const canReview = canProject('project:task.update') || canProject('admin');

  const visibleTasks = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return tasks.filter((task) => {
      const matchesQuery =
        !normalizedQuery ||
        [task.title, task.fileTitle, task.assignee, task.description].some((value) =>
          value.toLowerCase().includes(normalizedQuery),
        );
      const matchesScope =
        scope === 'ALL' ||
        (scope === 'MINE' && task.isMine) ||
        (scope === 'REVIEW' && task.status === 'REVIEW') ||
        (scope === 'OVERDUE' && task.dueDate !== 'No due date' && new Date(task.dueDate) < new Date());

      return matchesQuery && matchesScope;
    });
  }, [query, scope, tasks]);

  const paginatedTasks = useMemo(() => {
    const startIndex = (page - 1) * limit;
    return visibleTasks.slice(startIndex, startIndex + limit);
  }, [visibleTasks, page, limit]);

  const totalPages = Math.ceil(visibleTasks.length / limit);

  const handleCreate = async (input: {
    title: string;
    description: string;
    fileId: number;
    assignedToId?: number;
    status: TaskStatus;
    dueDate: string;
  }) => {
    try {
      let deadline: string | undefined = undefined;
      if (input.dueDate) {
        const dateObj = new Date(input.dueDate);
        if (!isNaN(dateObj.getTime())) {
          deadline = dateObj.toISOString();
        }
      }

      await createFileTask(input.fileId, {
        title: input.title,
        description: input.description,
        status: input.status,
        deadline,
        assignedBy: input.assignedToId,
      });

      await reload();
      toast.success('Task created.');
    } catch (err) {
      console.error('Failed to create task:', err);
      toast.error('Failed to create task. Please try again.');
    }
  };

  const openTask = (task: TaskWorkspaceItem) => {
    router.push(
      `/studio/projects/${projectId}/files/${task.fileId}?taskId=${encodeURIComponent(task.id)}&from=tasks`,
    );
  };

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus, comment?: string) => {
    // 1. Optimistic update immediately
    const prevTasks = localTasks;
    setLocalTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)),
    );
    try {
      await updateTask(taskId, { status: newStatus });
      // 2. Post revision comment if provided (request revision flow)
      if (comment?.trim()) {
        await createTaskComment(taskId, `[Revision requested] ${comment.trim()}`);
      }
    } catch (err: any) {
      // 3. Rollback on failure
      setLocalTasks(prevTasks);
      const errorMessage = err?.response?.data?.message;
      if (errorMessage === 'EVLSUBTASKDEP' || err?.response?.data?.code === 'EVLSUBTASKDEP') {
        toast.error('Cannot start task: Parent task is not completed yet.');
      } else {
        toast.error('Failed to update task status. Please try again.');
      }
    }
  };

  const stats = [
    { icon: ListChecks, label: 'Total Tasks', value: tasks.length, tone: 'text-white' },
    {
      icon: AlertTriangle,
      label: 'Pending',
      value: tasks.filter((task) => task.status === 'PENDING').length,
      tone: 'text-[#dce7f3]',
    },
    {
      icon: UserRoundCheck,
      label: 'In Progress',
      value: tasks.filter((task) => task.status === 'INPROGRESS').length,
      tone: 'text-[#9ddde8]',
    },
    {
      icon: AlertTriangle,
      label: 'Needs Review',
      value: tasks.filter((task) => task.status === 'REVIEW').length,
      tone: 'text-[#FFD369]',
    },
  ];

  if (isInitialLoading) {
    return (
      <LoadingState message="Loading production tasks..." minHeight="70vh" />
    );
  }

  return (
    <section className="min-h-full w-full max-w-full bg-[#101820] px-5 py-6 overflow-hidden">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-white">Production Tasks</h1>
            <RefreshingIndicator isRefreshing={isRefreshing} />
          </div>
          <p className="mt-1 text-sm font-medium text-[#aeb7c2]">
            Assign, produce, submit, and review work linked to manga files.
          </p>
        </div>
        <CreateTaskDialog fileOptions={projectFiles} members={members} onCreate={handleCreate} />
      </header>

      {error ? (
        <p className="mt-4 rounded-[4px] border border-red-400/30 bg-red-950/20 px-4 py-3 text-xs font-bold text-red-300">
          {error}
        </p>
      ) : null}

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ icon: Icon, label, tone, value }) => (
          <article className="border border-[#39424f] bg-[#151c25] px-4 py-4" key={label}>
            <div className="flex items-center justify-between gap-3">
              <p className="text-[10px] font-black uppercase tracking-[0.08em] text-[#aeb7c2]">{label}</p>
              <Icon className={`size-4 ${tone}`} />
            </div>
            <p className={`mt-3 text-2xl font-black ${tone}`}>{value}</p>
          </article>
        ))}
      </div>

      <div className={`mt-5 w-full max-w-full overflow-x-auto border border-[#303842] bg-[#0d151e] transition-opacity duration-200 ${isRefreshing ? 'opacity-50 pointer-events-none' : ''}`}>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#303842] px-4 py-3">
          <div className="flex min-w-[240px] flex-1 items-center gap-2 border border-[#39424f] bg-[#151c25] px-3">
            <Search className="size-4 text-[#8b94a1]" />
            <input
              className="h-9 min-w-0 flex-1 bg-transparent text-xs font-bold text-white outline-none placeholder:text-[#8b94a1]"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search tasks, files, or assignees..."
              value={query}
            />
          </div>
          <div className="flex items-center border border-[#39424f] bg-[#151c25] p-1">
            <Button
              aria-label="Table view"
              className={`size-8 rounded-[3px] ${view === 'TABLE' ? 'bg-[#303842] text-[#FFD369]' : 'text-[#aeb7c2]'}`}
              onClick={() => setView('TABLE')}
              size="icon"
              variant="ghost"
            >
              <TableProperties className="size-4" />
            </Button>
            <Button
              aria-label="Kanban view"
              className={`size-8 rounded-[3px] ${view === 'KANBAN' ? 'bg-[#303842] text-[#FFD369]' : 'text-[#aeb7c2]'}`}
              onClick={() => setView('KANBAN')}
              size="icon"
              variant="ghost"
            >
              <Columns3 className="size-4" />
            </Button>
          </div>
        </div>

        <div className="flex h-11 items-center gap-1 overflow-x-auto border-b border-[#303842] px-4">
          {(Object.keys(scopeLabels) as TaskScope[]).map((value) => (
            <button
              className={`relative h-full shrink-0 px-3 text-xs font-black ${scope === value ? 'text-[#FFD369]' : 'text-[#aeb7c2] hover:text-white'
                }`}
              key={value}
              onClick={() => setScope(value)}
              type="button"
            >
              {scopeLabels[value]}
              {scope === value ? <span className="absolute inset-x-2 bottom-0 h-0.5 bg-[#FFD369]" /> : null}
            </button>
          ))}
        </div>

        <div className="overflow-x-auto p-4">
          {view === 'TABLE' ? (
            <TaskTable onOpenTask={openTask} tasks={paginatedTasks} />
          ) : (
            <TaskKanban
              canReview={canReview}
              onOpenTask={openTask}
              onStatusChange={handleStatusChange}
              tasks={localTasks.filter((task) => {
                const normalizedQuery = query.trim().toLowerCase();
                const matchesQuery =
                  !normalizedQuery ||
                  [task.title, task.fileTitle, task.assignee, task.description].some((v) =>
                    v.toLowerCase().includes(normalizedQuery),
                  );
                const matchesScope =
                  scope === 'ALL' ||
                  (scope === 'MINE' && task.isMine) ||
                  (scope === 'REVIEW' && task.status === 'REVIEW') ||
                  (scope === 'OVERDUE' &&
                    task.dueDate !== 'No due date' &&
                    new Date(task.dueDate) < new Date());
                return matchesQuery && matchesScope;
              })}
            />
          )}
        </div>
        {view === 'TABLE' ? (
          <Pagination
            page={page}
            limit={limit}
            total={visibleTasks.length}
            totalPages={totalPages}
            onPageChange={setPage}
            onLimitChange={(newLimit: number) => {
              setLimit(newLimit);
              setPage(1);
            }}
          />
        ) : (
          <footer className="border-t border-[#303842] px-4 py-3 text-[10px] font-bold text-[#8b94a1]">
            Showing {visibleTasks.length} tasks.
          </footer>
        )}
      </div>
    </section>
  );
}
