'use client';

import { parseId, getProjectSlug } from '@/utils/slug';

import Link from 'next/link';
import { ChevronDown, FolderKanban, LogOut, User } from 'lucide-react';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { useAuth } from '@/hooks/useAuth';
import { getProjectById, getProjects, type ProjectResponse } from '@/services/project.service';

type ProjectAppHeaderProps = {
  projectId: string;
  projectName: string;
};

export function ProjectAppHeader({ projectId, projectName }: ProjectAppHeaderProps) {
  const router = useRouter();
  const { logout, user } = useAuth();
  const [activeProject, setActiveProject] = useState<ProjectResponse | null>(null);
  const [allProjects, setAllProjects] = useState<ProjectResponse[]>([]);

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    if (projectId) {
      void getProjectById(parseId(projectId))
        .then((res) => {
          setActiveProject(res);
          setIsLoading(false);
        })
        .catch(() => {
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
    void getProjects()
      .then((res) => {
        setAllProjects(res.projects || res || []);
      })
      .catch(() => {});
  }, [projectId]);

  const displayName = user?.displayName || user?.email || 'Current user';
  const email = user?.email ?? 'No email';
  const initials =
    displayName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('') || 'U';

  return (
    <header className="z-30 flex h-16 shrink-0 items-center justify-between border-b border-[#393E46] bg-[#222831] px-6">
      <div className="flex items-center gap-5">
        <div className="flex items-center text-xs font-black uppercase tracking-[0.08em] text-[#aeb7c2]">
          <Link
            href="/studio"
            className="flex h-9 items-center gap-1.5 rounded-[4px] border border-transparent px-3 text-[#aeb7c2] hover:border-[#39424f] hover:bg-[#222a34]"
          >
            <FolderKanban className="size-4 text-[#FFD369]" />
            <span>Workspace</span>
          </Link>
          <span className="text-[#5b626d] px-1">/</span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="flex h-9 items-center gap-1 rounded-[4px] border border-transparent px-3 text-[#FFD369] hover:border-[#39424f] hover:bg-[#222a34]"
                type="button"
              >
                {isLoading ? (
                  <div className="h-4 w-28 rounded bg-[#39424f] animate-pulse mx-1" />
                ) : (
                  <span>{activeProject?.name || projectName}</span>
                )}
                <ChevronDown className="size-3.5 text-[#dce7f3] ml-0.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              className="min-w-56 rounded-[4px] border border-[#39424f] bg-[#101820] p-1 text-white animate-in fade-in-50 duration-100"
            >
              {allProjects.map((p) => (
                <DropdownMenuItem
                  className="cursor-pointer rounded-[3px] px-2 py-2 text-xs font-bold focus:bg-[#303842] focus:text-white"
                  key={p.id}
                  onSelect={() => router.push(`/studio/projects/${getProjectSlug(p.id, p.name)}`)}
                >
                  <FolderKanban className="size-3.5 text-[#8b94a1] mr-1.5" />
                  {p.name}
                </DropdownMenuItem>
              ))}
              {allProjects.length === 0 && (
                <p className="px-2 py-1.5 text-[11px] font-bold text-[#8b94a1]">
                  No other workspace projects
                </p>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <NotificationBell />

        <div className="mx-2 h-8 w-px bg-[#434A55]" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="flex items-center gap-4 rounded-xl px-2 py-1.5 transition hover:bg-[#2F3742]"
              type="button"
            >
              {user?.avatarUrl && user.avatarUrl.trim() !== '' ? (
                <img
                  alt={displayName}
                  className="size-9 rounded-full border border-[#FFD369] object-cover"
                  src={user.avatarUrl}
                />
              ) : (
                <span className="grid size-9 place-items-center rounded-full border border-[#FFD369] bg-[#101820] text-xs font-black text-white">
                  {initials}
                </span>
              )}

              <div className="hidden text-left md:block">
                <p className="text-sm font-semibold leading-none text-white">{displayName}</p>
                <p className="mt-1 text-[11px] font-medium text-[#8B93A5]">
                  {user?.role ?? 'Workspace Member'}
                </p>
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
                {user?.avatarUrl && user.avatarUrl.trim() !== '' ? (
                  <img
                    alt={displayName}
                    className="size-10 rounded-full object-cover"
                    src={user.avatarUrl}
                  />
                ) : (
                  <span className="grid size-10 place-items-center rounded-full border border-[#FFD369] bg-[#101820] text-xs font-black text-white">
                    {initials}
                  </span>
                )}

                <div>
                  <p className="font-semibold">{displayName}</p>
                  <p className="text-xs text-[#8B93A5]">{email}</p>
                  <p className="text-[11px] font-bold text-[#FFD369]">
                    {user?.role ?? 'Workspace Member'}
                  </p>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-[#393E46]" />
            <DropdownMenuItem asChild className="cursor-pointer focus:bg-[#2F3742]">
              <Link href="/user-profile">
                <User className="mr-2 size-4" />
                My Profile
              </Link>
            </DropdownMenuItem>

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
  );
}
