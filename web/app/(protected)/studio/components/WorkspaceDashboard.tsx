'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ChevronDown,
  Grid2X2,
  ImageIcon,
  List,
  MoreVertical,
  Pencil,
  Plus,
  Search,
  Settings,
  Trash2,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Can } from '@/components/auth/Can';
import {
  getProjects,
  type ProjectResponse,
} from '@/services/project.service';
import {
  deleteEditorBoard,
  getEditorBoards,
  updateEditorBoard,
  type EditorBoardResponse,
} from '@/services/editor-board.service';

import { CreateBoardDialog } from './CreateBoardDialog';
import { CreateProjectDialog } from './CreateProjectDialog';
import { WorkspaceHeader } from './WorkspaceHeader';
import { projectRows as fallbackProjectRows, taskRows } from '../const/workspace-dashboard-data';

const statusClassName: Record<string, string> = {
  INKING: 'border-[#4a4f55] bg-[#20282b] text-[#f2f6f4]',
  PENDING: 'border-[#4a4f55] bg-[#20282b] text-[#f2f6f4]',
  'SCRIPT PHASE': 'border-[#6c5516] bg-[#30270d] text-[#ffd35b]',
  STORYBOARD: 'border-[#4f6e73] bg-[#2a454a] text-[#e9fbff]',
};

const taskStatusClassName: Record<string, string> = {
  DONE: 'border-[#315846] bg-[#14291f] text-[#9df2c7]',
  INPROGRESS: 'border-[#4f6e73] bg-[#2a454a] text-[#e9fbff]',
  PENDING: 'border-[#4a4f55] bg-[#20282b] text-[#f2f6f4]',
  REVIEW: 'border-[#6c5516] bg-[#30270d] text-[#ffd35b]',
};

type ViewMode = 'gallery' | 'table';
type WorkspaceTab = 'editorBoards' | 'myTasks' | 'projects';

const statusLabel: Record<string, string> = {
  DONE: 'Done',
  INKING: 'Inking',
  INPROGRESS: 'In Progress',
  PENDING: 'Pending',
  REVIEW: 'Review',
  'SCRIPT PHASE': 'Script Phase',
  STORYBOARD: 'Storyboard',
};

function formatStatus(status: string) {
  return statusLabel[status] ?? status;
}

function formatUpdatedAt(updatedAt: string) {
  const updatedDate = new Date(updatedAt);
  const diffMs = Date.now() - updatedDate.getTime();

  if (Number.isNaN(diffMs)) {
    return updatedAt;
  }

  const diffMinutes = Math.max(1, Math.floor(diffMs / 60000));

  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

function formatUserName(user?: { displayName?: string | null; email?: string } | null) {
  return user?.displayName ?? user?.email ?? 'Unknown user';
}

export function WorkspaceDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('projects');
  const [apiProjects, setApiProjects] = useState<ProjectResponse[]>([]);
  const [apiBoards, setApiBoards] = useState<EditorBoardResponse[]>([]);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'editorBoards' || tab === 'myTasks' || tab === 'projects') {
      setActiveTab(tab);
    }
  }, [searchParams]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  const [isLoadingBoards, setIsLoadingBoards] = useState(true);
  const [projectError, setProjectError] = useState<string | null>(null);
  const [boardError, setBoardError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [activeActionId, setActiveActionId] = useState<string | null>(null);
  const isProjectsTab = activeTab === 'projects';
  const projectRows = useMemo(
    () =>
      apiProjects.map((project, index) => {
        const fallbackProject = fallbackProjectRows[index % fallbackProjectRows.length];

        return {
          editorBoard: project.editorBoard?.name ?? 'No board',
          id: `PRJ-${project.id}`,
          image: project.imageUrl ?? fallbackProject.image,
          description: project.description ?? 'No description',
          memberCount: project.userProjects?.length ?? 0,
          name: project.name,
          projectId: project.id,
          progress: 0,
          createdBy: formatUserName(project.createdByUser),
          createdByUser: project.createdByUser,
          status: 'PENDING',
          updated: formatUpdatedAt(project.updatedAt),
        };
      }),
    [apiProjects],
  );
  const projectTotal = projectRows.length;
  const boardRows = useMemo(
    () =>
      apiBoards.map((board) => ({
        id: `BRD-${board.id}`,
        boardId: board.id,
        name: board.name,
        description: board.description ?? 'No description',
        image: board.imageUrl,
        projectCount: board.numberOfProjects ?? board._count?.projects ?? 0,
        createdBy: formatUserName(board.createdByUser),
        updated: formatUpdatedAt(board.updatedAt),
      })),
    [apiBoards],
  );
  const boardTotal = boardRows.length;
  const headerContent = {
    editorBoards: {
      meta: isLoadingBoards ? 'Loading Boards' : `${boardTotal} Editor Boards`,
      subtitle: 'Coordinate review boards, leads, and editorial ownership across production.',
      title: 'Editor Boards',
    },
    myTasks: {
      meta: `${taskRows.length} Assigned Tasks`,
      subtitle: 'Track your cross-project assignments, reviews, and production handoffs.',
      title: 'My Tasks',
    },
    projects: {
      meta: isLoadingProjects ? 'Loading Projects' : `${projectTotal} Active Projects`,
      subtitle: 'Manage files, tasks, reviews, and publication workflows across your manga studio.',
      title: 'Projects',
    },
  }[activeTab];

  const loadProjects = useCallback(async () => {
    setIsLoadingProjects(true);
    setProjectError(null);

    try {
      const result = await getProjects();
      setApiProjects(result.projects);
    } catch {
      setProjectError('Unable to load projects.');
      setApiProjects([]);
    } finally {
      setIsLoadingProjects(false);
    }
  }, []);

  const loadEditorBoards = useCallback(async () => {
    setIsLoadingBoards(true);
    setBoardError(null);

    try {
      const result = await getEditorBoards();
      setApiBoards(result.boards);
    } catch {
      setBoardError('Unable to load editor boards.');
      setApiBoards([]);
    } finally {
      setIsLoadingBoards(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void loadProjects();
      void loadEditorBoards();
    });
  }, [loadEditorBoards, loadProjects]);

  const handleRenameBoard = async (board: { boardId: number; name: string }) => {
    const nextName = window.prompt('Rename editor board', board.name)?.trim();

    if (!nextName || nextName === board.name) {
      return;
    }

    setActiveActionId(`board-${board.boardId}`);
    setActionError(null);

    try {
      await updateEditorBoard(board.boardId, { name: nextName });
      await loadEditorBoards();
    } catch {
      setActionError('Unable to update editor board.');
    } finally {
      setActiveActionId(null);
    }
  };

  const handleDeleteBoard = async (board: { boardId: number; name: string }) => {
    if (!window.confirm(`Delete editor board "${board.name}"? This cannot be undone.`)) {
      return;
    }

    setActiveActionId(`board-${board.boardId}`);
    setActionError(null);

    try {
      await deleteEditorBoard(board.boardId);
      await loadEditorBoards();
    } catch {
      setActionError('Unable to delete editor board.');
    } finally {
      setActiveActionId(null);
    }
  };

  return (
    <main className="min-h-screen overflow-hidden bg-[#222831] text-[#eeeeee]">
      <WorkspaceHeader />

      <section className="px-8 pt-8">
        <div className="mb-4 flex items-end justify-between">
          <div>
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h1 className="text-[28px] font-bold leading-8 text-white">{headerContent.title}</h1>
              <span className="text-xs font-bold uppercase tracking-[0.08em] text-[#8b94a1]">
                {headerContent.meta}
              </span>
            </div>
            <p className="mt-1 text-sm font-medium text-[#aeb7c2]">
              {headerContent.subtitle}
            </p>
          </div>
        </div>

        <div className="flex h-10 items-center gap-8 border-b border-[#393E46]">
          <button
            className={`relative h-full px-2 text-sm ${
              activeTab === 'projects' ? 'font-bold text-[#FFD369]' : 'font-medium text-white'
            }`}
            onClick={() => setActiveTab('projects')}
            type="button"
          >
            Projects
            {activeTab === 'projects' ? (
              <span className="absolute inset-x-0 bottom-[-1px] h-[3px] bg-[#FFD369]" />
            ) : null}
          </button>
          <button
            className={`relative h-full px-2 text-sm ${
              activeTab === 'editorBoards' ? 'font-bold text-[#FFD369]' : 'font-medium text-white'
            }`}
            onClick={() => setActiveTab('editorBoards')}
            type="button"
          >
            Editor Boards
            {activeTab === 'editorBoards' ? (
              <span className="absolute inset-x-0 bottom-[-1px] h-[3px] bg-[#FFD369]" />
            ) : null}
          </button>
          <button
            className={`relative h-full px-2 text-sm ${
              activeTab === 'myTasks' ? 'font-bold text-[#FFD369]' : 'font-medium text-white'
            }`}
            onClick={() => setActiveTab('myTasks')}
            type="button"
          >
            My Tasks
            {activeTab === 'myTasks' ? (
              <span className="absolute inset-x-0 bottom-[-1px] h-[3px] bg-[#FFD369]" />
            ) : null}
          </button>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <div className="flex h-9 w-full max-w-[360px] items-center gap-3 rounded-[4px] border border-[#4b535f] bg-[#393E46] px-4 text-[#aeb7c2] sm:w-[360px]">
            <Search className="size-4 text-white" />
            <span className="text-xs">
              {activeTab === 'myTasks'
                ? 'Search tasks...'
                : activeTab === 'editorBoards'
                  ? 'Search boards...'
                  : 'Search projects...'}
            </span>
          </div>
          <Button
            className="h-9 w-[160px] rounded-[4px] border-[#4b535f] bg-[#101820] px-4 text-xs font-black text-white hover:bg-[#393E46]"
            variant="outline"
          >
            {activeTab === 'myTasks' ? 'Task: All' : 'Status: All'}
            <ChevronDown className="size-3.5" />
          </Button>

          {isProjectsTab ? (
            <>
              <div className="flex h-9 overflow-hidden rounded-[4px] border border-[#4b535f] bg-[#393E46] p-1">
                <button
                  aria-label="Gallery view"
                  className={`grid size-7 place-items-center rounded-[3px] ${
                    viewMode === 'gallery' ? 'bg-[#3a3021] text-[#FFD369]' : 'text-white'
                  }`}
                  onClick={() => setViewMode('gallery')}
                  type="button"
                >
                  <Grid2X2 className="size-4" />
                </button>
                <button
                  aria-label="Table view"
                  className={`grid size-7 place-items-center rounded-[3px] ${
                    viewMode === 'table' ? 'bg-[#3a3021] text-[#FFD369]' : 'text-white'
                  }`}
                  onClick={() => setViewMode('table')}
                  type="button"
                >
                  <List className="size-4" />
                </button>
              </div>
              <Can any={['admin', 'project:create']}>
                <CreateProjectDialog
                  editorBoards={apiBoards}
                  onCreated={() => {
                    void loadProjects();
                    void loadEditorBoards();
                  }}
                />
              </Can>
            </>
          ) : activeTab === 'myTasks' ? (
            <Button className="ml-auto h-9 rounded-[4px] bg-[#FFD369] px-4 text-xs font-black text-[#222831] hover:bg-[#eac04f]">
              <Plus className="size-4" />
              New Task
            </Button>
          ) : (
            <Can any={['admin', 'board:create']}>
              <div className="ml-auto">
                <CreateBoardDialog onCreated={() => void loadEditorBoards()} />
              </div>
            </Can>
          )}
        </div>

        {isProjectsTab && projectError ? (
          <p className="mt-4 rounded-[4px] border border-red-400/30 bg-red-950/20 px-4 py-3 text-xs font-bold text-red-300">
            {projectError}
          </p>
        ) : null}

        {actionError ? (
          <p className="mt-4 rounded-[4px] border border-red-400/30 bg-red-950/20 px-4 py-3 text-xs font-bold text-red-300">
            {actionError}
          </p>
        ) : null}

        {isProjectsTab ? (
          <p className="mt-3 text-[11px] font-bold text-[#8b94a1]">
            * Status and progress use UI fallback until the project summary API returns
            production metrics.
          </p>
        ) : null}

        {activeTab === 'editorBoards' && boardError ? (
          <p className="mt-4 rounded-[4px] border border-red-400/30 bg-red-950/20 px-4 py-3 text-xs font-bold text-red-300">
            {boardError}
          </p>
        ) : null}

        {activeTab === 'editorBoards' ? (
          <p className="mt-4 text-[11px] font-bold text-[#8b94a1]">
            Editor board metadata is loaded from the updated board API.
          </p>
        ) : null}

        {activeTab === 'myTasks' ? (
          <section className="mt-5 overflow-hidden rounded-[7px] border border-[#393E46] bg-[#0c1219]">
            <Table>
              <TableHeader>
                <TableRow className="h-[40px] border-[#393E46] bg-[#252e38] hover:bg-[#252e38]">
                  <TableHead className="w-[42%] px-5 text-[10px] font-black uppercase tracking-[0.08em] text-[#dce7f3]">
                    Task
                  </TableHead>
                  <TableHead className="w-[220px] text-[10px] font-black uppercase tracking-[0.08em] text-[#dce7f3]">
                    Project
                  </TableHead>
                  <TableHead className="w-[180px] text-[10px] font-black uppercase tracking-[0.08em] text-[#dce7f3]">
                    Assignee
                  </TableHead>
                  <TableHead className="w-[160px] text-[10px] font-black uppercase tracking-[0.08em] text-[#dce7f3]">
                    Status
                  </TableHead>
                  <TableHead className="w-[130px] text-[10px] font-black uppercase tracking-[0.08em] text-[#dce7f3]">
                    Due
                  </TableHead>
                  <TableHead className="w-[120px] text-[10px] font-black uppercase tracking-[0.08em] text-[#dce7f3]">
                    Updated
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {taskRows.map((task) => (
                  <TableRow
                    className="h-[72px] border-l-4 border-l-transparent border-r-0 border-t-0 border-b-[#393E46] bg-[#0b1118] hover:border-l-[#FFD369] hover:bg-[#202832]"
                    key={task.id}
                  >
                    <TableCell className="px-5">
                      <div>
                        <p className="text-sm font-black leading-5 text-white">{task.title}</p>
                        <p className="mt-1 text-xs font-bold text-[#aeb7c2]">
                          {task.file} <span className="text-[#5b626d]">-</span> {task.id}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs font-bold text-white">{task.project}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span
                          className="grid size-7 place-items-center rounded-full border border-[#121820] text-[9px] font-black text-white"
                          style={{ backgroundColor: task.assignee.color }}
                        >
                          {task.assignee.initials}
                        </span>
                        <span className="text-xs font-bold text-white">{task.assignee.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={`h-7 rounded-full border px-3 text-[11px] font-bold ${taskStatusClassName[task.status]}`}
                        variant="outline"
                      >
                        {formatStatus(task.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs font-bold text-white">{task.due}</TableCell>
                    <TableCell className="text-xs font-bold text-white">{task.updated}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </section>
        ) : activeTab === 'editorBoards' ? (
          <section className="mt-5 overflow-hidden rounded-[7px] border border-[#393E46] bg-[#0c1219]">
            <Table>
              <TableHeader>
                <TableRow className="h-[40px] border-[#393E46] bg-[#252e38] hover:bg-[#252e38]">
                  <TableHead className="w-[45%] px-5 text-[10px] font-black uppercase tracking-[0.08em] text-[#dce7f3]">
                    Board
                  </TableHead>
                  <TableHead className="w-[200px] text-[10px] font-black uppercase tracking-[0.08em] text-[#dce7f3]">
                    Created By
                  </TableHead>
                  <TableHead className="w-[180px] text-[10px] font-black uppercase tracking-[0.08em] text-[#dce7f3]">
                    Projects
                  </TableHead>
                  <TableHead className="w-[180px] text-[10px] font-black uppercase tracking-[0.08em] text-[#dce7f3]">
                    Last Updated
                  </TableHead>
                  <TableHead className="w-[90px] pr-5 text-right text-[10px] font-black uppercase tracking-[0.08em] text-[#dce7f3]">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {boardRows.map((board) => (
                  <TableRow
                    className="h-[72px] border-l-4 border-l-transparent border-r-0 border-t-0 border-b-[#393E46] bg-[#0b1118] hover:border-l-[#FFD369] hover:bg-[#202832]"
                    key={board.id}
                  >
                    <TableCell className="px-5">
                      <Link
                        className="flex items-center gap-4 rounded-[4px] outline-none transition-opacity hover:opacity-85 focus-visible:ring-2 focus-visible:ring-[#FFD369]"
                        href={`/studio/editor-boards/${board.boardId}/projects`}
                      >
                        {board.image ? (
                          <img
                            alt=""
                            className="size-12 rounded-[5px] border border-[#393E46] object-cover"
                            src={board.image}
                          />
                        ) : (
                          <span className="grid size-12 place-items-center rounded-[5px] border border-[#393E46] bg-[#151c25] text-xs font-black text-[#FFD369]">
                            {board.name
                              .split(' ')
                              .slice(0, 2)
                              .map((word) => word.charAt(0))
                              .join('')}
                          </span>
                        )}
                        <div>
                          <p className="text-sm font-black leading-5 text-white">{board.name}</p>
                          <p className="mt-1 text-xs font-bold text-[#aeb7c2]">{board.id}</p>
                        </div>
                      </Link>
                    </TableCell>
                    <TableCell className="text-xs font-bold text-white">
                      {board.createdBy}
                    </TableCell>
                    <TableCell className="text-xs font-bold text-white">
                      {board.projectCount} {board.projectCount === 1 ? 'project' : 'projects'}
                    </TableCell>
                    <TableCell className="text-xs font-bold text-white">
                      {board.updated}
                    </TableCell>
                    <TableCell className="pr-5 text-right">
                      <Can
                        any={['admin', 'board:owner']}
                        resource="BOARD"
                        resourceId={board.boardId}
                      >
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              className="size-7 text-white hover:bg-[#393E46]"
                              disabled={activeActionId === `board-${board.boardId}`}
                              size="icon"
                              variant="ghost"
                            >
                              <MoreVertical className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            className="min-w-36 rounded-[4px] border border-[#393E46] bg-[#101820] p-1 text-white"
                          >
                            <DropdownMenuItem
                              className="cursor-pointer rounded-[3px] px-2 py-2 text-xs font-bold focus:bg-[#393E46] focus:text-white"
                              onSelect={() => void handleRenameBoard(board)}
                            >
                              <Pencil className="size-3.5" />
                              Rename
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="cursor-pointer rounded-[3px] px-2 py-2 text-xs font-bold text-red-300 focus:bg-red-950/30 focus:text-red-200"
                              onSelect={() => void handleDeleteBoard(board)}
                            >
                              <Trash2 className="size-3.5" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </Can>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <footer className="flex h-[54px] items-center justify-between border-t border-[#393E46] bg-[#1d242d] px-5">
              <p className="text-sm font-bold text-white">
                {isLoadingBoards
                  ? 'Loading boards...'
                  : `Showing ${boardTotal ? 1 : 0} to ${boardTotal} of ${boardTotal} boards`}
              </p>
            </footer>
          </section>
        ) : viewMode === 'gallery' ? (
          <section className="mx-auto mt-4 grid max-w-[1600px] grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
            {projectRows.map((project) => (
              <article
                className="group overflow-hidden rounded-[7px] border border-[#393E46] bg-[#0c1219] transition-colors hover:border-[#FFD369]/60 hover:bg-[#101820]"
                key={project.id}
              >
                <div className="relative">
                  <Link
                    className="relative block aspect-[3/4] w-full overflow-hidden bg-[#101820]"
                    href={`/studio/projects/${project.projectId}`}
                  >
                    <ProjectCoverImage imageUrl={project.image} />
                    <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#0c1219] to-transparent" />
                    <Badge
                      className={`absolute right-3 top-3 h-6 rounded-full border px-2.5 text-[10px] font-black ${statusClassName[project.status]}`}
                      variant="outline"
                    >
                      {formatStatus(project.status)} *
                    </Badge>
                  </Link>
                  <Can
                    any={['admin', 'project:owner', 'project:update']}
                    resource="PROJECT"
                    resourceId={project.projectId}
                  >
                    <Button
                      className="absolute bottom-3 right-3 size-7 shrink-0 rounded-full bg-[#101820]/80 text-white hover:bg-[#393E46]"
                      size="icon"
                      variant="ghost"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        router.push(`/studio/projects/${project.projectId}/settings`);
                      }}
                    >
                      <Settings className="size-4" />
                    </Button>
                  </Can>
                </div>

                <div className="p-3.5">
                  <Link href={`/studio/projects/${project.projectId}`}>
                    <h2 className="truncate text-sm font-black leading-5 text-white hover:text-[#FFD369]">
                      {project.name}
                    </h2>
                  </Link>
                  <p className="mt-1 truncate text-[11px] font-bold text-[#aeb7c2]">
                    {project.id}
                    <span className="text-[#5b626d]"> • </span>
                    {project.createdBy}
                  </p>
                  <p className="mt-2 truncate text-[11px] font-bold text-[#8b94a1]">
                    Updated {project.updated}
                    <span className="text-[#5b626d]"> • </span>
                    {project.memberCount} {project.memberCount === 1 ? 'member' : 'members'}
                  </p>
                </div>
              </article>
            ))}
          </section>
        ) : (
          <section className="mt-4 overflow-hidden rounded-[7px] border border-[#393E46] bg-[#0c1219]">
            <Table>
              <TableHeader>
                <TableRow className="h-[40px] border-[#393E46] bg-[#2a333d] hover:bg-[#2a333d]">
                  <TableHead className="w-[40%] px-5 text-[10px] font-black uppercase tracking-[0.08em] text-[#eef6ff]">
                    Project
                  </TableHead>
                  <TableHead className="w-[200px] text-[10px] font-black uppercase tracking-[0.08em] text-[#eef6ff]">
                    Created By
                  </TableHead>
                  <TableHead className="w-[220px] text-[10px] font-black uppercase tracking-[0.08em] text-[#eef6ff]">
                    Editor Board
                  </TableHead>
                  <TableHead className="w-[120px] text-center text-[10px] font-black uppercase tracking-[0.08em] text-[#eef6ff]">
                    Team
                  </TableHead>
                  <TableHead className="w-[180px] text-[10px] font-black uppercase tracking-[0.08em] text-[#eef6ff]">
                    Last Updated
                  </TableHead>
                  <TableHead className="w-[90px] pr-5 text-right text-[10px] font-black uppercase tracking-[0.08em] text-[#eef6ff]">
                    <Settings className="size-4 inline-block align-middle" />
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projectRows.map((project) => (
                  <TableRow
                    className="h-[86px] cursor-pointer border-l-4 border-l-transparent border-r-0 border-t-0 border-b-[#393E46] bg-[#0b1118] transition-colors duration-150 hover:border-l-[#FFD369] hover:bg-[#202832]"
                    key={project.id}
                    onClick={() => router.push(`/studio/projects/${project.projectId}`)}
                  >
                    <TableCell className="px-5 py-3">
                      <div className="flex w-fit items-center gap-3">
                        <img
                          alt=""
                          className="size-14 rounded-md border border-[#393E46] object-cover"
                          src={project.image}
                        />
                        <div>
                          <p className="text-sm font-black leading-5 text-white hover:text-[#FFD369]">
                            {project.name}
                          </p>
                          <p className="mt-1 text-xs font-bold text-[#aeb7c2]">
                            {project.id}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs font-bold text-white">
                      <div className="flex items-center gap-2">
                        {project.createdByUser?.avatarUrl ? (
                          <img
                            src={project.createdByUser.avatarUrl}
                            alt=""
                            className="size-7 rounded-full border border-[#393E46] object-cover"
                          />
                        ) : (
                          <span className="grid size-7 place-items-center rounded-full border border-[#26303b] bg-[#393E46] text-[9px] font-black text-white">
                            {formatUserName(project.createdByUser).charAt(0).toUpperCase()}
                          </span>
                        )}
                        <span>{project.createdBy}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs font-bold text-white">
                      {project.editorBoard}
                    </TableCell>
                    <TableCell className="text-center text-xs font-bold text-white">
                      {project.memberCount} {project.memberCount === 1 ? 'member' : 'members'}
                    </TableCell>
                    <TableCell className="text-xs font-bold text-white">
                      {project.updated}
                    </TableCell>
                    <TableCell className="pr-5 text-right" onClick={(e) => e.stopPropagation()}>
                      <Can
                        any={['admin', 'project:owner', 'project:update']}
                        resource="PROJECT"
                        resourceId={project.projectId}
                      >
                        <Button
                          className="size-7 text-white hover:bg-[#393E46]"
                          size="icon"
                          variant="ghost"
                          onClick={() => router.push(`/studio/projects/${project.projectId}/settings`)}
                        >
                          <Settings className="size-4" />
                        </Button>
                      </Can>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <footer className="flex h-[54px] items-center justify-between border-t border-[#393E46] bg-[#1d242d] px-5">
              <p className="text-sm font-bold text-white">
                {isLoadingProjects
                  ? 'Loading projects...'
                  : `Showing ${projectTotal ? 1 : 0} to ${projectTotal} of ${projectTotal} projects`}
              </p>
              <div className="flex items-center gap-3 text-sm text-white">
                <Button
                  className="h-8 rounded-[4px] border-[#4b535f] bg-[#101820] px-4 text-sm font-bold text-[#8b94a1] hover:bg-[#393E46] hover:text-white"
                  variant="outline"
                >
                  Previous
                </Button>
                <span className="text-[#8b94a1]">1 of 6</span>
                <Button
                  className="h-8 rounded-[4px] border-[#4b535f] bg-[#101820] px-4 text-sm font-bold text-white hover:border-[#FFD369] hover:bg-[#393E46]"
                  variant="outline"
                >
                  Next
                </Button>
              </div>
            </footer>
          </section>
        )}
      </section>
    </main>
  );
}

function ProjectCoverImage({ imageUrl }: { imageUrl: string }) {
  const [hasImageError, setHasImageError] = useState(false);

  if (!imageUrl || hasImageError) {
    return (
      <span className="grid h-full w-full place-items-center bg-[#111923] text-[#8b94a1]">
        <span className="grid gap-3 text-center">
          <ImageIcon className="mx-auto size-9" />
          <span className="text-xs font-black uppercase tracking-[0.08em]">
            No Cover
          </span>
        </span>
      </span>
    );
  }

  return (
    <img
      alt=""
      className="block h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
      onError={() => setHasImageError(true)}
      src={imageUrl}
    />
  );
}
