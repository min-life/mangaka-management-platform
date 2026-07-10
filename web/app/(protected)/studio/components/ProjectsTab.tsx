'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ImageIcon, Settings, Loader2, ChevronsUpDown, ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Can } from '@/components/auth/Can';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { ProjectResponse } from '@/services/project.service';
import { Pagination } from './Pagination';

function SortIcon({
  activeField,
  activeOrder,
  field,
}: {
  activeField?: string;
  activeOrder?: string;
  field: string;
}) {
  if (activeField !== field) {
    return <ChevronsUpDown className="size-3.5 text-[#8b94a1]" />;
  }
  if (activeOrder === 'asc') {
    return <ChevronUp className="size-3.5 text-[#FFD369]" />;
  }
  return <ChevronDown className="size-3.5 text-[#FFD369]" />;
}

type ProjectsTabProps = {
  projects: ProjectResponse[];
  projectRows: any[];
  projectTotal: number;
  isLoadingProjects: boolean;
  viewMode: 'gallery' | 'table';
  onStartEdit: (project: ProjectResponse) => void;
  formatUserName: (user?: any) => string;
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  sortField?: 'name' | 'updatedAt' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
  onSort: (field: 'name' | 'updatedAt' | 'createdAt') => void;
};

export function ProjectsTab({
  projects,
  projectRows,
  projectTotal,
  isLoadingProjects,
  viewMode,
  onStartEdit,
  formatUserName,
  page,
  limit,
  total,
  totalPages,
  onPageChange,
  onLimitChange,
  sortField,
  sortOrder,
  onSort,
}: ProjectsTabProps) {
  const router = useRouter();

  if (viewMode === 'gallery') {
    if (isLoadingProjects) {
      return (
        <div className="flex min-h-[300px] w-full flex-col items-center justify-center space-y-3">
          <Loader2 className="size-8 animate-spin text-[#FFD369]" />
          <span className="text-xs font-bold text-[#8b94a1]">Loading projects...</span>
        </div>
      );
    }

    if (projectRows.length === 0) {
      return (
        <div className="flex min-h-[300px] w-full flex-col items-center justify-center space-y-2">
          <ImageIcon className="size-8 text-[#8b94a1]/55" />
          <span className="text-xs font-bold text-[#8b94a1]">No projects found.</span>
        </div>
      );
    }

    return (
      <>
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
                    const originalProject = projects.find((p) => p.id === project.projectId);
                    if (originalProject) {
                      onStartEdit(originalProject);
                    }
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
      <Pagination
        page={page}
        limit={limit}
        total={total}
        totalPages={totalPages}
        onPageChange={onPageChange}
        onLimitChange={onLimitChange}
      />
      </>
    );
  }

  // Table View
  return (
    <section className="mt-4 overflow-hidden rounded-[7px] border border-[#393E46] bg-[#0c1219]">
      <Table>
        <TableHeader>
          <TableRow className="h-[40px] border-[#393E46] bg-[#2a333d] hover:bg-[#2a333d]">
            <TableHead 
              className="w-[40%] px-5 text-[10px] font-black uppercase tracking-[0.08em] text-[#eef6ff] cursor-pointer select-none hover:text-white"
              onClick={() => onSort('name')}
            >
              <div className="flex items-center gap-1.5">
                Project
                <SortIcon activeField={sortField} activeOrder={sortOrder} field="name" />
              </div>
            </TableHead>
            <TableHead className="w-[200px] text-[10px] font-black uppercase tracking-[0.08em] text-[#eef6ff]">
              Created By
            </TableHead>
            <TableHead className="w-[220px] text-[10px] font-black uppercase tracking-[0.08em] text-[#eef6ff]">
              Editor Board
            </TableHead>
            <TableHead 
              className="w-[140px] text-[10px] font-black uppercase tracking-[0.08em] text-[#eef6ff] cursor-pointer select-none hover:text-white"
              onClick={() => onSort('createdAt')}
            >
              <div className="flex items-center gap-1.5">
                Created At
                <SortIcon activeField={sortField} activeOrder={sortOrder} field="createdAt" />
              </div>
            </TableHead>
            <TableHead 
              className="w-[180px] text-[10px] font-black uppercase tracking-[0.08em] text-[#eef6ff] cursor-pointer select-none hover:text-white"
              onClick={() => onSort('updatedAt')}
            >
              <div className="flex items-center gap-1.5">
                Last Updated
                <SortIcon activeField={sortField} activeOrder={sortOrder} field="updatedAt" />
              </div>
            </TableHead>
            <TableHead className="w-[90px] pr-5 text-right text-[10px] font-black uppercase tracking-[0.08em] text-[#eef6ff]">
              <Settings className="size-4 inline-block align-middle" />
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoadingProjects ? (
            <TableRow>
              <TableCell colSpan={6} className="h-40 text-center">
                <div className="flex flex-col items-center justify-center space-y-3">
                  <Loader2 className="size-6 animate-spin text-[#FFD369]" />
                  <span className="text-xs font-bold text-[#8b94a1]">Loading projects...</span>
                </div>
              </TableCell>
            </TableRow>
          ) : projectRows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="h-40 text-center text-xs font-bold text-[#8b94a1]">
                No projects found.
              </TableCell>
            </TableRow>
          ) : (
            projectRows.map((project) => (
              <TableRow
                className="h-[86px] cursor-pointer border-l-4 border-l-transparent border-r-0 border-t-0 border-b-[#393E46] bg-[#0b1118] transition-colors duration-150 hover:border-l-[#FFD369] hover:bg-[#202832]"
                key={project.id}
                onClick={() => router.push(`/studio/projects/${project.projectId}`)}
              >
                <TableCell className="px-5 py-3">
                  <div className="flex w-fit items-center gap-3">
                    {project.image && project.image.trim() !== '' ? (
                      <img
                        alt=""
                        className="size-14 rounded-md border border-[#393E46] object-cover"
                        src={project.image || undefined}
                      />
                    ) : (
                      <div className="grid size-14 place-items-center rounded-md border border-[#393E46] bg-[#111923] text-[#8b94a1]">
                        <ImageIcon className="size-6 text-[#8b94a1]/55" />
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-black leading-5 text-white hover:text-[#FFD369]">
                        {project.name}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-xs font-bold text-white">
                  <div className="flex items-center gap-2">
                    {project.createdByUser?.avatarUrl && project.createdByUser.avatarUrl.trim() !== '' ? (
                      <img
                        src={project.createdByUser.avatarUrl || undefined}
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
                <TableCell className="text-xs font-bold text-white">
                  {project.created}
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
                      onClick={() => {
                        const originalProject = projects.find((p) => p.id === project.projectId);
                        if (originalProject) {
                          onStartEdit(originalProject);
                        }
                      }}
                    >
                      <Settings className="size-4" />
                    </Button>
                  </Can>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <Pagination
        page={page}
        limit={limit}
        total={total}
        totalPages={totalPages}
        onPageChange={onPageChange}
        onLimitChange={onLimitChange}
      />
    </section>
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
