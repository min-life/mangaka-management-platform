'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Grid2X2,
  ImageIcon,
  List,
  MoreVertical,
  Pencil,
  Search,
  Settings,
  Trash2,
  Loader2,
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
  updateProject,
  type ProjectResponse,
} from '@/services/project.service';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  deleteEditorBoard,
  getEditorBoards,
  updateEditorBoard,
  type EditorBoardResponse,
} from '@/services/editor-board.service';
import { getMyTasks } from '@/services/task.service';
import { toast } from '@/lib/toast';
import { useAsyncResource } from '@/hooks/useAsyncResource';
import { RefreshingIndicator } from '@/components/ui/refreshing-indicator';

import { CreateBoardDialog } from './CreateBoardDialog';
import { CreateProjectDialog } from './CreateProjectDialog';
import { WorkspaceHeader } from './WorkspaceHeader';
import { ProjectsTab } from './ProjectsTab';
import { EditProjectDialog } from './EditProjectDialog';
import { MyTasksTab } from './MyTasksTab';
import { EditorBoardsTab } from './EditorBoardsTab';
import { LoadingState } from '@/components/ui/loading-state';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [apiProjects, setApiProjects] = useState<ProjectResponse[]>([]);
  const [apiBoards, setApiBoards] = useState<EditorBoardResponse[]>([]);
  const [apiTasks, setApiTasks] = useState<any[]>([]);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'editorBoards' || tab === 'myTasks' || tab === 'projects') {
      setActiveTab(tab);
      setSearchQuery('');
    }
  }, [searchParams]);
  const [activeActionId, setActiveActionId] = useState<string | null>(null);
  
  // Edit Project States
  const [editingProject, setEditingProject] = useState<ProjectResponse | null>(null);
  const [editProjectName, setEditProjectName] = useState('');
  const [editProjectBoardId, setEditProjectBoardId] = useState('none');
  const [isSubmittingEditProject, setIsSubmittingEditProject] = useState(false);
  const [editProjectError, setEditProjectError] = useState<string | null>(null);

  // Pagination States
  const [projectsPage, setProjectsPage] = useState(1);
  const [projectsLimit, setProjectsLimit] = useState(10);
  const [projectsTotal, setProjectsTotal] = useState(0);
  const [projectsTotalPages, setProjectsTotalPages] = useState(1);

  const [boardsPage, setBoardsPage] = useState(1);
  const [boardsLimit, setBoardsLimit] = useState(10);
  const [boardsTotal, setBoardsTotal] = useState(0);
  const [boardsTotalPages, setBoardsTotalPages] = useState(1);

  const [tasksPage, setTasksPage] = useState(1);
  const [tasksLimit, setTasksLimit] = useState(10);
  const [tasksTotal, setTasksTotal] = useState(0);
  const [tasksTotalPages, setTasksTotalPages] = useState(1);

  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [projectsFilter, setProjectsFilter] = useState<'all' | 'me'>('all');
  const [boardsFilter, setBoardsFilter] = useState<'all' | 'me'>('all');

  const [projectsSortField, setProjectsSortField] = useState<'name' | 'updatedAt' | 'createdAt' | undefined>(undefined);
  const [projectsSortOrder, setProjectsSortOrder] = useState<'asc' | 'desc' | undefined>(undefined);

  const [boardsSortField, setBoardsSortField] = useState<'name' | 'createdAt' | undefined>(undefined);
  const [boardsSortOrder, setBoardsSortOrder] = useState<'asc' | 'desc' | undefined>(undefined);

  const projectsResource = useAsyncResource(async () => {
    return await getProjects({
      page: projectsPage,
      limit: projectsLimit,
      me: projectsFilter === 'me' ? true : undefined,
      field: projectsSortField,
      order: projectsSortOrder,
    });
  }, []);

  const boardsResource = useAsyncResource(async () => {
    return await getEditorBoards({
      page: boardsPage,
      limit: boardsLimit,
      me: boardsFilter === 'me' ? true : undefined,
      field: boardsSortField,
      order: boardsSortOrder,
    });
  }, []);

  const tasksResource = useAsyncResource(async () => {
    return await getMyTasks({
      me: true,
      page: tasksPage,
      limit: tasksLimit,
    });
  }, []);

  const isLoadingProjects = projectsResource.isInitialLoading || projectsResource.isRefreshing;
  const isLoadingBoards = boardsResource.isInitialLoading || boardsResource.isRefreshing;
  const isLoadingTasks = tasksResource.isInitialLoading || tasksResource.isRefreshing;

  const projectError = projectsResource.error;
  const boardError = boardsResource.error;
  const taskError = tasksResource.error;

  useEffect(() => {
    if (projectsResource.data) {
      setApiProjects(projectsResource.data.projects);
      if (projectsResource.data.pagination) {
        setProjectsPage(projectsResource.data.pagination.page);
        setProjectsLimit(projectsResource.data.pagination.limit);
        setProjectsTotal(projectsResource.data.pagination.total);
        setProjectsTotalPages(projectsResource.data.pagination.totalPages);
      }
    }
  }, [projectsResource.data]);

  useEffect(() => {
    if (boardsResource.data) {
      setApiBoards(boardsResource.data.boards);
      if (boardsResource.data.pagination) {
        setBoardsPage(boardsResource.data.pagination.page);
        setBoardsLimit(boardsResource.data.pagination.limit);
        setBoardsTotal(boardsResource.data.pagination.total);
        setBoardsTotalPages(boardsResource.data.pagination.totalPages);
      }
    }
  }, [boardsResource.data]);

  useEffect(() => {
    if (tasksResource.data) {
      setApiTasks(tasksResource.data.tasks);
      if (tasksResource.data.pagination) {
        setTasksPage(tasksResource.data.pagination.page);
        setTasksLimit(tasksResource.data.pagination.limit);
        setTasksTotal(tasksResource.data.pagination.total);
        setTasksTotalPages(tasksResource.data.pagination.totalPages);
      }
    }
  }, [tasksResource.data]);

  // Soft deps listeners for pagination (separately listen to prevent initial loading screen)
  useEffect(() => {
    void projectsResource.reload().catch(() => {});
  }, [projectsPage, projectsLimit, projectsFilter, projectsSortField, projectsSortOrder]);

  useEffect(() => {
    void boardsResource.reload().catch(() => {});
  }, [boardsPage, boardsLimit, boardsFilter, boardsSortField, boardsSortOrder]);

  useEffect(() => {
    void tasksResource.reload().catch(() => {});
  }, [tasksPage, tasksLimit]);

  useEffect(() => {
    if (!projectsResource.isInitialLoading && !boardsResource.isInitialLoading && !tasksResource.isInitialLoading) {
      setHasLoadedOnce(true);
    }
  }, [projectsResource.isInitialLoading, boardsResource.isInitialLoading, tasksResource.isInitialLoading]);

  const handleProjectsSort = (field: 'name' | 'updatedAt' | 'createdAt') => {
    if (projectsSortField === field) {
      if (projectsSortOrder === 'asc') {
        setProjectsSortOrder('desc');
      } else {
        setProjectsSortField(undefined);
        setProjectsSortOrder(undefined);
      }
    } else {
      setProjectsSortField(field);
      setProjectsSortOrder('asc');
    }
    setProjectsPage(1);
  };

  const handleBoardsSort = (field: 'name' | 'createdAt') => {
    if (boardsSortField === field) {
      if (boardsSortOrder === 'asc') {
        setBoardsSortOrder('desc');
      } else {
        setBoardsSortField(undefined);
        setBoardsSortOrder(undefined);
      }
    } else {
      setBoardsSortField(field);
      setBoardsSortOrder('asc');
    }
    setBoardsPage(1);
  };

  const isProjectsTab = activeTab === 'projects';
  const projectRows = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    return apiProjects
      .map((project) => ({
        editorBoard: project.editorBoard?.name ?? 'No board',
        id: `PRJ-${project.id}`,
        image: project.imageUrl ?? '',
        description: project.description ?? 'No description',
        memberCount: project.userProjects?.length ?? 0,
        name: project.name,
        projectId: project.id,
        progress: 0,
        createdBy: formatUserName(project.createdByUser),
        createdByUser: project.createdByUser,
        status: 'PENDING',
        updated: formatUpdatedAt(project.updatedAt),
      }))
      .filter((project) => {
        if (!normalizedQuery || activeTab !== 'projects') return true;
        return [
          project.name,
          project.editorBoard,
          project.createdBy,
          project.id,
        ].some((v) => v.toLowerCase().includes(normalizedQuery));
      });
  }, [apiProjects, searchQuery, activeTab]);
  const projectTotal = projectRows.length;
  const boardRows = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    return apiBoards
      .map((board) => ({
        id: `BRD-${board.id}`,
        boardId: board.id,
        name: board.name,
        description: board.description ?? 'No description',
        image: board.imageUrl,
        projectCount: board.numberOfProjects ?? board._count?.projects ?? 0,
        createdBy: formatUserName(board.createdByUser),
        updated: formatUpdatedAt(board.updatedAt),
      }))
      .filter((board) => {
        if (!normalizedQuery || activeTab !== 'editorBoards') return true;
        return [board.name, board.createdBy, board.id].some((v) =>
          v.toLowerCase().includes(normalizedQuery),
        );
      });
  }, [apiBoards, searchQuery, activeTab]);
  const boardTotal = boardRows.length;

  const mappedTasks = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    return apiTasks
      .map((t) => {
        const assigneeName = t.assignedByUser?.displayName || t.assignedByUser?.email || 'Unassigned';
        const assigneeInitials = assigneeName.slice(0, 2).toUpperCase();
        return {
          id: t.id,
          title: t.title,
          file: t.file?.title || `File #${t.fileId}`,
          project: t.file?.project?.name || 'Project',
          assignee: {
            color: '#0ea5e9',
            initials: assigneeInitials,
            name: assigneeName,
          },
          status: t.status,
          due: t.deadline ? new Date(t.deadline).toLocaleDateString() : 'No due date',
          updated: formatUpdatedAt(t.updatedAt),
        };
      })
      .filter((task) => {
        if (!normalizedQuery || activeTab !== 'myTasks') return true;
        return [task.title, task.file, task.project, task.assignee.name].some((v) =>
          v.toLowerCase().includes(normalizedQuery),
        );
      });
  }, [apiTasks, searchQuery, activeTab]);

  const headerContent = {
    editorBoards: {
      meta: isLoadingBoards ? 'Loading Boards' : `${boardTotal} Editor Boards`,
      subtitle: 'Coordinate review boards, leads, and editorial ownership across production.',
      title: 'Editor Boards',
    },
    myTasks: {
      meta: isLoadingTasks ? 'Loading Tasks' : `${apiTasks.length} Assigned Tasks`,
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
    await projectsResource.reload();
  }, [projectsResource]);

  const loadEditorBoards = useCallback(async () => {
    await boardsResource.reload();
  }, [boardsResource]);

  const loadTasks = useCallback(async () => {
    await tasksResource.reload();
  }, [tasksResource]);

  const handleStartEditProject = (project: ProjectResponse) => {
    setEditingProject(project);
    setEditProjectName(project.name);
    setEditProjectBoardId(project.editorBoardId ? String(project.editorBoardId) : 'none');
    setEditProjectError(null);
  };

  const handleEditProjectSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editingProject || !editProjectName.trim()) return;

    setIsSubmittingEditProject(true);
    setEditProjectError(null);

    try {
      await updateProject(editingProject.id, {
        name: editProjectName.trim(),
        editorBoardId: editProjectBoardId === 'none' ? null : Number(editProjectBoardId),
      });
      toast.success(`Project "${editProjectName.trim()}" updated successfully.`);
      setEditingProject(null);
      await loadProjects();
    } catch (err) {
      setEditProjectError('Failed to update project details. Please try again.');
    } finally {
      setIsSubmittingEditProject(false);
    }
  };

  const handleRenameBoard = async (board: { boardId: number; name: string }) => {
    const nextName = window.prompt('Rename editor board', board.name)?.trim();

    if (!nextName || nextName === board.name) {
      return;
    }

    setActiveActionId(`board-${board.boardId}`);

    try {
      await updateEditorBoard(board.boardId, { name: nextName });
      await loadEditorBoards();
      toast.success(`Board renamed to "${nextName}".`);
    } catch {
      toast.error('Failed to rename editor board. Please try again.');
    } finally {
      setActiveActionId(null);
    }
  };

  const handleDeleteBoard = async (board: { boardId: number; name: string }) => {
    if (!window.confirm(`Delete editor board "${board.name}"? This cannot be undone.`)) {
      return;
    }

    setActiveActionId(`board-${board.boardId}`);

    try {
      await deleteEditorBoard(board.boardId);
      await loadEditorBoards();
      toast.success(`Board "${board.name}" deleted.`);
    } catch {
      toast.error('Failed to delete editor board. Please try again.');
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

        <div className="flex h-10 items-center justify-between border-b border-[#393E46]">
          <div className="flex h-full items-center gap-8">
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
          <RefreshingIndicator
            isRefreshing={
              activeTab === 'projects'
                ? projectsResource.isRefreshing
                : activeTab === 'editorBoards'
                  ? boardsResource.isRefreshing
                  : tasksResource.isRefreshing
            }
          />
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <div className="flex h-9 w-full max-w-[360px] items-center gap-3 rounded-[4px] border border-[#4b535f] bg-[#393E46] px-4 text-[#aeb7c2] sm:w-[360px]">
            <Search className="size-4 text-white" />
            <input
              className="min-w-0 flex-1 bg-transparent text-xs font-medium text-white outline-none placeholder:text-[#aeb7c2]"
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                activeTab === 'myTasks'
                  ? 'Search tasks...'
                  : activeTab === 'editorBoards'
                    ? 'Search boards...'
                    : 'Search projects...'
              }
              value={searchQuery}
            />
            {searchQuery ? (
              <button
                className="text-[#aeb7c2] hover:text-white"
                onClick={() => setSearchQuery('')}
                type="button"
              >
                ×
              </button>
            ) : null}
          </div>

          {activeTab === 'projects' && (
            <div className="flex h-9 overflow-hidden rounded-[4px] border border-[#4b535f] bg-[#393E46] p-1 text-xs">
              <button
                className={`px-3 py-1 font-black rounded-[3px] transition ${
                  projectsFilter === 'all' ? 'bg-[#FFD369] text-[#222831]' : 'text-[#aeb7c2] hover:bg-[#4b535f] hover:text-white'
                }`}
                onClick={() => {
                  setProjectsFilter('all');
                  setProjectsPage(1);
                }}
                type="button"
              >
                All Projects
              </button>
              <button
                className={`px-3 py-1 font-black rounded-[3px] transition ${
                  projectsFilter === 'me' ? 'bg-[#FFD369] text-[#222831]' : 'text-[#aeb7c2] hover:bg-[#4b535f] hover:text-white'
                }`}
                onClick={() => {
                  setProjectsFilter('me');
                  setProjectsPage(1);
                }}
                type="button"
              >
                Created by Me
              </button>
            </div>
          )}

          {activeTab === 'editorBoards' && (
            <div className="flex h-9 overflow-hidden rounded-[4px] border border-[#4b535f] bg-[#393E46] p-1 text-xs">
              <button
                className={`px-3 py-1 font-black rounded-[3px] transition ${
                  boardsFilter === 'all' ? 'bg-[#FFD369] text-[#222831]' : 'text-[#aeb7c2] hover:bg-[#4b535f] hover:text-white'
                }`}
                onClick={() => {
                  setBoardsFilter('all');
                  setBoardsPage(1);
                }}
                type="button"
              >
                All Boards
              </button>
              <button
                className={`px-3 py-1 font-black rounded-[3px] transition ${
                  boardsFilter === 'me' ? 'bg-[#FFD369] text-[#222831]' : 'text-[#aeb7c2] hover:bg-[#4b535f] hover:text-white'
                }`}
                onClick={() => {
                  setBoardsFilter('me');
                  setBoardsPage(1);
                }}
                type="button"
              >
                Created by Me
              </button>
            </div>
          )}

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
              <CreateProjectDialog
                editorBoards={apiBoards}
                onCreated={() => {
                  void loadProjects();
                  void loadEditorBoards();
                }}
              />
            </>
          ) : activeTab === 'myTasks' ? null : (
            <div className="ml-auto">
              <CreateBoardDialog onCreated={() => void loadEditorBoards()} />
            </div>
          )}
        </div>

        {isProjectsTab && projectError ? (
          <p className="mt-4 rounded-[4px] border border-red-400/30 bg-red-950/20 px-4 py-3 text-xs font-bold text-red-300">
            {projectError}
          </p>
        ) : null}


        {activeTab === 'editorBoards' && boardError ? (
          <p className="mt-4 rounded-[4px] border border-red-400/30 bg-red-950/20 px-4 py-3 text-xs font-bold text-red-300">
            {boardError}
          </p>
        ) : null}
        {!hasLoadedOnce ? (
          <LoadingState message="Syncing studio workspace..." minHeight="350px" />
        ) : (
          <div
            className={`transition-opacity duration-200 ${
              (activeTab === 'projects' && projectsResource.isRefreshing) ||
              (activeTab === 'editorBoards' && boardsResource.isRefreshing) ||
              (activeTab === 'myTasks' && tasksResource.isRefreshing)
                ? 'opacity-50 pointer-events-none'
                : ''
            }`}
          >
            {activeTab === 'myTasks' ? (
              <MyTasksTab
                mappedTasks={mappedTasks}
                isLoadingTasks={tasksResource.isInitialLoading}
                page={tasksPage}
                limit={tasksLimit}
                total={tasksTotal}
                totalPages={tasksTotalPages}
                onPageChange={setTasksPage}
                onLimitChange={setTasksLimit}
              />
            ) : activeTab === 'editorBoards' ? (
              <EditorBoardsTab
                boardRows={boardRows}
                boardTotal={boardTotal}
                isLoadingBoards={boardsResource.isInitialLoading}
                onRenameBoard={handleRenameBoard}
                onDeleteBoard={handleDeleteBoard}
                page={boardsPage}
                limit={boardsLimit}
                total={boardsTotal}
                totalPages={boardsTotalPages}
                onPageChange={setBoardsPage}
                onLimitChange={setBoardsLimit}
                sortField={boardsSortField}
                sortOrder={boardsSortOrder}
                onSort={handleBoardsSort}
              />
            ) : (
              <ProjectsTab
                projects={apiProjects}
                projectRows={projectRows}
                projectTotal={projectTotal}
                isLoadingProjects={projectsResource.isInitialLoading}
                viewMode={viewMode}
                onStartEdit={handleStartEditProject}
                formatUserName={formatUserName}
                page={projectsPage}
                limit={projectsLimit}
                total={projectsTotal}
                totalPages={projectsTotalPages}
                onPageChange={setProjectsPage}
                onLimitChange={setProjectsLimit}
                sortField={projectsSortField}
                sortOrder={projectsSortOrder}
                onSort={handleProjectsSort}
              />
            )}
          </div>
        )}
      </section>

      <EditProjectDialog
        project={editingProject}
        open={Boolean(editingProject)}
        onOpenChange={(open) => {
          if (!open) setEditingProject(null);
        }}
        editorBoards={apiBoards}
        onUpdated={loadProjects}
      />
    </main>
  );
}
