'use client';

import {
  BarChart3,
  ClipboardList,
  FileCheck2,
  FolderOpen,
  LayoutDashboard,
  Megaphone,
  Settings,
  Users,
} from 'lucide-react';

import { StudioSidebar, type StudioSidebarItem } from '../../components/StudioSidebar';

type ProjectSidebarProps = {
  projectId: string;
};

export function ProjectSidebar({ projectId }: ProjectSidebarProps) {
  const baseHref = `/studio/projects/${projectId}`;
  const navItems: StudioSidebarItem[] = [
    { exact: true, href: baseHref, icon: LayoutDashboard, label: 'Dashboard' },
    { href: `${baseHref}/members`, icon: Users, label: 'Members' },
    { href: `${baseHref}/applications`, icon: FileCheck2, label: 'Applications' },
    { href: `${baseHref}/files`, icon: FolderOpen, label: 'Files' },
    { href: `${baseHref}/tasks`, icon: ClipboardList, label: 'Tasks' },
    { href: `${baseHref}/publishing`, icon: Megaphone, label: 'Publishing' },
    { href: `${baseHref}/reports`, icon: BarChart3, label: 'Reports' },
  ];
  const footerItems: StudioSidebarItem[] = [
    { href: `${baseHref}/settings`, icon: Settings, label: 'Settings' },
  ];

  return (
    <StudioSidebar
      footerItems={footerItems}
      items={navItems}
      subtitle="Production Workspace"
    />
  );
}
