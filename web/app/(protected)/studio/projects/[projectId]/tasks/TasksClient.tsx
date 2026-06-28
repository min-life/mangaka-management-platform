'use client';

import { useEffect, useMemo, useState } from 'react';
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

import { CreateTaskDialog } from './CreateTaskDialog';
import { TaskKanban } from './TaskKanban';
import { TaskTable } from './TaskTable';
import {
  fallbackProjectTasks,
  readTaskOverrides,
  readStoredTasks,
  writeStoredTasks,
  type TaskWorkspaceItem,
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
  const [tasks, setTasks] = useState<TaskWorkspaceItem[]>(fallbackProjectTasks);
  const [query, setQuery] = useState('');
  const [scope, setScope] = useState<TaskScope>('ALL');
  const [view, setView] = useState<TaskView>('TABLE');

  useEffect(() => {
    let isMounted = true;

    queueMicrotask(() => {
      if (!isMounted) return;
      const overrides = readTaskOverrides();
      setTasks(
        [...readStoredTasks(), ...fallbackProjectTasks].map((task) => overrides[task.id] ?? task),
      );
    });

    return () => {
      isMounted = false;
    };
  }, []);

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
        (scope === 'OVERDUE' && task.id === 'task-105');

      return matchesQuery && matchesScope;
    });
  }, [query, scope, tasks]);

  const fileOptions = useMemo(
    () =>
      Array.from(new Map(tasks.map((task) => [task.fileId, { id: task.fileId, title: task.fileTitle }])).values()),
    [tasks],
  );

  const handleCreate = (task: TaskWorkspaceItem) => {
    const storedTasks = [task, ...readStoredTasks()];
    writeStoredTasks(storedTasks);
    setTasks([task, ...tasks]);
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

  return (
    <section className="min-h-full bg-[#101820] px-5 py-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">Production Tasks</h1>
          <p className="mt-1 text-sm font-medium text-[#aeb7c2]">
            Assign, produce, submit, and review work linked to manga files.
          </p>
        </div>
        <CreateTaskDialog fileOptions={fileOptions} onCreate={handleCreate} />
      </header>

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
              className={`relative h-full shrink-0 px-3 text-xs font-black ${
                scope === value ? 'text-[#FFD369]' : 'text-[#aeb7c2] hover:text-white'
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
          Showing {visibleTasks.length} tasks. Fields marked * use frontend fallback until Task Workspace APIs are available.
        </footer>
      </div>
    </section>
  );
}
