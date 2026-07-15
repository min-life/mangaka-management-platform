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
} from '@/services/project.service';
import {
  getFileTasks,
} from '@/services/file.service';
import { updateTask, createTaskComment, getTaskFrames } from '@/services/task.service';
import { parseDecimal, getCleanTaskDescription } from '@/lib/utils';
import { LoadingState } from '@/components/ui/loading-state';
import { RefreshingIndicator } from '@/components/ui/refreshing-indicator';
import { useAsyncResource } from '@/hooks/useAsyncResource';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/use-permissions';

import { useRealtimeProjectActivity } from '@/hooks/use-realtime-activity';


import { TaskKanban } from './TaskKanban';
import { TaskTable } from './TaskTable';
import { Pagination } from '../../../components/Pagination';
import {
  type TaskWorkspaceItem,
  type TaskStatus,
} from './task-ui';

type TaskScope = 'ALL' | 'MINE' | 'OVERDUE' | 'REVIEW';
type TaskView = 'KANBAN' | 'TABLE';

const scopeLabels: Record<TaskScope, string> = {
  ALL: 'All Tasks',
  MINE: 'My Tasks',
  OVERDUE: 'Overdue',
  REVIEW: 'Review Queue',
};

import { useProjectParams } from '@/hooks/useProjectParams';
import { useProjectStore, selectProject, selectMembers } from '../../store/project-store';

export function TasksClient() {
  const router = useRouter();
  const { user } = useAuth();
  const { slug, numericId } = useProjectParams();
  const { can: canProject } = usePermissions({ resource: 'PROJECT', resourceId: numericId });

  // ── Store ─────────────────────────────────────────────────────────
  const { loadMembers } = useProjectStore();
  const membersState = useProjectStore(selectMembers(numericId));
  const storeMembers = membersState.list.map((m) => ({
    id: m.id,
    name: m.displayName || m.email,
  }));

  const [query, setQuery] = useState('');
  const [scope, setScope] = useState<TaskScope>('ALL');
  const [view, setView] = useState<TaskView>('TABLE');
  const [localTasks, setLocalTasks] = useState<TaskWorkspaceItem[]>([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  useEffect(() => {
    setPage(1);
  }, [query, scope, view]);

  const { activities } = useRealtimeProjectActivity(numericId);

  // Load members from store
  useEffect(() => {
    void loadMembers(numericId);
  }, [numericId, loadMembers]);

  const { data, error, isInitialLoading, isRefreshing, reload } = useAsyncResource(async () => {
    // Step 1: get folders (1 request)
    const foldersRes = await getProjectFolders(numericId);
    const foldersList = foldersRes.folders || [];

    // Step 2: fan-out getFolderFiles for ALL folders in parallel
    const filesArrays = await Promise.all(
      foldersList.map(async (folder) => {
        try {
          const res = await getFolderFiles(folder.id);
          return res.files || [];
        } catch {
          return [];
        }
      })
    );
    const allFiles = filesArrays.flat();
    const apiProjectFiles = allFiles.map((f) => ({ id: f.id, title: f.title }));

    // Step 3: fan-out getFileTasks for ALL files in parallel
    const tasksArrays = await Promise.all(
      allFiles.map(async (file) => {
        try {
          const dbTasks = await getFileTasks(file.id);
          return dbTasks.map((t: any) => {
            const frame = t.commentFrames?.[0];
            const region = frame
              ? {
                startX: parseDecimal(frame.startX),
                startY: parseDecimal(frame.startY),
                endX: parseDecimal(frame.endX),
                endY: parseDecimal(frame.endY),
              }
              : undefined;

            const assigneeName = t.assignedByUser?.displayName || t.assignedByUser?.email || 'Unassigned';
            const versionMatch = t.description?.match(/\[version:(v\d+)\]/);
            const taskVersion = versionMatch ? versionMatch[1] : undefined;
            const cleanDesc = getCleanTaskDescription(t.description);

            return {
              assignee: assigneeName,
              assigneeId: t.assignedByUser?.id,
              description: cleanDesc,
              dueDate: t.deadline ? new Date(t.deadline).toLocaleDateString() : 'No due date',
              fileId: file.id,
              fileTitle: file.title,
              id: String(t.id),
              isMine: user?.id != null && t.assignedByUser?.id === user.id,
              createdByUserId: t.createdByUser?.id,
              previewUrl: '',
              priority: 'MEDIUM',
              region,
              status: t.status,
              submissions: [],
              title: t.title,
              updatedAt: new Date(t.updatedAt).toLocaleDateString(),
              targetVersion: taskVersion,
              parent: t.parent ? {
                id: String(t.parent.id),
                title: t.parent.title,
                description: getCleanTaskDescription(t.parent.description),
                status: t.parent.status,
              } : null,
            } as TaskWorkspaceItem;
          });
        } catch {
          return [];
        }
      })
    );

    return {
      projectFiles: apiProjectFiles,
      tasks: tasksArrays.flat(),
    };
  }, [numericId]);

  const members = storeMembers;
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

  const isProjectOwner =
    (user?.id != null && (data as any)?.project?.createdBy === user.id) ||
    canProject('project:owner');

  const canReviewTask = useCallback((task: TaskWorkspaceItem) => {
    const isTaskAssigner = user?.id != null && task.createdByUserId === user.id;
    const isTaskAssignee = task.isMine === true;
    return (isTaskAssigner && !isTaskAssignee) || canProject('admin') || isProjectOwner || canProject('project:task.update');
  }, [user?.id, canProject, isProjectOwner]);

  const visibleTasks = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return localTasks.filter((task) => {
      const matchesQuery =
        !normalizedQuery ||
        [task.title, task.fileTitle, task.assignee, task.description].some((value) =>
          value?.toLowerCase().includes(normalizedQuery),
        );
      const matchesScope =
        scope === 'ALL' ||
        (scope === 'MINE' && task.isMine) ||
        (scope === 'REVIEW' && task.status === 'REVIEW') ||
        (scope === 'OVERDUE' && task.dueDate !== 'No due date' && new Date(task.dueDate) < new Date());

      return matchesQuery && matchesScope;
    });
  }, [query, scope, localTasks]);

  const paginatedTasks = useMemo(() => {
    const startIndex = (page - 1) * limit;
    return visibleTasks.slice(startIndex, startIndex + limit);
  }, [visibleTasks, page, limit]);

  const totalPages = Math.ceil(visibleTasks.length / limit);


  const openTask = (task: TaskWorkspaceItem) => {
    router.push(
      `/studio/projects/${slug}/files/${task.fileId}?taskId=${encodeURIComponent(task.id)}&from=tasks`,
    );
  };

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus, comment?: string) => {
    // 1. Optimistic update immediately
    const prevTasks = localTasks;
    const currentTask = localTasks.find(t => t.id === taskId);
    
    setLocalTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)),
    );
    try {
      let newDescription = currentTask?.description || '';

      if (newStatus === 'REVIEW' && currentTask?.status !== 'REVIEW') {
        newDescription = `${newDescription}\n[Note: Marked as ready for review without file upload]`.trim();
      } else if (newStatus === 'INPROGRESS' && currentTask?.status === 'REVIEW') {
        const finalNote = comment?.trim() || '';
        const reviewerTag = ` [Reviewer: ${finalNote}] [Result: CHANGES_REQUESTED]`;
        newDescription = `${newDescription}${reviewerTag}`;
      } else if (newStatus === 'DONE' && currentTask?.status === 'REVIEW') {
        const reviewerTag = ` [Reviewer: Looks good!] [Result: APPROVED]`;
        newDescription = `${newDescription}${reviewerTag}`;
      }

      await updateTask(taskId, { 
        status: newStatus,
        description: newDescription !== currentTask?.description ? newDescription : undefined
      });
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

      </header>

      {error ? (
        <p className="mt-4 rounded-[4px] border border-red-400/30 bg-red-950/20 px-4 py-3 text-xs font-bold text-red-300">
          {error}
        </p>
      ) : null}



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
            <TaskTable isLoading={isInitialLoading} onOpenTask={openTask} tasks={paginatedTasks} />
          ) : (
            <TaskKanban
              canReview={canReviewTask}
              onOpenTask={openTask}
              onStatusChange={handleStatusChange}
              tasks={paginatedTasks}
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
