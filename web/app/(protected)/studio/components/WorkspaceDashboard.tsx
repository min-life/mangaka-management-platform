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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  deleteProject,
  getProjects,
  leaveProject,
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
  leaveEditorBoard,
  type EditorBoardResponse,
} from '@/services/editor-board.service';
import { getMyTasks, type TaskResponse } from '@/services/task.service';
import { getApplications, type ApplicationResponse } from '@/services/application.service';
import { toast } from '@/lib/toast';
import { useAsyncResource } from '@/hooks/useAsyncResource';


import { CreateBoardDialog } from './CreateBoardDialog';
import { CreateProjectDialog } from './CreateProjectDialog';
import { WorkspaceHeader } from './WorkspaceHeader';
import { ProjectsTab } from './ProjectsTab';
import { EditProjectDialog } from './EditProjectDialog';
import { MyTasksTab } from './MyTasksTab';
import { EditorBoardsTab } from './EditorBoardsTab';
import { ApplicationsTab } from './ApplicationsTab';
import { LoadingState } from '@/components/ui/loading-state';

type ViewMode = 'gallery' | 'table';
type WorkspaceTab = 'editorBoards' | 'myTasks' | 'projects' | 'applications';

type WorkspaceTaskResponse = TaskResponse & {
  file?:
    | (TaskResponse['file'] & {
        project?: {
          name?: string;
        };
        projectId?: number;
      })
    | null;
};

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
  const [apiTasks, setApiTasks] = useState<WorkspaceTaskResponse[]>([]);
  const [apiApplications, setApiApplications] = useState<ApplicationResponse[]>([]);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (
      tab === 'editorBoards' ||
      tab === 'myTasks' ||
      tab === 'projects' ||
      tab === 'applications'
    ) {
      queueMicrotask(() => {
        setActiveTab(tab);
        setSearchQuery('');
      });
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

  const [applicationsPage, setApplicationsPage] = useState(1);
  const [applicationsLimit, setApplicationsLimit] = useState(10);
  const [applicationsTotal, setApplicationsTotal] = useState(0);
  const [applicationsTotalPages, setApplicationsTotalPages] = useState(1);

  // Removed hasLoadedOnce
  const [projectsFilter, setProjectsFilter] = useState<'all' | 'me'>('all');
  const [boardsFilter, setBoardsFilter] = useState<'all' | 'me'>('all');

  const [projectsSortField, setProjectsSortField] = useState<
    'name' | 'updatedAt' | 'createdAt' | undefined
  >(undefined);
  const [projectsSortOrder, setProjectsSortOrder] = useState<'asc' | 'desc' | undefined>(undefined);

  const [boardsSortField, setBoardsSortField] = useState<
    'name' | 'updatedAt' | 'createdAt' | undefined
  >(undefined);
  const [boardsSortOrder, setBoardsSortOrder] = useState<'asc' | 'desc' | undefined>(undefined);

  const [applicationsSortField, setApplicationsSortField] = useState<
    'title' | 'createdAt' | undefined
  >(undefined);
  const [applicationsSortOrder, setApplicationsSortOrder] = useState<'asc' | 'desc' | undefined>(
    undefined,
  );

  const projectsResource = useAsyncResource(async () => {
    return await getProjects({
      page: projectsPage,
      limit: projectsLimit,
      me: projectsFilter === 'me' ? true : undefined,
      field: projectsSortField,
      order: projectsSortOrder,
    });
  }, [], [projectsPage, projectsLimit, projectsFilter, projectsSortField, projectsSortOrder]);

  const boardsResource = useAsyncResource(async () => {
    return await getEditorBoards({
      page: boardsPage,
      limit: boardsLimit,
      me: boardsFilter === 'me' ? true : undefined,
      field: boardsSortField,
      order: boardsSortOrder,
    });
  }, [], [boardsPage, boardsLimit, boardsFilter, boardsSortField, boardsSortOrder]);

  const tasksResource = useAsyncResource(async () => {
    return await getMyTasks({
      me: true,
      page: tasksPage,
      limit: tasksLimit,
    });
  }, [], [tasksPage, tasksLimit]);

  const applicationsResource = useAsyncResource(async () => {
    return await getApplications({
      page: applicationsPage,
      limit: applicationsLimit,
      field: applicationsSortField,
      order: applicationsSortOrder,
    });
  }, [], [applicationsPage, applicationsLimit, applicationsSortField, applicationsSortOrder]);

  const isLoadingProjects = projectsResource.isInitialLoading || projectsResource.isRefreshing;
  const isLoadingBoards = boardsResource.isInitialLoading || boardsResource.isRefreshing;
  const isLoadingTasks = tasksResource.isInitialLoading || tasksResource.isRefreshing;
  const isLoadingApplications =
    applicationsResource.isInitialLoading || applicationsResource.isRefreshing;

  const projectError = projectsResource.error;
  const boardError = boardsResource.error;
  const taskError = tasksResource.error;
  const applicationError = applicationsResource.error;

  useEffect(() => {
    const projectsData = projectsResource.data;
    if (projectsData) {
      queueMicrotask(() => {
        setApiProjects(projectsData.projects);
        if (projectsData.pagination) {
          setProjectsPage(projectsData.pagination.page);
          setProjectsLimit(projectsData.pagination.limit);
          setProjectsTotal(projectsData.pagination.total);
          setProjectsTotalPages(projectsData.pagination.totalPages);
        }
      });
    }
  }, [projectsResource.data]);

  useEffect(() => {
    const boardsData = boardsResource.data;
    if (boardsData) {
      queueMicrotask(() => {
        setApiBoards(boardsData.boards);
        if (boardsData.pagination) {
          setBoardsPage(boardsData.pagination.page);
          setBoardsLimit(boardsData.pagination.limit);
          setBoardsTotal(boardsData.pagination.total);
          setBoardsTotalPages(boardsData.pagination.totalPages);
        }
      });
    }
  }, [boardsResource.data]);

  useEffect(() => {
    const tasksData = tasksResource.data;
    if (tasksData) {
      queueMicrotask(() => {
        setApiTasks(tasksData.tasks);
        if (tasksData.pagination) {
          setTasksPage(tasksData.pagination.page);
          setTasksLimit(tasksData.pagination.limit);
          setTasksTotal(tasksData.pagination.total);
          setTasksTotalPages(tasksData.pagination.totalPages);
        }
      });
    }
  }, [tasksResource.data]);

  useEffect(() => {
    const applicationsData = applicationsResource.data;
    if (applicationsData) {
      queueMicrotask(() => {
        setApiApplications(applicationsData.applications);
        if (applicationsData.pagination) {
          setApplicationsPage(applicationsData.pagination.page);
          setApplicationsLimit(applicationsData.pagination.limit);
          setApplicationsTotal(applicationsData.pagination.total);
          setApplicationsTotalPages(applicationsData.pagination.totalPages);
        }
      });
    }
  }, [applicationsResource.data]);

  // Remove hasLoadedOnce effect

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

  const handleBoardsSort = (field: 'name' | 'updatedAt' | 'createdAt') => {
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

  const handleApplicationsSort = (field: string) => {
    const sortField = field as 'title' | 'createdAt';
    if (applicationsSortField === sortField) {
      if (applicationsSortOrder === 'asc') {
        setApplicationsSortOrder('desc');
      } else {
        setApplicationsSortField(undefined);
        setApplicationsSortOrder(undefined);
      }
    } else {
      setApplicationsSortField(sortField);
      setApplicationsSortOrder('asc');
    }
    setApplicationsPage(1);
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
        created: formatUpdatedAt(project.createdAt),
        updated: formatUpdatedAt(project.updatedAt),
      }))
      .filter((project) => {
        if (!normalizedQuery || activeTab !== 'projects') return true;
        return [project.name, project.editorBoard, project.createdBy, project.id].some((v) =>
          v.toLowerCase().includes(normalizedQuery),
        );
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
        createdByUser: board.createdByUser,
        created: formatUpdatedAt(board.createdAt),
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
        const assigneeName =
          t.assignedByUser?.displayName || t.assignedByUser?.email || 'Unassigned';
        const assigneeInitials = assigneeName.slice(0, 2).toUpperCase();
        return {
          id: t.id,
          title: t.title,
          projectId: t.file?.projectId,
          fileId: t.fileId,
          file: t.file?.title || `File #${t.fileId}`,
          project: t.file?.project?.name || 'Project',
          assignee: {
            color: '#0ea5e9',
            initials: assigneeInitials,
            name: assigneeName,
            user: t.assignedByUser,
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

  const applicationRows = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    return apiApplications
      .map((app) => {
        const assigneeName =
          app.createdByUser?.displayName || app.createdByUser?.email || 'Unknown user';
        const assigneeInitials = assigneeName.slice(0, 2).toUpperCase();
        return {
          id: app.id,
          title: app.title,
          type: app.type,
          status: app.status,
          project: app.project?.name || 'No project',
          projectId: app.projectId,
          createdBy: assigneeName,
          createdByUser: app.createdByUser,
          assignee: {
            initials: assigneeInitials,
          },
          created: formatUpdatedAt(app.createdAt),
          updated: formatUpdatedAt(app.updatedAt),
        };
      })
      .filter((app) => {
        if (!normalizedQuery || activeTab !== 'applications') return true;
        return [app.title, app.type, app.status, app.project, app.createdBy].some((v) =>
          v.toLowerCase().includes(normalizedQuery),
        );
      });
  }, [apiApplications, searchQuery, activeTab]);

  const headerContent = {
    editorBoards: {
      meta: isLoadingBoards ? 'Loading Boards' : `${boardTotal} Editor Boards`,
      title: 'Editor Boards',
    },
    myTasks: {
      meta: isLoadingTasks ? 'Loading Tasks' : `${apiTasks.length} Assigned Tasks`,
      title: 'My Tasks',
    },
    applications: {
      meta: isLoadingApplications ? 'Loading Applications' : `${applicationsTotal} Applications`,
      title: 'Applications',
    },
    projects: {
      meta: isLoadingProjects ? 'Loading Projects' : `${projectTotal} Active Projects`,
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

  const handleDeleteProject = async (project: ProjectResponse) => {
    if (
      !window.confirm(
        `Are you sure you want to delete project "${project.name}"? This cannot be undone.`,
      )
    ) {
      return;
    }
    try {
      await deleteProject(project.id);
      await loadProjects();
      toast.success(`Project "${project.name}" deleted.`);
    } catch {
      toast.error('Failed to delete project.');
    }
  };

  const handleLeaveProject = async (project: ProjectResponse) => {
    if (!window.confirm(`Are you sure you want to leave project "${project.name}"?`)) {
      return;
    }
    try {
      await leaveProject(project.id);
      await loadProjects();
      toast.success(`You have left project "${project.name}".`);
    } catch {
      toast.error('Failed to leave project.');
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

  const handleLeaveBoard = async (board: { boardId: number; name: string }) => {
    if (!window.confirm(`Are you sure you want to leave editor board "${board.name}"?`)) {
      return;
    }

    setActiveActionId(`board-${board.boardId}`);

    try {
      await leaveEditorBoard(board.boardId);
      await loadEditorBoards();
      toast.success(`You have left board "${board.name}".`);
    } catch {
      toast.error('Failed to leave editor board. Please try again.');
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
            <button
              className={`relative h-full px-2 text-sm ${
                activeTab === 'applications' ? 'font-bold text-[#FFD369]' : 'font-medium text-white'
              }`}
              onClick={() => setActiveTab('applications')}
              type="button"
            >
              Applications
              {activeTab === 'applications' ? (
                <span className="absolute inset-x-0 bottom-[-1px] h-[3px] bg-[#FFD369]" />
              ) : null}
            </button>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <div className="flex h-9 w-full max-w-[360px] items-center gap-3 rounded-[4px] border border-[#4b535f] bg-[#393E46] px-4 text-[#aeb7c2] sm:w-[360px]">
            <Search className="size-4 text-white" />
            <input
              className="min-w-0 flex-1 bg-transparent text-xs font-medium text-white outline-none placeholder:text-[#aeb7c2]"
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                activeTab === 'applications'
                  ? 'Search applications...'
                  : activeTab === 'myTasks'
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
            <Select
              value={projectsFilter}
              onValueChange={(value) => {
                setProjectsFilter(value as 'all' | 'me');
                setProjectsPage(1);
              }}
            >
              <SelectTrigger className="h-9 w-[150px] rounded-[4px] border-[#4b535f] bg-[#393E46] text-xs font-black text-white focus:ring-1 focus:ring-[#FFD369]">
                <SelectValue placeholder="Filter projects" />
              </SelectTrigger>
              <SelectContent className="border-[#4b535f] bg-[#2a333d] text-white">
                <SelectItem value="all" className="text-xs font-bold focus:bg-[#393E46] focus:text-[#FFD369] cursor-pointer">
                  All Projects
                </SelectItem>
                <SelectItem value="me" className="text-xs font-bold focus:bg-[#393E46] focus:text-[#FFD369] cursor-pointer">
                  Created by Me
                </SelectItem>
              </SelectContent>
            </Select>
          )}

          {activeTab === 'editorBoards' && (
            <Select
              value={boardsFilter}
              onValueChange={(value) => {
                setBoardsFilter(value as 'all' | 'me');
                setBoardsPage(1);
              }}
            >
              <SelectTrigger className="h-9 w-[150px] rounded-[4px] border-[#4b535f] bg-[#393E46] text-xs font-black text-white focus:ring-1 focus:ring-[#FFD369]">
                <SelectValue placeholder="Filter boards" />
              </SelectTrigger>
              <SelectContent className="border-[#4b535f] bg-[#2a333d] text-white">
                <SelectItem value="all" className="text-xs font-bold focus:bg-[#393E46] focus:text-[#FFD369] cursor-pointer">
                  All Boards
                </SelectItem>
                <SelectItem value="me" className="text-xs font-bold focus:bg-[#393E46] focus:text-[#FFD369] cursor-pointer">
                  Created by Me
                </SelectItem>
              </SelectContent>
            </Select>
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
          ) : activeTab === 'myTasks' || activeTab === 'applications' ? null : (
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
        {activeTab === 'projects' && projectsResource.isInitialLoading ? (
          <LoadingState message="Syncing projects..." minHeight="350px" />
        ) : activeTab === 'editorBoards' && boardsResource.isInitialLoading ? (
          <LoadingState message="Syncing editor boards..." minHeight="350px" />
        ) : activeTab === 'myTasks' && tasksResource.isInitialLoading ? (
          <LoadingState message="Syncing tasks..." minHeight="350px" />
        ) : activeTab === 'applications' && applicationsResource.isInitialLoading ? (
          <LoadingState message="Syncing applications..." minHeight="350px" />
        ) : (
          <div
            className={`transition-opacity duration-200 ${
              (activeTab === 'projects' && projectsResource.isRefreshing) ||
              (activeTab === 'editorBoards' && boardsResource.isRefreshing) ||
              (activeTab === 'myTasks' && tasksResource.isRefreshing) ||
              (activeTab === 'applications' && applicationsResource.isRefreshing)
                ? 'opacity-50 pointer-events-none'
                : ''
            }`}
          >
            {activeTab === 'applications' ? (
              <ApplicationsTab
                applicationRows={applicationRows}
                isLoading={applicationsResource.isInitialLoading}
                formatUserName={formatUserName}
                page={applicationsPage}
                limit={applicationsLimit}
                total={applicationsTotal}
                totalPages={applicationsTotalPages}
                onPageChange={setApplicationsPage}
                onLimitChange={setApplicationsLimit}
                sortField={applicationsSortField}
                sortOrder={applicationsSortOrder}
                onSort={handleApplicationsSort}
              />
            ) : activeTab === 'myTasks' ? (
              <MyTasksTab
                mappedTasks={mappedTasks}
                isLoadingTasks={tasksResource.isInitialLoading}
                formatUserName={formatUserName}
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
                isLoadingBoards={boardsResource.isInitialLoading}
                formatUserName={formatUserName}
                onRenameBoard={handleRenameBoard}
                onDeleteBoard={handleDeleteBoard}
                onLeaveBoard={handleLeaveBoard}
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
                onDeleteProject={handleDeleteProject}
                onLeaveProject={handleLeaveProject}
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
