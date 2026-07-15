'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ArrowLeft, ChevronDown, FolderKanban, Library, LogOut, Search, Settings, User } from 'lucide-react';

import { useAuth } from '@/hooks/useAuth';
import { getEditorBoards, type EditorBoardResponse } from '@/services/editor-board.service';
import { NotificationBell } from '@/components/notifications/NotificationBell';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type EditorBoardHeaderProps = {
  editorBoardId: string;
  boardName: string;
};

// PhucTD #editor-board start
export function EditorBoardHeader({ editorBoardId, boardName }: EditorBoardHeaderProps) {
  const router = useRouter();
  const { logout, user } = useAuth();
  const [boards, setBoards] = useState<EditorBoardResponse[]>([]);

  useEffect(() => {
    void getEditorBoards()
      .then((res) => {
        setBoards((res as any).boards || (res as any).data || (res as any) || []);
      })
      .catch(() => {});
  }, []);

  const displayName = user?.displayName || user?.email || 'Current user';
  const email = user?.email ?? 'No email';
  const roleLabel = user?.role ?? 'Workspace Member';
  
  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('') || 'U';

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-[#393E46] bg-[#222831] px-6">
      {/* LEFT */}
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
                <span>{boardName}</span>
                <ChevronDown className="size-3.5 text-[#dce7f3] ml-0.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              className="min-w-56 rounded-[4px] border border-[#39424f] bg-[#101820] p-1 text-white animate-in fade-in-50 duration-100"
            >
              {boards.map((b) => (
                <DropdownMenuItem
                  className="cursor-pointer rounded-[3px] px-2 py-2 text-xs font-bold focus:bg-[#303842] focus:text-white"
                  key={b.id}
                  onSelect={() => router.push(`/studio/editor-boards/${b.id}`)}
                >
                  <Library className="size-3.5 text-[#8b94a1] mr-1.5" />
                  {b.name}
                </DropdownMenuItem>
              ))}
              {boards.length === 0 && (
                <p className="px-2 py-1.5 text-[11px] font-bold text-[#8b94a1]">
                  No other editor boards
                </p>
              )}
              <DropdownMenuSeparator className="bg-[#39424f]" />
              <DropdownMenuItem
                asChild
                className="cursor-pointer rounded-[3px] px-2 py-2.5 text-[#FFD369] focus:bg-[#303842] focus:text-[#FFD369]"
              >
                <Link href="/studio?tab=editorBoards">
                  <ArrowLeft className="size-3.5" />
                  <span className="min-w-0">
                    <span className="block text-xs font-black">View all boards</span>
                    <span className="mt-0.5 block text-[10px] font-bold text-[#8b94a1]">
                      Return to the studio overview
                    </span>
                  </span>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* RIGHT */}
      <div className="flex items-center gap-2">
        <NotificationBell />

        <div className="mx-2 h-8 w-px bg-[#434A55]" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="flex items-center gap-4 rounded-xl px-2 py-1.5 transition hover:bg-[#2F3742]"
              type="button"
            >
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={displayName}
                  className="size-9 rounded-full border border-[#FFD369] object-cover"
                />
              ) : (
                <span className="grid size-9 place-items-center rounded-full border border-[#FFD369] bg-[#101820] text-xs font-black text-white">
                  {initials}
                </span>
              )}

              <div className="hidden text-left md:block">
                <p className="text-sm font-semibold leading-none text-white">
                  {displayName}
                </p>
                <p className="mt-1 text-[11px] font-medium text-[#8B93A5]">
                  {roleLabel}
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
                {user?.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={displayName}
                    className="size-10 rounded-full object-cover"
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
                    {roleLabel}
                  </p>
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
              onClick={logout}
              className="cursor-pointer text-red-400 focus:bg-[#2F3742] focus:text-red-400"
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
// PhucTD #editor-board end
