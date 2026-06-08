import {
  Bell,
  ChevronLeft,
  ChevronRight,
  Filter,
  Info,
  LayoutDashboard,
  Plus,
  Search,
} from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { PaginationButton } from './components/pagination-button';
import { RoleRow } from './components/role-row';
import { SidebarUtility } from './components/sidebar-utility';
import {
  navItems,
  roles,
  sidebarUtilityItems,
  stats,
  studioAvatar,
  tableHeadings,
  toolbarItems,
  topNavItems,
} from './const';

export default function RoleManagementPage() {
  return (
    <div className="dark min-h-screen bg-[#0f0f0f] text-[#ecdfe2]">
      <aside className="fixed left-0 top-0 z-50 flex h-full w-[260px] flex-col border-r border-[#444748] bg-[#241e20] px-4 py-6">
        <div className="mb-10 px-2">
          <h1 className="text-[24px] font-bold leading-8 text-[#e2e2e2]">MangaStudio Ink</h1>
          <p className="mt-1 text-[12px] uppercase leading-4 tracking-[0.18em] text-[#c4c7c7]">
            Editorial Control
          </p>
        </div>

        <nav className="flex-grow space-y-1">
          {navItems.map((item) => (
            <a
              href="#"
              key={item.label}
              className={cn(
                'flex h-[40px] items-center gap-3 rounded px-3 py-2.5 text-[14px] leading-5 transition-colors',
                item.active
                  ? 'border-r-2 border-[#e2e2e2] bg-[#2f282a] font-bold text-[#e2e2e2]'
                  : 'text-[#c4c7c7] hover:bg-[#2f282a]',
              )}
            >
              <item.icon className="size-5" />
              <span>{item.label}</span>
            </a>
          ))}
        </nav>

        <div className="mt-auto space-y-1 border-t border-[#444748] pt-6">
          {sidebarUtilityItems.map((item) => (
            <SidebarUtility icon={item.icon} label={item.label} key={item.label} />
          ))}
          <div className="mt-6 flex items-center gap-3 px-2">
            <Avatar className="size-8 border border-[#8e9192]">
              <AvatarImage alt="Studio Lead Avatar" src={studioAvatar} />
              <AvatarFallback>SL</AvatarFallback>
            </Avatar>
            <div className="min-w-0 overflow-hidden">
              <p className="truncate text-[12px] font-bold leading-4">Studio Lead</p>
              <p className="truncate text-[10px] text-[#c4c7c7]">admin@mangastudio.ink</p>
            </div>
          </div>
        </div>
      </aside>

      <header className="fixed right-0 top-0 z-40 flex h-12 w-[calc(100%-260px)] items-center justify-between border-b border-[#444748] bg-[#171214] px-4">
        <div className="flex items-center gap-6">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 size-[18px] -translate-y-1/2 text-[#c4c7c7]" />
            <Input
              className="h-[34px] rounded border-[#444748] bg-[#201a1c] pl-10 pr-4 text-[12px] text-[#ecdfe2] placeholder:text-[#c4c7c7] focus-visible:border-[#e2e2e2] focus-visible:ring-[#e2e2e2]/30"
              placeholder="Global search..."
              type="text"
            />
          </div>
          <nav className="hidden gap-6 md:flex">
            {topNavItems.map((item) => (
              <a
                className="text-[14px] leading-5 text-[#c4c7c7] transition-colors hover:text-[#e2e2e2]"
                href="#"
                key={item}
              >
                {item}
              </a>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <Button className="h-[28px] rounded bg-[#e2e2e2] px-4 py-1 text-[12px] font-bold text-[#2f3131] hover:bg-[#e2e2e2]/90">
            Publish
          </Button>
          <div className="ml-2 flex items-center gap-2 border-l border-[#444748] pl-4">
            <Button
              className="relative size-8 text-[#c4c7c7] hover:text-[#e2e2e2]"
              size="icon"
              variant="ghost"
            >
              <Bell className="size-6" />
              <span className="absolute right-1 top-1 size-2 rounded-full border border-[#171214] bg-[#ffb4ab]" />
            </Button>
            <Button
              className="size-8 text-[#c4c7c7] hover:text-[#e2e2e2]"
              size="icon"
              variant="ghost"
              aria-label="Dashboard shortcut"
            >
              <LayoutDashboard className="size-5" />
            </Button>
            <Button className="size-8" size="icon" variant="ghost">
              <Avatar className="size-6 border border-[#444748]">
                <AvatarImage alt="User Avatar" src={studioAvatar} />
                <AvatarFallback>SL</AvatarFallback>
              </Avatar>
            </Button>
          </div>
        </div>
      </header>

      <main className="ml-[260px] min-h-screen p-6 pt-[72px]">
        <div className="mx-auto max-w-7xl">
          <section className="mb-8 flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <h2 className="text-[32px] font-semibold leading-10 tracking-normal text-[#e2e2e2]">
                Role Management
              </h2>
              <p className="mt-1 text-[14px] leading-5 text-[#c4c7c7]">
                Configure system access and editorial permissions hierarchy.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                className="h-[38px] rounded border-[#444748] bg-[#241e20] pl-10 pr-4 text-[14px] font-medium text-[#ecdfe2] hover:bg-[#2f282a]"
                variant="outline"
              >
                <Filter className="absolute left-3 size-[18px] text-[#c4c7c7]" />
                Filter
              </Button>
              <Button className="h-[38px] rounded bg-[#e2e2e2] px-5 text-[14px] font-bold text-[#2f3131] hover:bg-[#e2e2e2]/90">
                <Plus className="size-5" />
                Create Role
              </Button>
            </div>
          </section>

          <section className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-4">
            {stats.map((stat) => (
              <Card
                className="gap-1 rounded-lg border border-[#444748] bg-[#241e20] p-5 py-5 text-[#ecdfe2] ring-0"
                key={stat.label}
              >
                <span className="font-mono text-[12px] uppercase leading-4 tracking-[0.18em] text-[#c4c7c7]">
                  {stat.label}
                </span>
                <span className="text-[24px] font-semibold leading-8 text-[#ecdfe2]">
                  {stat.value}
                </span>
              </Card>
            ))}
          </section>

          <section className="overflow-hidden rounded-lg border border-[#444748] bg-[#241e20]">
            <Table>
              <TableHeader>
                <TableRow className="h-[54px] border-[#444748] bg-[#2f282a]/50 hover:bg-[#2f282a]/50">
                  {tableHeadings.map((heading) => (
                    <TableHead
                      className={cn(
                        'px-6 py-4 text-[12px] font-bold uppercase leading-4 tracking-wider text-[#c4c7c7]',
                        heading === 'Scope' && 'text-center',
                        heading === 'Actions' && 'text-right',
                      )}
                      key={heading}
                    >
                      {heading}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {roles.map((role) => (
                  <RoleRow key={role.code} role={role} />
                ))}
              </TableBody>
            </Table>

            <div className="flex h-[65px] items-center justify-between border-t border-[#444748] bg-[#241e20] px-6 py-4">
              <span className="text-[12px] leading-4 text-[#c4c7c7]">
                Showing 1 to 5 of 12 roles
              </span>
              <div className="flex items-center gap-2">
                <PaginationButton disabled>
                  <ChevronLeft className="size-[18px]" />
                </PaginationButton>
                <PaginationButton active>1</PaginationButton>
                <PaginationButton>2</PaginationButton>
                <PaginationButton>3</PaginationButton>
                <PaginationButton>
                  <ChevronRight className="size-[18px]" />
                </PaginationButton>
              </div>
            </div>
          </section>

          <section className="mt-12 flex items-start gap-6 rounded-lg border border-[#333333] bg-[rgba(27,27,27,0.8)] p-6 backdrop-blur-xl">
            <div className="rounded-full bg-[#e2e2e2]/10 p-3">
              <Info className="size-8 text-[#e2e2e2]" />
            </div>
            <div>
              <h4 className="mb-2 text-[20px] font-semibold leading-7 text-[#e2e2e2]">
                Hierarchy Note
              </h4>
              <p className="max-w-2xl text-[14px] leading-5 text-[#c4c7c7]">
                Permissions are inherited based on the role scope.{' '}
                <strong className="text-[#ecdfe2]">SYS (System)</strong> roles have global oversight
                across all company branches, while{' '}
                <strong className="text-[#ecdfe2]">PRJ (Project)</strong> roles are scoped to
                specific manuscript assignments. Changes to these roles will propagate immediately.
              </p>
            </div>
          </section>
        </div>
      </main>

      <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2">
        <div className="flex items-center gap-8 rounded-full border border-[#333333] bg-[rgba(27,27,27,0.8)] px-6 py-3 shadow-2xl backdrop-blur-xl">
          {toolbarItems.map((item, index) => (
            <div className="flex items-center gap-8" key={item.label}>
              {index > 0 ? <div className="h-6 w-px bg-[#444748]" /> : null}
              <button className="group flex flex-col items-center gap-0.5 text-[#c4c7c7] transition-colors hover:text-[#e2e2e2]">
                <item.icon className="size-5 transition-transform group-hover:scale-110" />
                <span className="text-[10px] font-bold uppercase leading-none tracking-normal">
                  {item.label}
                </span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
