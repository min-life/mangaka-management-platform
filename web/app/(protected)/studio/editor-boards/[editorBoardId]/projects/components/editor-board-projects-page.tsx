'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  MoreVertical,
  Plus,
  Search,
  X,
} from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

import { ProjectMetrics } from '@/components/project/ProjectMetrics';

import {
  getEditorBoardProjects,
  type EditorBoardProject,
} from '../services/editor-board-projects-service';

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
  const visibleMembers = members.slice(0, 3);
  const hiddenCount = Math.max(0, members.length - visibleMembers.length);

  return (
    <div className="flex items-center -space-x-2">
      {visibleMembers.map((member) => (
        <Avatar
          className="size-8 border-2 border-[#1a2029]"
          key={member.id}
          title={member.roleName}
        >
          <AvatarImage alt={member.displayName} src={member.avatarUrl} />
          <AvatarFallback>{member.displayName.slice(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
      ))}
      {hiddenCount > 0 ? (
        <span className="grid size-8 place-items-center rounded-full border-2 border-[#1a2029] bg-[#2f353e] text-[10px] font-bold text-[#dde3ef]">
          +{hiddenCount}
        </span>
      ) : null}
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

  const stat = project.projectStats[0];

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

          <div className="mt-8 rounded-[4px] border border-[#50555D] bg-[#0e141c] p-4">
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.05em] text-[#C8C8C8]">
              Contact
            </p>
            <p className="text-[13px] font-medium text-white">{project.contactName}</p>
          </div>

          {stat ? (
            <div className="mt-6">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.05em] text-[#C8C8C8]">
                Production Metrics
              </p>
              <ProjectMetrics columns={2} metrics={stat.metrics} updatedAt={stat.updatedAt} />
            </div>
          ) : null}
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
  const editorBoardId = params.editorBoardId ?? '1';
  const [projects, setProjects] = useState<EditorBoardProject[]>([]);
  const [selectedProject, setSelectedProject] = useState<EditorBoardProject | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'ALPHA' | 'UPDATED'>('UPDATED');

  useEffect(() => {
    let isMounted = true;

    async function loadProjects() {
      setIsLoading(true);
      setError(null);

      try {
        const nextProjects = await getEditorBoardProjects(editorBoardId);

        if (isMounted) {
          setProjects(nextProjects);
        }
      } catch {
        if (isMounted) {
          setProjects([]);
          setError('Unable to load editor board projects.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
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

        return matchesSearch;
      })
      .sort((first, second) => {
        if (sortBy === 'ALPHA') {
          return first.name.localeCompare(second.name);
        }

        return new Date(second.updatedAt).getTime() - new Date(first.updatedAt).getTime();
      });
  }, [projects, searchTerm, sortBy]);
  return (
    <>
      <main className="p-6">
          <section className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <h1 className="text-[32px] font-bold leading-10 text-white">Project Dashboard</h1>
              <p className="mt-1 text-sm leading-5 text-[#C8C8C8]">
                Overseeing {projects.length} active manga productions in this editor board.
              </p>
            </div>

            <div className="flex flex-wrap items-end gap-2">
              <div className="relative w-[320px] max-w-full">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#8b94a1]" />
                <Input
                  className="h-9 rounded-[4px] border-[#50555D] bg-[#161c25] pl-10 text-xs text-[#dde3ef] placeholder:text-[#8b94a1] focus-visible:border-[#FFD369] focus-visible:ring-[#FFD369]/20"
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search projects..."
                  value={searchTerm}
                />
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

          {error ? (
            <p className="mb-6 rounded-[6px] border border-red-400/30 bg-red-950/20 px-4 py-3 text-xs font-bold text-red-300">
              {error}
            </p>
          ) : null}

          <section className="overflow-hidden rounded-[8px] border border-[#50555D] bg-[#1a2029]">
            <Table>
              <TableHeader className="bg-[#242a33]">
                <TableRow className="border-[#50555D] hover:bg-transparent">
                  <TableHead className="h-12 px-4 text-[11px] font-semibold uppercase tracking-[0.05em] text-[#C8C8C8]">
                    Project Name
                  </TableHead>
                  <TableHead className="h-12 px-4 text-[11px] font-semibold uppercase tracking-[0.05em] text-[#C8C8C8]">
                    Members
                  </TableHead>
                  <TableHead className="h-12 px-4 text-[11px] font-semibold uppercase tracking-[0.05em] text-[#C8C8C8]">
                    Created At
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
                      {Array.from({ length: 4 }).map((__, cellIndex) => (
                        <TableCell className="px-4 py-4" key={cellIndex}>
                          <Skeleton className="h-8 rounded-[4px] bg-[#2f353e]" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : visibleProjects.length ? (
                  visibleProjects.map((project) => {
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
                          <Link
                            aria-label={`View members for ${project.name}`}
                            className="inline-flex rounded-[4px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFD369]"
                            href={`/studio/editor-boards/${editorBoardId}/members`}
                            onClick={(event) => event.stopPropagation()}
                          >
                            <MemberStack members={project.members} />
                          </Link>
                        </TableCell>
                        <TableCell className="px-4 py-4 text-sm font-medium text-[#dde3ef]">
                          {formatDate(project.createdAt)}
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
                      colSpan={4}
                    >
                      No editor board projects found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </section>
      </main>
      <ProjectDrawer
        open={Boolean(selectedProject)}
        project={selectedProject}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedProject(null);
          }
        }}
      />
    </>
  );
}
