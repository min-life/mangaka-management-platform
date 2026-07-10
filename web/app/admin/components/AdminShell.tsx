'use client';

import type { ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';

import {
  BarChart3,
  LogOut,
  Menu,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  ShieldCheck,
  Sun,
  Users,
} from 'lucide-react';

import { NotificationBell } from '@/components/notifications/NotificationBell';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { useAdminTheme } from '../hooks/use-admin-theme';

import { ADMIN_NAV_ITEMS } from '../data/admin-data';

const ADMIN_NAV_ICONS = {
  Dashboard: BarChart3,
  Users,
  Roles: ShieldCheck,
} as const;

function getInitials(value: string) {
  return (
    value
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('') || 'A'
  );
}

type AdminShellProps = {
  children: ReactNode;
};

// Codex #admin-ui start
export function AdminShell({ children }: AdminShellProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const { theme, toggleTheme } = useAdminTheme();
  const { user } = useAuth();
  const displayName = user?.displayName || user?.email || 'Admin';
  const email = user?.email ?? 'Admin Console';
  const initials = getInitials(displayName);

  return (
    <div className="min-h-screen bg-[var(--admin-bg-primary)] text-[var(--admin-text-primary)] transition-colors duration-200">
      <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b border-[var(--admin-border)] bg-[#222831]/95 px-4 backdrop-blur md:px-8">
        <div className="flex items-center gap-3">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                aria-label="Open admin navigation"
                className="border-[var(--admin-border)] bg-[var(--admin-bg-secondary)] text-[var(--admin-text-primary)] hover:border-[var(--admin-accent)] hover:bg-[var(--admin-bg-secondary-hover)] lg:hidden"
              >
                <Menu className="size-4" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="left"
              className="w-72 border-[var(--admin-border)] bg-[var(--admin-bg-primary)] p-0 text-[var(--admin-text-primary)]"
            >
              <SheetHeader className="sr-only">
                <SheetTitle>Admin Navigation</SheetTitle>
                <SheetDescription>Navigation for the Inkly admin area.</SheetDescription>
              </SheetHeader>
              <SidebarContent isCollapsed={false} />
            </SheetContent>
          </Sheet>
          <div className="flex items-center gap-4">
            <Image
              alt="Inkly"
              className="h-[46px] w-auto object-contain"
              height={46}
              src="/brand/1.png"
              width={128}
            />
            <div className="hidden h-7 w-px bg-[#434A55] sm:block" />
            <div className="hidden leading-tight sm:block">
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#8B93A5]">
                Admin
              </p>
              <h1 className="text-[15px] font-semibold text-white">Admin Console</h1>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <NotificationBell
            dotClassName="-right-0.5 -top-1 size-2 border-0"
            triggerClassName="rounded-lg p-2 text-[#B8BEC8] hover:bg-[#2F3742] hover:text-white"
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="rounded-lg text-[#B8BEC8] hover:bg-[#2F3742] hover:text-white"
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? <Sun className="size-5" /> : <Moon className="size-5" />}
          </Button>

          <div className="mx-2 hidden h-8 w-px bg-[#434A55] sm:block" />

          <Link
            className="flex items-center gap-3 rounded-xl px-2 py-1.5 transition hover:bg-[#2F3742]"
            href="/user-profile"
            title="Open admin profile"
          >
            <Avatar className="size-9 border border-[#FFD369]" size="lg">
              {user?.avatarUrl ? <AvatarImage alt={displayName} src={user.avatarUrl} /> : null}
              <AvatarFallback className="bg-[#101820] text-xs font-black text-white">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="hidden max-w-44 text-left md:block">
              <p className="truncate text-sm font-semibold leading-none text-white">
                {displayName}
              </p>
              <p className="mt-1 truncate text-[11px] font-medium text-[#8B93A5]">{email}</p>
            </div>
          </Link>
        </div>
      </header>

      <aside
        className={cn(
          'fixed bottom-0 left-0 top-16 z-40 hidden flex-col border-r border-[var(--admin-border)] bg-[var(--admin-bg-primary)] text-[var(--admin-text-primary)] transition-all duration-200 lg:flex',
          isSidebarCollapsed ? 'w-20' : 'w-64',
        )}
      >
        <SidebarContent
          isCollapsed={isSidebarCollapsed}
          onToggleCollapsed={() => setIsSidebarCollapsed((currentValue) => !currentValue)}
        />
      </aside>

      <div
        className={cn(
          'transition-[padding] duration-200',
          isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64',
        )}
      >
        <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 md:px-8 md:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
// Codex #admin-ui end

type SidebarContentProps = {
  isCollapsed: boolean;
  onToggleCollapsed?: () => void;
};

// Codex #admin-ui start
function SidebarContent({ isCollapsed, onToggleCollapsed }: SidebarContentProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  return (
    <div className={cn('flex h-full flex-col p-4', isCollapsed && 'items-center px-3')}>
      <div className={cn('w-full pb-2', isCollapsed ? 'px-0' : 'px-2')}>
        {onToggleCollapsed ? (
          <Button
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className={cn(
              'mt-4 h-9 border-[var(--admin-border)] bg-[var(--admin-bg-secondary)] text-[#aeb7c2] hover:border-[var(--admin-accent)] hover:bg-[var(--admin-bg-secondary-hover)] hover:text-[var(--admin-text-primary)]',
              isCollapsed ? 'w-full px-0' : 'w-full justify-start',
            )}
            onClick={onToggleCollapsed}
            size={isCollapsed ? 'icon' : 'default'}
            type="button"
            variant="outline"
          >
            {isCollapsed ? (
              <PanelLeftOpen className="size-4" />
            ) : (
              <PanelLeftClose className="size-4" />
            )}
            <span className={cn(isCollapsed && 'sr-only')}>
              {isCollapsed ? 'Expand' : 'Collapse'}
            </span>
          </Button>
        ) : null}
      </div>

      <nav className={cn('mt-3 flex flex-1 flex-col gap-1', isCollapsed && 'w-full items-center')}>
        {ADMIN_NAV_ITEMS.map((item) => {
          const Icon = ADMIN_NAV_ICONS[item.label as keyof typeof ADMIN_NAV_ICONS];
          const isActive =
            item.href === '/admin' ? pathname === item.href : pathname.startsWith(item.href);

          return (
            <Button
              key={item.href}
              asChild
              variant="ghost"
              className={cn(
                'h-10 justify-start gap-3 rounded-lg px-3 text-[#aeb7c2] hover:bg-[var(--admin-bg-secondary)] hover:text-[var(--admin-text-primary)]',
                isActive &&
                  'bg-[var(--admin-accent)] text-[#222831] hover:bg-[var(--admin-accent)] hover:text-[#222831]',
                isCollapsed && 'w-10 justify-center px-0',
              )}
            >
              <Link href={item.href} title={item.label}>
                {Icon && <Icon className="size-4" />}
                <span className={cn(isCollapsed && 'sr-only')}>{item.label}</span>
              </Link>
            </Button>
          );
        })}
      </nav>

      <Button
        className={cn(
          'mb-3 h-10 justify-start gap-3 rounded-lg px-3 text-[#aeb7c2] hover:bg-[var(--admin-bg-secondary)] hover:text-[var(--admin-text-primary)]',
          isCollapsed && 'w-10 justify-center px-0',
        )}
        onClick={() => void handleLogout()}
        title="Logout"
        type="button"
        variant="ghost"
      >
        <LogOut className="size-4" />
        <span className={cn(isCollapsed && 'sr-only')}>Logout</span>
      </Button>
    </div>
  );
}
// Codex #admin-ui end
