'use client';

import Link from 'next/link';
import { ChevronDown, LogOut, User } from 'lucide-react';

import { useAuth } from '@/hooks/useAuth';
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

type WorkspaceHeaderProps = {
  eyebrow?: string;
  title?: string;
};

export function WorkspaceHeader({
  eyebrow = 'Workspace',
  title = 'Production Workspace',
}: WorkspaceHeaderProps = {}) {
  const { logout, user } = useAuth();
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
    <header className="flex h-16 items-center justify-between border-b border-[#393E46] bg-[#222831] px-6">
      {/* LEFT */}
      <div className="flex items-center gap-4">
        <Link href="/studio" className="shrink-0 transition hover:opacity-80">
          <img
            src="/brand/1.png"
            alt="Inkly"
            className="h-[50px] w-auto object-contain"
          />
        </Link>

        <div className="h-7 w-px bg-[#434A55]" />

        <div className="leading-tight">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#8B93A5]">
            {eyebrow}
          </p>

          <h1 className="text-[15px] font-semibold text-white">
            {title}
          </h1>
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
                  className="h-9 w-9 rounded-full border border-[#FFD369] object-cover"
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
                    src={user.avatarUrl}
                    alt={displayName}
                    className="object-cover w-10 h-10 rounded-full"
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
