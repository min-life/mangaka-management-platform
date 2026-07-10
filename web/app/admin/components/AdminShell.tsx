'use client';

import type { ReactNode } from 'react';
import { BarChart3, ShieldCheck, Users } from 'lucide-react';

import {
  StudioSidebar,
  type StudioSidebarItem,
} from '@/app/(protected)/studio/components/StudioSidebar';
import { ProjectAppHeader } from '@/app/(protected)/studio/projects/components/ProjectAppHeader';

const ADMIN_NAV_ITEMS: StudioSidebarItem[] = [
  {
    exact: true,
    href: '/admin',
    icon: BarChart3,
    label: 'Dashboard',
  },
  {
    href: '/admin/users',
    icon: Users,
    label: 'Users',
  },
  {
    href: '/admin/roles',
    icon: ShieldCheck,
    label: 'Roles',
  },
];

type AdminShellProps = {
  children: ReactNode;
};

// Codex #admin-ui start
export function AdminShell({ children }: AdminShellProps) {
  return (
    <div className="flex min-h-screen bg-[#222831] text-[#eeeeee]">
      <StudioSidebar items={ADMIN_NAV_ITEMS} subtitle="Admin Console" />
      <div className="flex min-w-0 flex-1 flex-col">
        <ProjectAppHeader projectId="" projectName="Admin Console" />
        <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 md:px-8 md:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
// Codex #admin-ui end
