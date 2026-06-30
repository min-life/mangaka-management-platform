'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

import {
  BarChart3,
  Menu,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  ShieldCheck,
  Sun,
  Users,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { useAdminTheme } from '../hooks/use-admin-theme';

import { ADMIN_NAV_ITEMS } from '../data/admin-data';

const ADMIN_NAV_ICONS = {
  Dashboard: BarChart3,
  Users,
  Roles: ShieldCheck,
  Settings,
} as const;

type AdminShellProps = {
  children: ReactNode;
};

// Codex #admin-ui start
export function AdminShell({ children }: AdminShellProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const { theme, toggleTheme } = useAdminTheme();

  return (
    <div className="min-h-screen bg-[var(--admin-bg-primary)] text-[var(--admin-text-primary)] transition-colors duration-200">
      <aside
        className={cn(
          'fixed inset-y-0 left-0 hidden flex-col bg-[var(--admin-bg-primary)] text-[var(--admin-text-primary)] transition-all duration-200 lg:flex z-40 border-r border-[var(--admin-border)]',
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
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[var(--admin-border)] bg-[var(--admin-bg-primary)]/95 px-4 backdrop-blur md:px-8">
          <div className="flex items-center gap-3">
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="Open admin navigation"
                  className="lg:hidden border-[var(--admin-border)] bg-[var(--admin-bg-secondary)] text-[var(--admin-text-primary)] hover:border-[var(--admin-accent)] hover:bg-[var(--admin-bg-secondary-hover)]"
                >
                  <Menu className="size-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 border-[var(--admin-border)] bg-[var(--admin-bg-primary)] p-0 text-[var(--admin-text-primary)]">
                <SheetHeader className="sr-only">
                  <SheetTitle>Admin Navigation</SheetTitle>
                  <SheetDescription>Navigation for the Inkly admin area.</SheetDescription>
                </SheetHeader>
                <SidebarContent isCollapsed={false} />
              </SheetContent>
            </Sheet>
            <div className="hidden lg:block">
              <h1 className="text-base font-semibold text-[var(--admin-text-primary)]">Admin Console</h1>
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="text-[var(--admin-text-primary)] hover:bg-[var(--admin-bg-secondary)]"
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? <Sun className="size-5" /> : <Moon className="size-5" />}
          </Button>
        </header>
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

  return (
    <div className={cn('flex h-full flex-col p-4', isCollapsed && 'items-center px-3')}>
      <div
        className={cn(
          'w-full border-b border-[var(--admin-border)] pb-5',
          isCollapsed ? 'px-0' : 'px-2',
        )}
      >
        <div className={cn('flex items-center gap-3', isCollapsed && 'justify-center')}>
          <img
            src="/brand/1.png"
            alt="Inkly"
            className="h-10 w-auto object-contain shrink-0"
          />
          <div className={cn(isCollapsed && 'hidden', 'min-w-0')}>
            <p className="text-sm font-semibold truncate">Inkly</p>
            <p className="text-xs text-[#aeb7c2] truncate">Admin Console</p>
          </div>
        </div>
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

      <nav className={cn('mt-5 flex flex-1 flex-col gap-1', isCollapsed && 'w-full items-center')}>
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
                isActive && 'bg-[var(--admin-accent)] text-[#222831] hover:bg-[var(--admin-accent)] hover:text-[#222831]',
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

      <div
        className={cn(
          'rounded-lg border border-[var(--admin-border)] bg-[var(--admin-bg-secondary)] p-3 text-xs text-[#aeb7c2]',
          isCollapsed && 'hidden',
        )}
      >
        <p className="font-medium text-[var(--admin-text-primary)]">Admin workspace</p>
        <p className="mt-1 leading-5">Team access, roles, and platform controls.</p>
      </div>
    </div>
  );
}
// Codex #admin-ui end
