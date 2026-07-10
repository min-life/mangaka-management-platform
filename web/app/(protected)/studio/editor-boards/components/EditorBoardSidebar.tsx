'use client';

import { FileCheck2, FolderKanban, LayoutDashboard, Users } from 'lucide-react';
import { StudioSidebar, type StudioSidebarItem } from '../../components/StudioSidebar';

type EditorBoardSidebarProps = {
  editorBoardId: string;
};

// PhucTD #editor-board start
export function EditorBoardSidebar({ editorBoardId }: EditorBoardSidebarProps) {
  const baseHref = `/studio/editor-boards/${editorBoardId}`;

  const navItems: StudioSidebarItem[] = [
    { exact: true, href: baseHref, icon: LayoutDashboard, label: 'Dashboard' },
    { href: `${baseHref}/members`, icon: Users, label: 'Members' },
    { href: `${baseHref}/projects`, icon: FolderKanban, label: 'Projects' },
    { href: `${baseHref}/applications`, icon: FileCheck2, label: 'Applications' },
  ];

  return (
    <StudioSidebar
      items={navItems}
      subtitle="Editorial Board"
    />
  );
}
// PhucTD #editor-board end
