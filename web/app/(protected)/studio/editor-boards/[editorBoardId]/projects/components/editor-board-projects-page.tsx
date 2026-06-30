'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  BarChart3,
  Bell,
  BookOpen,
  ChevronDown,
  CircleGauge,
  FolderOpen,
  LayoutDashboard,
  LogOut,
  MoreVertical,
  Plus,
  Search,
  Settings,
  User,
  Users,
  X,
} from 'lucide-react';

import { useAuth } from '@/hooks/useAuth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  StudioSidebar,
  type StudioSidebarItem,
} from '@/app/(protected)/studio/components/StudioSidebar';

import {
  getEditorBoardProjects,
  getEditorBoardProjectsSummary,
  type EditorBoardProject,
  type ProjectStatus,
  type PublishingStatus,
  type EditorBoardProjectsSummary,
} from '../services/editor-board-projects-service';

function getSidebarItems(editorBoardId: string): StudioSidebarItem[] {
  const baseHref = `/studio/editor-boards/${editorBoardId}`;

  return [
    { href: '/studio', icon: LayoutDashboard, label: 'Dashboard', exact: true },
    { href: `${baseHref}/projects`, icon: FolderOpen, label: 'Projects' },
    { href: `${baseHref}/members`, icon: Users, label: 'Members' },
    { href: `${baseHref}/applications`, icon: CircleGauge, label: 'Applications' },
    { href: `${baseHref}/publishing`, icon: BookOpen, label: 'Publishing' },
    { href: `${baseHref}/reports`, icon: BarChart3, label: 'Reports' },
    { href: `${baseHref}/settings`, icon: Settings, label: 'Settings' },
  ];
}

const statusLabels: Record<ProjectStatus, string> = {
  HIATUS: 'Hiatus',
  IN_PRODUCTION: 'In Production',
  STORYBOARDING: 'Storyboarding',
};

const publishingLabels: Record<PublishingStatus, string> = {
  LIVE: 'Live',
  PENDING_APPROVAL: 'Pending Approval',
  SCHEDULED: 'Scheduled',
};

const statusClassNames: Record<ProjectStatus, string> = {
  HIATUS: 'border-red-400/20 bg-red-500/10 text-red-300',
  IN_PRODUCTION: 'border-emerald-400/20 bg-emerald-500/10 text-emerald-300',
  STORYBOARDING: 'border-amber-400/20 bg-amber-500/10 text-[#FFD369]',
};

function getProgress(project: EditorBoardProject) {
  return project.projectStats[0]?.metrics.progress ?? 0;
}

function getProjectStatus(project: EditorBoardProject) {
  return project.projectStats[0]?.metrics.status ?? 'IN_PRODUCTION';
}

function getTargetChapter(project: EditorBoardProject) {
  return project.projectStats[0]?.metrics.targetChapter ?? 'Chapter --';
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

function ProjectCover({ project }: { project: EditorBoardProject }) {
  return (
    <div className="h-16 w-12 shrink-0 overflow-hidden rounded-[4px] border border-[#50555D] bg-[#2f353e]">
      {project.imageUrl ? (
        <img
          alt={`${project.name} thumbnail`}
          className="h-full w-full object-cover"
          src={project.imageUrl}
        />
      ) : (
        <div className="grid h-full w-full place-items-center text-[10px] font-bold text-[#C8C8C8]">
          {project.name.slice(0, 2).toUpperCase()}
        </div>
      )}
    </div>
  );
}

function MemberStack({ members }: { members: EditorBoardProject['members'] }) {
  return (
    <div className="flex -space-x-2">
      {members.map((member) => (
        <Avatar
          className="size-8 border-2 border-[#1a2029]"
          key={member.id}
          title={member.roleName}
        >
          <AvatarImage alt={member.displayName} src={member.avatarUrl} />
          <AvatarFallback>{member.displayName.slice(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
      ))}
    </div>
  );
}

function ProjectDrawer({
  open,
  project,
  onOpenChange,
}: {
  open: boolean;
  project: EditorBoardProject | null;
  onOpenChange: (open: boolean) => void;
}) {
  if (!project) {
    return null;
  }

  const status = getProjectStatus(project);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        className="w-[400px] max-w-[calc(100vw-32px)] gap-0 border-[#50555D] bg-[#1a2029] p-0 text-[#dde3ef] sm:max-w-[400px]"
        side="right"
        showCloseButton={false}
      >
        <SheetHeader className="border-b border-[#50555D] bg-[#242a33] p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <SheetTitle className="text-[24px] font-semibold leading-8 text-white">
                Project Overview
              </SheetTitle>
              <SheetDescription className="text-sm text-[#C8C8C8]">
                Detailed production summary and editorial status.
              </SheetDescription>
            </div>
            <button
              aria-label="Close project overview"
              className="grid size-8 place-items-center rounded-[4px] text-[#C8C8C8] hover:bg-[#2f353e] hover:text-white"
              onClick={() => onOpenChange(false)}
              type="button"
            >
              <X className="size-4" />
            </button>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-6">
          <h3 className="text-[18px] font-semibold leading-6 text-[#FFD369]">{project.name}</h3>
          <p className="mt-1 text-sm leading-5 text-[#C8C8C8]">{project.description}</p>

          <div className="mt-8 grid grid-cols-2 gap-4">
            <div className="rounded-[4px] border border-[#50555D] bg-[#0e141c] p-4">
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.05em] text-[#C8C8C8]">
                Current Target*
              </p>
              <p className="text-[13px] font-medium text-white">{getTargetChapter(project)}</p>
            </div>
            <div className="rounded-[4px] border border-[#50555D] bg-[#0e141c] p-4">
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.05em] text-[#C8C8C8]">
                Contact*
              </p>
              <p className="text-[13px] font-medium text-white">{project.contactName}</p>
            </div>
          </div>

          <div className="mt-8 rounded-[8px] border border-red-400/20 bg-red-500/5 p-6">
            <div className="mb-4 flex items-center gap-2 text-red-300">
              <CircleGauge className="size-5" />
              <p className="text-[13px] font-medium uppercase tracking-wide">Next Deadline*</p>
            </div>
            <p className="text-[24px] font-semibold leading-8 text-[#dde3ef]">
              {formatDate(project.nextDeadline)}
            </p>
            <p className="mt-2 text-xs text-red-300">
              Critical: Editorial review required within 24h.
            </p>
          </div>

          <div className="mt-8">
            <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.05em] text-[#C8C8C8]">
              Pipeline Health*
            </p>
            <div className="space-y-4">
              <div>
                <div className="mb-1 flex justify-between text-xs">
                  <span className="text-[#C8C8C8]">Scripting</span>
                  <span className="text-emerald-300">Approved</span>
                </div>
                <div className="h-1 rounded-full bg-emerald-400" />
              </div>
              <div>
                <div className="mb-1 flex justify-between text-xs">
                  <span className="text-[#C8C8C8]">Pencils & Inks</span>
                  <span className="text-[#FFD369]">{statusLabels[status]}</span>
                </div>
                <Progress
                  className="h-1 rounded-full bg-[#2f353e] [&_[data-slot=progress-indicator]]:bg-[#FFD369]"
                  value={getProgress(project)}
                />
              </div>
              <div>
                <div className="mb-1 flex justify-between text-xs">
                  <span className="text-[#C8C8C8]">Lettering</span>
                  <span className="text-[#C8C8C8]">Waitlist</span>
                </div>
                <div className="h-1 rounded-full bg-[#2f353e]" />
              </div>
            </div>
          </div>
        </div>

        <SheetFooter className="grid grid-cols-2 gap-2 border-t border-[#50555D] bg-[#242a33] p-6">
          <Button
            asChild
            className="h-11 rounded-[4px] border-[#50555D] bg-[#2f353e] text-[13px] font-medium text-white hover:bg-[#50555D]"
            variant="outline"
          >
            <Link href={`/studio/projects/${project.id}/tasks`}>Project Logs</Link>
          </Button>
          <Button
            asChild
            className="h-11 rounded-[4px] bg-white text-[13px] font-medium text-[#2f3131] hover:bg-[#c6c6c7]"
          >
            <Link href={`/studio/projects/${project.id}`}>Open Editor</Link>
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

export function EditorBoardProjectsPage() {
  const params = useParams<{ editorBoardId?: string }>();
  const { logout, user } = useAuth();
  const editorBoardId = params.editorBoardId ?? '1';
  const [projects, setProjects] = useState<EditorBoardProject[]>([]);
  const [summary, setSummary] = useState<EditorBoardProjectsSummary | null>(null);
  const [selectedProject, setSelectedProject] = useState<EditorBoardProject | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | ProjectStatus>('ALL');
  const [sortBy, setSortBy] = useState<'ALPHA' | 'DEADLINE' | 'UPDATED'>('UPDATED');

  useEffect(() => {
    let isMounted = true;

    async function loadProjects() {
      setIsLoading(true);
      const [nextProjects, nextSummary] = await Promise.all([
        getEditorBoardProjects(editorBoardId),
        getEditorBoardProjectsSummary(editorBoardId),
      ]);

      if (isMounted) {
        setProjects(nextProjects);
        setSummary(nextSummary);
        setIsLoading(false);
      }
    }

    void loadProjects();

    return () => {
      isMounted = false;
    };
  }, [editorBoardId]);

  const visibleProjects = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return projects
      .filter((project) => {
        const matchesSearch =
          !normalizedSearch ||
          project.name.toLowerCase().includes(normalizedSearch) ||
          project.imprintName.toLowerCase().includes(normalizedSearch);
        const matchesStatus = statusFilter === 'ALL' || getProjectStatus(project) === statusFilter;

        return matchesSearch && matchesStatus;
      })
      .sort((first, second) => {
        if (sortBy === 'ALPHA') {
          return first.name.localeCompare(second.name);
        }

        if (sortBy === 'DEADLINE') {
          return new Date(first.nextDeadline).getTime() - new Date(second.nextDeadline).getTime();
        }

        return new Date(second.updatedAt).getTime() - new Date(first.updatedAt).getTime();
      });
  }, [projects, searchTerm, sortBy, statusFilter]);
  const sidebarItems = useMemo(() => getSidebarItems(editorBoardId), [editorBoardId]);
  const displayName = user?.displayName || user?.email || 'Current user';
  const email = user?.email ?? 'No email';
  const roleLabel = user?.role ?? 'Workspace Member';
  const initials =
    displayName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('') || 'U';

  return (
    <div className="flex min-h-screen bg-[#0e141c] text-[#dde3ef]">
      <StudioSidebar items={sidebarItems} subtitle="Manga Production" />

      <div className="min-w-0 flex-1">
        <header className="flex h-16 items-center justify-between border-b border-[#393E46] bg-[#222831] px-6">
          <div className="flex min-w-[360px] items-center gap-4">
            <img alt="Inkly" className="h-[50px] w-auto object-contain" src="/brand/1.png" />
            <div className="h-7 w-px bg-[#434A55]" />
            <div className="leading-tight">
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#8B93A5]">
                Editor Board
              </p>
              <h1 className="text-[15px] font-semibold text-white">Project Dashboard</h1>
            </div>
          </div>

          <div className="relative mx-8 hidden w-full max-w-xl lg:block">
            <Search className="absolute left-3 top-1/2 size-[18px] -translate-y-1/2 text-[#C8C8C8]" />
            <Input
              className="h-9 rounded-lg border-[#4b535f] bg-[#393E46] pl-10 text-sm font-medium text-white placeholder:text-[#8B93A5] focus-visible:border-[#FFD369] focus-visible:ring-[#FFD369]/20"
              placeholder="Search projects..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              className="relative rounded-lg p-2 text-[#B8BEC8] transition hover:bg-[#2F3742] hover:text-white"
              type="button"
            >
              <Bell className="size-5" />
              <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full border border-[#222831] bg-[#FFD369]" />
            </button>
            <button
              className="rounded-lg p-2 text-[#B8BEC8] transition hover:bg-[#2F3742] hover:text-white"
              type="button"
            >
              <Settings className="size-5" />
            </button>
            <div className="mx-2 h-8 w-px bg-[#434A55]" />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="flex items-center gap-4 rounded-xl px-2 py-1.5 transition hover:bg-[#2F3742]"
                  type="button"
                >
                  {user?.avatarUrl ? (
                    <img
                      alt={displayName}
                      className="h-9 w-9 rounded-full border border-[#FFD369] object-cover"
                      src={user.avatarUrl}
                    />
                  ) : (
                    <span className="grid h-9 w-9 place-items-center rounded-full border border-[#FFD369] bg-[#101820] text-xs font-black text-white">
                      {initials}
                    </span>
                  )}
                  <div className="hidden text-left md:block">
                    <p className="text-sm font-semibold leading-none text-white">{displayName}</p>
                    <p className="mt-1 text-[11px] font-medium text-[#8B93A5]">{roleLabel}</p>
                  </div>
                  <ChevronDown className="size-4 text-[#8B93A5]" />
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                align="end"
                className="w-72 border-[#393E46] bg-[#222831] text-white"
              >
                <DropdownMenuLabel className="py-3">
                  <div className="flex items-center gap-4">
                    {user?.avatarUrl ? (
                      <img
                        alt={displayName}
                        className="h-10 w-10 rounded-full object-cover"
                        src={user.avatarUrl}
                      />
                    ) : (
                      <span className="grid h-10 w-10 place-items-center rounded-full border border-[#FFD369] bg-[#101820] text-xs font-black text-white">
                        {initials}
                      </span>
                    )}
                    <div>
                      <p className="font-semibold">{displayName}</p>
                      <p className="text-xs text-[#8B93A5]">{email}</p>
                      <p className="text-[11px] font-bold text-[#FFD369]">{roleLabel}</p>
                    </div>
                  </div>
                </DropdownMenuLabel>

                <DropdownMenuSeparator className="bg-[#393E46]" />
                <DropdownMenuGroup>
                  <DropdownMenuItem asChild className="cursor-pointer focus:bg-[#2F3742]">
                    <Link href="/user-profile">
                      <User className="mr-2 size-4" />
                      My Profile
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator className="bg-[#393E46]" />
                <DropdownMenuItem
                  className="cursor-pointer text-red-400 focus:bg-[#2F3742] focus:text-red-400"
                  onClick={logout}
                >
                  <LogOut className="mr-2 size-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="h-[calc(100vh-64px)] overflow-y-auto p-6">
          <section className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <h1 className="text-[32px] font-bold leading-10 text-white">Project Dashboard</h1>
              <p className="mt-1 text-sm leading-5 text-[#C8C8C8]">
                Overseeing {summary?.projectCount ?? 0} active manga productions across{' '}
                {summary?.editorialTeamCount ?? 0} editorial teams*.
              </p>
            </div>

            <div className="flex items-end gap-2">
              <div className="flex flex-col gap-1">
                <span className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#C8C8C8]">
                  Filter
                </span>
                <Select
                  value={statusFilter}
                  onValueChange={(value) => setStatusFilter(value as typeof statusFilter)}
                >
                  <SelectTrigger className="h-9 w-[160px] rounded-[4px] border-[#50555D] bg-[#161c25] text-xs text-[#dde3ef]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-[#50555D] bg-[#1a2029] text-white">
                    <SelectItem value="ALL">All Statuses</SelectItem>
                    <SelectItem value="IN_PRODUCTION">In Production</SelectItem>
                    <SelectItem value="STORYBOARDING">Storyboarding</SelectItem>
                    <SelectItem value="HIATUS">Hiatus</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#C8C8C8]">
                  Sort
                </span>
                <Select value={sortBy} onValueChange={(value) => setSortBy(value as typeof sortBy)}>
                  <SelectTrigger className="h-9 w-[152px] rounded-[4px] border-[#50555D] bg-[#161c25] text-xs text-[#dde3ef]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-[#50555D] bg-[#1a2029] text-white">
                    <SelectItem value="UPDATED">Last Updated</SelectItem>
                    <SelectItem value="DEADLINE">Deadline</SelectItem>
                    <SelectItem value="ALPHA">Alphabetical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                asChild
                className="h-10 rounded-[4px] bg-white px-6 text-[13px] font-medium text-[#2f3131] hover:bg-[#c6c6c7]"
              >
                <Link href="/studio">
                  <Plus className="size-[18px]" />
                  Add Project
                </Link>
              </Button>
            </div>
          </section>

          <section className="overflow-hidden rounded-[8px] border border-[#50555D] bg-[#1a2029]">
            <Table>
              <TableHeader className="bg-[#242a33]">
                <TableRow className="border-[#50555D] hover:bg-transparent">
                  <TableHead className="h-12 px-4 text-[11px] font-semibold uppercase tracking-[0.05em] text-[#C8C8C8]">
                    Project Name
                  </TableHead>
                  <TableHead className="h-12 px-4 text-[11px] font-semibold uppercase tracking-[0.05em] text-[#C8C8C8]">
                    Status*
                  </TableHead>
                  <TableHead className="h-12 px-4 text-[11px] font-semibold uppercase tracking-[0.05em] text-[#C8C8C8]">
                    Members*
                  </TableHead>
                  <TableHead className="h-12 px-4 text-center text-[11px] font-semibold uppercase tracking-[0.05em] text-[#C8C8C8]">
                    Apps*
                  </TableHead>
                  <TableHead className="h-12 w-64 px-4 text-[11px] font-semibold uppercase tracking-[0.05em] text-[#C8C8C8]">
                    Chapter Progress*
                  </TableHead>
                  <TableHead className="h-12 px-4 text-[11px] font-semibold uppercase tracking-[0.05em] text-[#C8C8C8]">
                    Publishing*
                  </TableHead>
                  <TableHead className="h-12 px-4 text-right text-[11px] font-semibold uppercase tracking-[0.05em] text-[#C8C8C8]">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, index) => (
                    <TableRow className="border-[#50555D]" key={index}>
                      {Array.from({ length: 7 }).map((__, cellIndex) => (
                        <TableCell className="px-4 py-4" key={cellIndex}>
                          <Skeleton className="h-8 rounded-[4px] bg-[#2f353e]" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : visibleProjects.length ? (
                  visibleProjects.map((project) => {
                    const status = getProjectStatus(project);
                    const progress = getProgress(project);

                    return (
                      <TableRow
                        className="cursor-pointer border-[#50555D] transition-colors hover:bg-[#50555D]/20"
                        key={project.id}
                        onClick={() => setSelectedProject(project)}
                      >
                        <TableCell className="px-4 py-4">
                          <div className="flex items-center gap-4">
                            <ProjectCover project={project} />
                            <div>
                              <p className="text-[13px] font-medium text-white">{project.name}</p>
                              <p className="mt-1 text-xs text-[#C8C8C8]">{project.imprintName}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-4">
                          <Badge
                            className={`rounded-[4px] px-2 py-1 text-[11px] font-semibold ${statusClassNames[status]}`}
                          >
                            {statusLabels[status]}*
                          </Badge>
                        </TableCell>
                        <TableCell className="px-4 py-4">
                          <MemberStack members={project.members} />
                        </TableCell>
                        <TableCell className="px-4 py-4 text-center font-mono text-sm text-[#C8C8C8]">
                          <span
                            className={
                              project.applicationsCount > 5 ? 'font-bold text-red-300' : undefined
                            }
                          >
                            {project.applicationsCount}
                          </span>
                        </TableCell>
                        <TableCell className="w-64 px-4 py-4">
                          <div className="flex items-center gap-2">
                            <Progress
                              className={`h-1.5 flex-1 rounded-full bg-[#080f17] ${
                                status === 'HIATUS'
                                  ? '[&_[data-slot=progress-indicator]]:bg-red-400/50'
                                  : '[&_[data-slot=progress-indicator]]:bg-[#FFD369]'
                              }`}
                              value={progress}
                            />
                            <span className="w-10 font-mono text-xs text-[#dde3ef]">
                              {progress}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-4">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`size-2 rounded-full ${
                                project.publishingStatus === 'LIVE'
                                  ? 'bg-emerald-400'
                                  : project.publishingStatus === 'SCHEDULED'
                                    ? 'bg-[#FFD369]'
                                    : 'bg-[#50555D]'
                              }`}
                            />
                            <span className="text-xs text-white">
                              {publishingLabels[project.publishingStatus]}*
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-4 text-right">
                          <button
                            aria-label={`Open actions for ${project.name}`}
                            className="text-[#C8C8C8] hover:text-white"
                            onClick={(event) => {
                              event.stopPropagation();
                              setSelectedProject(project);
                            }}
                            type="button"
                          >
                            <MoreVertical className="size-5" />
                          </button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow className="border-[#50555D]">
                    <TableCell
                      className="px-4 py-10 text-center text-sm text-[#C8C8C8]"
                      colSpan={7}
                    >
                      No editor board projects found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </section>

          <section className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
            <article className="rounded-[8px] border border-[#50555D] bg-[#1a2029] p-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#C8C8C8]">
                Average Cycle Time*
              </p>
              <div className="mt-2 flex items-end justify-between">
                <span className="text-[32px] font-bold leading-10 text-white">
                  {summary?.averageCycleTimeDays ?? 0} Days
                </span>
                <span className="text-[13px] font-medium text-emerald-300">
                  <ChevronDown className="inline size-4" />
                  {summary?.averageCycleTimeTrendPercent ?? 0}%
                </span>
              </div>
            </article>
            <article className="rounded-[8px] border border-[#50555D] bg-[#1a2029] p-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#C8C8C8]">
                Active Staffers*
              </p>
              <div className="mt-2 flex items-end justify-between">
                <span className="text-[32px] font-bold leading-10 text-white">
                  {summary?.activeStaffers ?? 0}
                </span>
                <span className="text-[13px] font-medium text-[#C8C8C8]">
                  Total across all regions
                </span>
              </div>
            </article>
            <article className="rounded-[8px] border border-l-4 border-[#50555D] border-l-[#FFD369] bg-[#1a2029] p-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#FFD369]">
                Critical Deadlines*
              </p>
              <div className="mt-2 flex items-end justify-between">
                <span className="text-[32px] font-bold leading-10 text-white">
                  {String(summary?.criticalDeadlines ?? 0).padStart(2, '0')}
                </span>
                <span className="text-[13px] font-medium text-red-300">Next 48h</span>
              </div>
            </article>
          </section>
        </main>
      </div>

      <ProjectDrawer
        open={Boolean(selectedProject)}
        project={selectedProject}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedProject(null);
          }
        }}
      />
    </div>
  );
}
