'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { LucideIcon } from 'lucide-react';

export type StudioSidebarItem = {
  exact?: boolean;
  href: string;
  icon: LucideIcon;
  label: string;
};

type StudioSidebarProps = {
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

function SidebarLink({ item }: { item: StudioSidebarItem }) {
  const pathname = usePathname();
  const isActive = isItemActive(pathname, item);
  const Icon = item.icon;

  return (
    <Link
      className={`relative flex h-10 items-center gap-3 rounded-[4px] border-l-4 px-3 text-sm font-bold transition-colors ${
        isActive
          ? 'border-l-[#FFD369] bg-[#303842] text-white'
          : 'border-l-transparent text-[#dce7f3] hover:bg-[#17202b] hover:text-white'
      }`}
      href={item.href}
    >
      <Icon className={isActive ? 'size-4 text-[#FFD369]' : 'size-4 text-[#aeb7c2]'} />
      {item.label}
    </Link>
  );
}

export function StudioSidebar({
  footerItems = [],
  items,
  logoAlt = 'Inkly',
  logoSrc = '/brand/1.png',
  subtitle = 'Production Workspace',
}: StudioSidebarProps) {
  return (
    <aside className="sticky top-0 flex h-screen w-[248px] shrink-0 flex-col overflow-y-auto border-r border-[#26303b] bg-[#0b121a] px-4 py-5 text-[#eeeeee]">
      <div className="px-1">
        <div className="flex h-14 items-center">
          <img
            alt={logoAlt}
            className="max-h-14 w-auto max-w-[172px] object-contain"
            src={logoSrc}
          />
        </div>
        <p className="mt-2 text-[11px] font-bold text-[#8b94a1]">{subtitle}</p>
      </div>

      <nav className="mt-6 grid gap-1">
        {items.map((item) => (
          <SidebarLink item={item} key={item.href} />
        ))}
      </nav>

      {footerItems.length ? (
        <div className="mt-auto border-t border-[#26303b] pt-4">
          <nav className="grid gap-1">
            {footerItems.map((item) => (
              <SidebarLink item={item} key={item.href} />
            ))}
          </nav>
        </div>
      ) : null}
    </aside>
  );
}
