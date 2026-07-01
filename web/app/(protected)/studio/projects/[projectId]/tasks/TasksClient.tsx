'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
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

import { CreateTaskDialog } from './CreateTaskDialog';
import { TaskKanban } from './TaskKanban';
import { TaskTable } from './TaskTable';
import {
  readTaskOverrides,
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
  const [tasks, setTasks] = useState<TaskWorkspaceItem[]>([]);
  const [projectFiles, setProjectFiles] = useState<{ id: number; title: string }[]>([]);
  const [members, setMembers] = useState<{ id: number; name: string }[]>([]);
  const [query, setQuery] = useState('');
  const [scope, setScope] = useState<TaskScope>('ALL');
  const [view, setView] = useState<TaskView>('TABLE');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // 1. Fetch folders
      const foldersRes = await getProjectFolders(projectId);
      const foldersList = foldersRes.folders || [];

      // 2. Fetch members
      try {
        const membersRes = await getProjectMembers(projectId);
        setMembers(
          (membersRes.members || []).map((m) => ({
            id: m.id,
            name: m.displayName || m.email,
          })),
        );
      } catch (err) {
        console.error('Failed to load project members:', err);
      }

      // 3. Fetch files for each folder
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
      setProjectFiles(allFiles.map((f) => ({ id: f.id, title: f.title })));

      // 4. Fetch tasks for each file
      const tasksPromises = allFiles.map(async (file) => {
        try {
          const dbTasks = await getFileTasks(file.id);

          // Get previewUrl for the file
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
              isFallback: false,
              isMine: /current|sarah/i.test(assigneeName),
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

      // Merge with overrides to keep state consistency
      const overrides = readTaskOverrides();
      const mergedTasks = allTasks.map((t) => {
        const override = overrides[t.id];
        if (override) {
          return {
            ...t,
            submissions: override.submissions || [],
            status: override.status || t.status,
          };
        }
        return t;
      });

      setTasks(mergedTasks);
    } catch {
      setError('Unable to load tasks.');
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    queueMicrotask(() => {
      void loadData();
    });
  }, [loadData]);

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

      await loadData();
    } catch (err) {
      console.error('Failed to create task:', err);
      setError('Failed to create task on the server.');
    }
  };

  const openTask = (task: TaskWorkspaceItem) => {
    router.push(
      `/studio/projects/${projectId}/files/${task.fileId}?taskId=${encodeURIComponent(task.id)}&from=tasks`,
    );
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

  if (isLoading) {
    return (
      <div className="grid min-h-[70vh] place-items-center text-sm font-bold text-[#aeb7c2]">
        Loading production tasks...
      </div>
    );
  }

  return (
    <section className="min-h-full bg-[#101820] px-5 py-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">Production Tasks</h1>
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

      <div className="mt-5 border border-[#303842] bg-[#0d151e]">
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
            <TaskTable onOpenTask={openTask} tasks={visibleTasks} />
          ) : (
            <TaskKanban onOpenTask={openTask} tasks={visibleTasks} />
          )}
        </div>
        <footer className="border-t border-[#303842] px-4 py-3 text-[10px] font-bold text-[#8b94a1]">
          Showing {visibleTasks.length} tasks.
        </footer>
      </div>
    </section>
  );
}
