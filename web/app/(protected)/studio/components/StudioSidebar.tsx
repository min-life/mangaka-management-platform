'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { PanelLeftClose, PanelLeftOpen, type LucideIcon } from 'lucide-react';

export type StudioSidebarItem = {
  exact?: boolean;
  href: string;
  icon: LucideIcon;
  label: string;
};

type StudioSidebarProps = {
  collapsedLogoSrc?: string;
  footerItems?: StudioSidebarItem[];
  items: StudioSidebarItem[];
  logoAlt?: string;
  logoSrc?: string;
  subtitle?: string;
};

function isItemActive(pathname: string, item: StudioSidebarItem) {
  if (item.exact) {
    return pathname === item.href;
  }

  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

function SidebarLink({ isCollapsed, item }: { isCollapsed: boolean; item: StudioSidebarItem }) {
  const pathname = usePathname();
  const isActive = isItemActive(pathname, item);
  const Icon = item.icon;

  return (
    <Link
      className={`relative flex h-10 items-center rounded-[4px] border-l-4 text-sm font-bold transition-colors ${
        isActive
          ? 'border-l-[#FFD369] bg-[#303842] text-white'
          : 'border-l-transparent text-[#dce7f3] hover:bg-[#17202b] hover:text-white'
      } ${isCollapsed ? 'justify-center px-0' : 'gap-3 px-3'}`}
      href={item.href}
      title={isCollapsed ? item.label : undefined}
    >
      <Icon className={isActive ? 'size-4 text-[#FFD369]' : 'size-4 text-[#aeb7c2]'} />
      {isCollapsed ? null : item.label}
    </Link>
  );
}

export function StudioSidebar({
  collapsedLogoSrc = '/brand/3.png',
  footerItems = [],
  items,
  logoAlt = 'Inkly',
  logoSrc = '/brand/1.png',
  subtitle = 'Production Workspace',
}: StudioSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <aside
      className={`sticky top-0 flex h-screen shrink-0 flex-col overflow-y-auto border-r border-[#26303b] bg-[#0b121a] py-5 text-[#eeeeee] transition-[width] duration-200 ${
        isCollapsed ? 'w-[76px] px-3' : 'w-[248px] px-4'
      }`}
    >
      <div className={isCollapsed ? 'px-0' : 'px-1'}>
        <div className={`flex h-14 items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
          <img
            alt={logoAlt}
            className={`w-auto object-contain ${isCollapsed ? 'max-h-9 max-w-[44px]' : 'max-h-[68px] max-w-[170px]'}`}
            src={isCollapsed ? collapsedLogoSrc : logoSrc}
          />
          {isCollapsed ? null : (
            <button
              aria-label="Collapse sidebar"
              className="grid size-8 place-items-center rounded-[4px] text-[#aeb7c2] hover:bg-[#17202b] hover:text-white"
              onClick={() => setIsCollapsed(true)}
              type="button"
            >
              <PanelLeftClose className="size-4" />
            </button>
          )}
        </div>
        {isCollapsed ? (
          <button
            aria-label="Expand sidebar"
            className="mx-auto mt-3 grid size-8 place-items-center rounded-[4px] text-[#aeb7c2] hover:bg-[#17202b] hover:text-white"
            onClick={() => setIsCollapsed(false)}
            type="button"
          >
            <PanelLeftOpen className="size-4" />
          </button>
        ) : (
          <p className="mt-2 text-[11px] font-bold text-[#8b94a1]">{subtitle}</p>
        )}
      </div>

      <nav className="mt-6 grid gap-1">
        {items.map((item) => (
          <SidebarLink isCollapsed={isCollapsed} item={item} key={item.href} />
        ))}
      </nav>

      {footerItems.length ? (
        <div className="mt-auto border-t border-[#26303b] pt-4">
          <nav className="grid gap-1">
            {footerItems.map((item) => (
              <SidebarLink isCollapsed={isCollapsed} item={item} key={item.href} />
            ))}
          </nav>
        </div>
      ) : null}
    </aside>
  );
}
