'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Plus, Search } from 'lucide-react';

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
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { StatisticsClient } from '@/app/(protected)/studio/projects/[projectId]/statistics/StatisticsClient';

import {
  getEditorBoardProjects,
  type EditorBoardProject,
} from '../services/editor-board-projects-service';
import { getProjectSlug } from '@/utils/slug';
import { Pagination } from '../../../../components/Pagination';

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

function ProjectCover({ project }: { project: EditorBoardProject }) {
  return (
    <div className="h-16 w-12 shrink-0 overflow-hidden rounded-[4px] border border-[#39424f] bg-[#2f353e]">
      {project.imageUrl ? (
        <img
          alt={`${project.name} thumbnail`}
          className="h-full w-full object-cover"
          src={project.imageUrl}
        />
      ) : (
        <div className="grid h-full w-full place-items-center text-[10px] font-black text-[#FFD369]">
          {project.name.slice(0, 2).toUpperCase()}
        </div>
      )}
    </div>
  );
}

function UserCell({ user }: { user: EditorBoardProject['createdBy'] }) {
  if (!user) {
    return <span className="text-xs font-bold text-[#8b94a1]">—</span>;
  }

  return (
    <div className="flex items-center gap-2">
      <Avatar className="size-7 border border-[#1a2029]">
        <AvatarImage alt={user.displayName} src={user.avatarUrl ?? undefined} />
        <AvatarFallback>{user.displayName.slice(0, 2).toUpperCase()}</AvatarFallback>
      </Avatar>
      <span className="truncate text-xs font-bold text-[#dce7f3]">{user.displayName}</span>
    </div>
  );
}

export function EditorBoardProjectsPage() {
  const params = useParams<{ editorBoardId?: string }>();
  const editorBoardId = params.editorBoardId ?? '1';
  const [projects, setProjects] = useState<EditorBoardProject[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'ALPHA' | 'UPDATED'>('UPDATED');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  useEffect(() => {
    setPage(1);
  }, [searchTerm]);

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
          !normalizedSearch || project.name.toLowerCase().includes(normalizedSearch);

        return matchesSearch;
      })
      .sort((first, second) => {
        if (sortBy === 'ALPHA') {
          return first.name.localeCompare(second.name);
        }

        return new Date(second.updatedAt).getTime() - new Date(first.updatedAt).getTime();
      });
  }, [projects, searchTerm, sortBy]);

  const paginatedProjects = useMemo(() => {
    const startIndex = (page - 1) * limit;
    return visibleProjects.slice(startIndex, startIndex + limit);
  }, [visibleProjects, page, limit]);

  const totalPages = Math.ceil(visibleProjects.length / limit);
  const selectedProject = projects.find((project) => project.id === selectedProjectId) ?? null;

  if (selectedProjectId !== null) {
    return (
      <main className="px-5 py-6">
        <button
          className="mb-4 inline-flex items-center gap-2 rounded-[4px] px-2 py-1.5 text-xs font-black text-[#aeb7c2] hover:bg-[#17202b] hover:text-white"
          onClick={() => setSelectedProjectId(null)}
          type="button"
        >
          <ArrowLeft className="size-4" />
          Back to Projects
        </button>
        {selectedProject ? (
          <p className="mb-4 -mt-1 text-xs font-bold text-[#8b94a1]">
            Project / <span className="text-white">{selectedProject.name}</span>
          </p>
        ) : null}
        <div className="rounded-[5px] border border-[#39424f] bg-[#101820]">
          <StatisticsClient projectId={selectedProjectId} />
        </div>
      </main>
    );
  }

  return (
    <main className="px-5 py-6">
      <section className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h1 className="text-[24px] font-black leading-8 text-white">Project Dashboard</h1>
          <p className="mt-1 text-sm font-medium text-[#aeb7c2]">
            Overseeing {projects.length} active manga productions in this editor board.
          </p>
        </div>

        <div className="flex flex-wrap items-end gap-2">
          <div className="relative w-[320px] max-w-full">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#8b94a1]" />
            <Input
              className="h-9 rounded-[4px] border-[#39424f] bg-[#151c25] pl-10 text-xs font-medium text-white placeholder:text-[#8b94a1] focus-visible:border-[#FFD369] focus-visible:ring-[#FFD369]/20"
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search projects..."
              value={searchTerm}
            />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-black uppercase tracking-[0.08em] text-[#dce7f3]">
              Sort
            </span>
            <Select value={sortBy} onValueChange={(value) => setSortBy(value as typeof sortBy)}>
              <SelectTrigger className="h-9 w-[152px] rounded-[4px] border-[#39424f] bg-[#151c25] text-xs font-medium text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-[#39424f] bg-[#151c25] text-white">
                <SelectItem value="UPDATED">Last Updated</SelectItem>
                <SelectItem value="ALPHA">Alphabetical</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            asChild
            className="h-9 rounded-[4px] bg-[#FFD369] px-4 text-xs font-black text-[#101820] hover:bg-[#eac04f]"
          >
            <Link href="/studio">
              <Plus className="size-4" />
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

      <section>
        <div className="overflow-hidden rounded-[5px] border border-[#39424f] bg-[#101820]">
          <Table>
            <TableHeader>
              <TableRow className="h-[40px] border-[#39424f] bg-[#222a34] hover:bg-[#222a34]">
                <TableHead className="w-[28%] px-5 text-[10px] font-black uppercase tracking-[0.08em] text-[#dce7f3]">
                  Project Name
                </TableHead>
                <TableHead className="w-[20%] text-[10px] font-black uppercase tracking-[0.08em] text-[#dce7f3]">
                  Created By
                </TableHead>
                <TableHead className="w-[16%] text-[10px] font-black uppercase tracking-[0.08em] text-[#dce7f3]">
                  Created At
                </TableHead>
                <TableHead className="w-[16%] pr-5 text-[10px] font-black uppercase tracking-[0.08em] text-[#dce7f3]">
                  Updated At
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, index) => (
                  <TableRow
                    className="h-[72px] border-l-4 border-l-transparent border-r-0 border-t-0 border-b-[#303842] bg-[#101820]"
                    key={index}
                  >
                    {Array.from({ length: 4 }).map((__, cellIndex) => (
                      <TableCell className="px-4 py-4" key={cellIndex}>
                        <Skeleton className="h-8 rounded-[4px] bg-[#2f353e]" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : visibleProjects.length ? (
                paginatedProjects.map((project) => {
                  return (
                    <TableRow
                      className="h-[72px] cursor-pointer border-l-4 border-l-transparent border-r-0 border-t-0 border-b-[#303842] bg-[#101820] transition-all hover:border-l-[#FFD369] hover:bg-[#17202b]"
                      key={project.id}
                      onClick={() => setSelectedProjectId(project.id)}
                    >
                      <TableCell className="px-5">
                        <div className="flex items-center gap-4">
                          <ProjectCover project={project} />
                          <div>
                            <p className="text-sm font-black leading-5 text-white">
                              {project.name}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <UserCell user={project.createdBy} />
                      </TableCell>
                      <TableCell className="text-xs font-bold text-[#dce7f3]">
                        {formatDate(project.createdAt)}
                      </TableCell>
                      <TableCell className="pr-5 text-xs font-bold text-[#dce7f3]">
                        {formatDate(project.updatedAt)}
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow className="border-[#303842] bg-[#101820]">
                  <TableCell
                    className="px-5 py-10 text-center text-xs font-bold text-[#aeb7c2]"
                    colSpan={4}
                  >
                    No editor board projects found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <Pagination
            page={page}
            limit={limit}
            total={visibleProjects.length}
            totalPages={totalPages}
            onPageChange={setPage}
            onLimitChange={(newLimit) => {
              setLimit(newLimit);
              setPage(1);
            }}
          />
        </div>
      </section>
    </main>
  );
}
