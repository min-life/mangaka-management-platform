'use client';

import Link from 'next/link';
import {
  ArrowLeft,
  ChevronDown,
  FolderKanban,
  HelpCircle,
  LogOut,
  Search,
  Settings,
  User,
} from 'lucide-react';

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

  useEffect(() => {
    if (projectId) {
      void getProjectById(Number(projectId))
        .then(setActiveProject)
        .catch(() => {});
    }
    void getProjects()
      .then((res) => {
        setAllProjects(res.projects || res || []);
      })
      .catch(() => {});
  }, [projectId]);

  const displayProjectName = activeProject?.name || projectName;

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
    <header className="z-30 flex h-16 shrink-0 items-center justify-between border-b border-[#26303b] bg-[#171e27] px-5">
      <div className="flex items-center gap-5">
        <div className="flex h-9 w-[360px] items-center gap-3 rounded-[4px] border border-[#39424f] bg-[#222a34] px-3 text-[#8b94a1]">
          <Search className="size-4 text-[#dce7f3]" />
          <span className="text-xs font-medium">Search production data...</span>
        </div>
        <div className="hidden items-center text-xs font-black uppercase tracking-[0.08em] text-[#aeb7c2] lg:flex">
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
                <span>{displayProjectName}</span>
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
                  onSelect={() => router.push(`/studio/projects/${p.id}`)}
                >
                  <FolderKanban className="size-3.5 text-[#8b94a1] mr-1.5" />
                  {p.name}
                </DropdownMenuItem>
              ))}
              {allProjects.length === 0 && (
                <p className="px-2 py-1.5 text-[11px] font-bold text-[#8b94a1]">No other workspace projects</p>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <NotificationBell
          dotClassName="-right-0.5 -top-1 size-2 border-0"
          triggerClassName="rounded-[4px] p-1.5 text-white hover:bg-[#222a34]"
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="flex items-center gap-2 rounded-full border border-transparent px-1 py-1 hover:border-[#39424f] hover:bg-[#222a34]"
              type="button"
            >
              {user?.avatarUrl && user.avatarUrl.trim() !== '' ? (
                <img
                  alt={displayName}
                  className="size-8 rounded-full border border-[#FFD369] object-cover"
                  src={user.avatarUrl || undefined}
                />
              ) : (
                <span className="grid size-8 place-items-center rounded-full border border-[#FFD369] bg-[#151c25] text-xs font-black text-white">
                  {initials}
                </span>
              )}
              <ChevronDown className="size-3.5 text-[#aeb7c2]" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-64 rounded-[4px] border border-[#39424f] bg-[#101820] p-1 text-white"
          >
            <DropdownMenuLabel className="px-3 py-3">
              <p className="truncate text-sm font-black text-white">{displayName}</p>
              <p className="mt-1 truncate text-xs font-bold text-[#8b94a1]">{email}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-[#39424f]" />
            <DropdownMenuItem
              asChild
              className="cursor-pointer rounded-[3px] px-2 py-2 text-xs font-bold focus:bg-[#303842] focus:text-white"
            >
              <Link href="/user-profile">
                <User className="size-4" />
                My Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              asChild
              className="cursor-pointer rounded-[3px] px-2 py-2 text-xs font-bold focus:bg-[#303842] focus:text-white"
            >
              <Link href={`/studio/projects/${projectId}`}>
                <Settings className="size-4" />
                Workspace Home
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer rounded-[3px] px-2 py-2 text-xs font-bold focus:bg-[#303842] focus:text-white">
              <Settings className="size-4" />
              Account Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-[#39424f]" />
            <DropdownMenuItem
              className="cursor-pointer rounded-[3px] px-2 py-2 text-xs font-bold text-red-300 focus:bg-red-950/30 focus:text-red-200"
              onClick={logout}
            >
              <LogOut className="size-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
