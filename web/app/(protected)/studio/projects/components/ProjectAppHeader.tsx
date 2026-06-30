'use client';

import Link from 'next/link';
import {
  ArrowLeft,
  Bell,
  ChevronDown,
  FolderKanban,
  HelpCircle,
  LogOut,
  Search,
  Settings,
  User,
} from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/useAuth';

type ProjectAppHeaderProps = {
  projectId: string;
  projectName: string;
};

export function ProjectAppHeader({ projectId, projectName }: ProjectAppHeaderProps) {
  const { logout, user } = useAuth();
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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="hidden h-9 items-center gap-2 rounded-[4px] border border-transparent px-3 text-xs font-black uppercase tracking-[0.08em] text-[#aeb7c2] hover:border-[#39424f] hover:bg-[#222a34] lg:flex"
              type="button"
            >
              <FolderKanban className="size-4 text-[#FFD369]" />
              <span>Workspace</span>
              <span className="text-[#5b626d]">/</span>
              <span className="text-[#FFD369]">{projectName}</span>
              <ChevronDown className="size-3.5 text-[#dce7f3]" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            className="min-w-56 rounded-[4px] border border-[#39424f] bg-[#101820] p-1 text-white"
          >
            {['Neon Tokyo Drifters', 'Cyberpunk Ronin', 'Autumn Whisper'].map((name) => (
              <DropdownMenuItem
                className="cursor-pointer rounded-[3px] px-2 py-2 text-xs font-bold focus:bg-[#303842] focus:text-white"
                key={name}
              >
                <FolderKanban className="size-3.5 text-[#8b94a1]" />
                {name}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator className="bg-[#39424f]" />
            <DropdownMenuItem
              asChild
              className="cursor-pointer rounded-[3px] px-2 py-2.5 text-[#FFD369] focus:bg-[#303842] focus:text-[#FFD369]"
            >
              <Link href="/studio">
                <ArrowLeft className="size-3.5" />
                <span className="min-w-0">
                  <span className="block text-xs font-black">View all workspace projects</span>
                  <span className="mt-0.5 block text-[10px] font-bold text-[#8b94a1]">
                    Return to the workspace overview
                  </span>
                </span>
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex items-center gap-4">
        <button className="relative text-white" type="button">
          <Bell className="size-5" />
          <span className="absolute -right-0.5 -top-1 size-2 rounded-full bg-[#FFD369]" />
        </button>
        <button
          aria-label="Help"
          className="grid size-8 place-items-center rounded-[4px] text-white hover:bg-[#222a34]"
          type="button"
        >
          <HelpCircle className="size-5" />
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="flex items-center gap-2 rounded-full border border-transparent px-1 py-1 hover:border-[#39424f] hover:bg-[#222a34]"
              type="button"
            >
              {user?.avatarUrl ? (
                <img
                  alt={displayName}
                  className="size-8 rounded-full border border-[#FFD369] object-cover"
                  src={user.avatarUrl}
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
              <Link href={`/studio/projects/${projectId}/settings`}>
                <Settings className="size-4" />
                Workspace Settings
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
