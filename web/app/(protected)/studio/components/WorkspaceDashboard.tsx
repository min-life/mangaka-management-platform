'use client';

import {
  Bell,
  ChevronDown,
  Grid2X2,
  List,
  LogOut,
  MoreVertical,
  Plus,
  Search,
  Settings,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useAuth } from '@/hooks/useAuth';

import { projectRows } from '../const/workspace-dashboard-data';

const statusClassName: Record<string, string> = {
  INKING: 'border-[#4a4f55] bg-[#20282b] text-[#f2f6f4]',
  'SCRIPT PHASE': 'border-[#6c5516] bg-[#30270d] text-[#ffd35b]',
  STORYBOARD: 'border-[#4f6e73] bg-[#2a454a] text-[#e9fbff]',
};

export function WorkspaceDashboard() {
  const { logout } = useAuth();

  return (
    <main className="min-h-screen overflow-hidden bg-[#222831] text-[#eeeeee]">
      <header className="flex h-[52px] items-center justify-between border-b border-[#393E46] px-5">
        <div className="flex items-center gap-9">
          <div className="flex items-center gap-3">
            <img alt="Inkly" className="size-20 object-contain" src="/brand/logo.png" />
          </div>
          <span className="h-6 w-px bg-[#5b626d]" />
          <div className="flex items-center gap-3 text-sm">
            <span className="font-black text-[#FFD369]">Workspace</span>
            <span className="text-[#EEEEEE]">&gt;</span>
            <span className="font-medium text-white">Projects</span>
          </div>
        </div>

        <div className="flex h-8 w-[470px] items-center gap-3 rounded-[3px] border border-[#555d69] bg-[#393E46] px-4 text-[#aeb7c2]">
          <Search className="size-4 text-white" />
          <span className="text-xs">Search projects...</span>
        </div>

        <div className="flex items-center gap-5">
          <button className="relative text-white" type="button">
            <Bell className="size-5" />
            <span className="absolute -right-0.5 -top-1 size-2 rounded-full bg-[#FFD369]" />
          </button>
          <Settings className="size-5 text-white" />
          <span className="h-8 w-px bg-[#5b626d]" />
          <img
            alt=""
            className="size-8 rounded-full border border-[#FFD369] object-cover"
            src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=80&auto=format&fit=crop"
          />
          <Button
            className="h-8 rounded-[4px] border-[#4b535f] bg-[#393E46] px-3 text-xs font-bold text-white hover:border-[#FFD369] hover:bg-[#303640]"
            onClick={logout}
            type="button"
            variant="outline"
          >
            <LogOut className="size-4" />
            Logout
          </Button>
        </div>
      </header>

      <section className="px-[13px] pt-8">
        <div className="flex h-[34px] items-center gap-8 border-b border-[#393E46]">
          <button className="relative h-full px-2 text-sm font-bold text-[#FFD369]" type="button">
            Projects
            <span className="absolute inset-x-0 bottom-[-1px] h-0.5 bg-[#FFD369]" />
          </button>
          <button className="h-full px-2 text-sm font-medium text-white" type="button">
            Editor Boards
          </button>
        </div>

        <div className="mt-[26px] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-[262px] items-center gap-3 rounded-[4px] border border-[#4b535f] bg-[#393E46] px-4 text-[#aeb7c2]">
              <Search className="size-4 text-white" />
              <span className="text-xs">Search projects...</span>
            </div>
            <Button
              className="h-9 rounded-[4px] border-[#4b535f] bg-[#101820] px-4 text-xs font-black text-white hover:bg-[#393E46]"
              variant="outline"
            >
              Status: All
              <ChevronDown className="size-3.5" />
            </Button>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex h-9 overflow-hidden rounded-[4px] border border-[#4b535f] bg-[#393E46] p-1">
              <button className="grid size-7 place-items-center text-white" type="button">
                <Grid2X2 className="size-4" />
              </button>
              <button className="grid size-7 place-items-center rounded-[3px] bg-[#3a3021] text-[#FFD369]" type="button">
                <List className="size-4" />
              </button>
            </div>
            <Button className="h-9 rounded-[4px] bg-white px-6 text-xs font-black text-[#111820] hover:bg-[#FFD369]">
              <Plus className="size-4" />
              New Project
            </Button>
          </div>
        </div>

        <section className="mt-6 overflow-hidden rounded-[7px] border border-[#393E46] bg-[#0c1219]">
          <Table>
            <TableHeader>
              <TableRow className="h-[40px] border-[#393E46] bg-[#1d242d] hover:bg-[#1d242d]">
                <TableHead className="px-5 text-[10px] font-black uppercase tracking-[0.08em] text-[#dce7f3]">
                  Project Name
                </TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-[0.08em] text-[#dce7f3]">
                  Role
                </TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-[0.08em] text-[#dce7f3]">
                  Status
                </TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-[0.08em] text-[#dce7f3]">
                  Progress
                </TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-[0.08em] text-[#dce7f3]">
                  Members
                </TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-[0.08em] text-[#dce7f3]">
                  Last Updated
                </TableHead>
                <TableHead className="pr-5 text-right text-[10px] font-black uppercase tracking-[0.08em] text-[#dce7f3]">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projectRows.map((project, index) => (
                <TableRow
                  className={`h-[72px] border-[#393E46] hover:bg-[#202832] ${
                    index === 2 ? 'bg-[#272e38]' : 'bg-[#0b1118]'
                  }`}
                  key={project.id}
                >
                  <TableCell className="px-5">
                    <div className="flex items-center gap-3">
                      <img
                        alt=""
                        className="size-10 rounded-[4px] border border-[#393E46] object-cover"
                        src={project.image}
                      />
                      <div>
                        <p className="text-sm font-black leading-5 text-white">
                          {project.name}
                        </p>
                        <p className="text-[10px] font-bold text-[#dce7f3]">{project.id}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm font-medium text-white">
                    {project.role}
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={`rounded-[3px] border px-2 py-0.5 text-[8px] font-black ${statusClassName[project.status]}`}
                      variant="outline"
                    >
                      {project.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="w-[165px]">
                    <div className="mb-1 text-[10px] font-bold text-white">
                      {project.progress}%
                    </div>
                    <Progress
                      className="h-1 w-[105px] rounded-none bg-[#393E46] [&_[data-slot=progress-indicator]]:bg-[#FFD369]"
                      value={project.progress}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex -space-x-1.5">
                      {project.members.map((color, memberIndex) => (
                        <span
                          className="grid size-5 place-items-center rounded-full border border-[#121820] text-[6px] font-bold text-white"
                          key={`${project.id}-${color}-${memberIndex}`}
                          style={{ backgroundColor: color }}
                        >
                          {memberIndex + 1}
                        </span>
                      ))}
                      {project.memberCount ? (
                        <span className="grid size-5 place-items-center rounded-full border border-[#121820] bg-[#46505c] text-[7px] font-bold text-white">
                          +{project.memberCount}
                        </span>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs font-bold text-white">
                    {project.updated}
                  </TableCell>
                  <TableCell className="pr-5 text-right">
                    <Button className="size-7 text-white hover:bg-[#393E46]" size="icon" variant="ghost">
                      <MoreVertical className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <footer className="flex h-[54px] items-center justify-between border-t border-[#393E46] bg-[#1d242d] px-5">
            <p className="text-xs font-bold text-white">Showing 1 to 4 of 24 projects</p>
            <div className="flex items-center gap-5 text-xs text-white">
              <button className="text-[#5c6470]" type="button">
                {'<'}
              </button>
              <button
                className="grid size-7 place-items-center rounded-[3px] bg-[#FFD369] font-black text-[#222831]"
                type="button"
              >
                1
              </button>
              <button type="button">2</button>
              <button type="button">3</button>
              <button type="button">{'>'}</button>
            </div>
          </footer>
        </section>

        <footer className="mt-[26px] flex h-12 items-center justify-between rounded-t-[7px] border-t border-[#393E46] bg-[#101820] px-7 text-xs text-white">
          <p>MangaFlow © 2026</p>
          <div className="flex items-center gap-6">
            <a href="#">Documentation</a>
            <span className="h-3 w-px bg-[#5b626d]" />
            <a href="#">Support</a>
          </div>
          <p className="text-[10px] text-white">
            <span className="mr-1 text-[#FFD369]">●</span>
            All systems operational <span className="ml-1 text-[#8b94a1]">v1.4.2</span>
          </p>
        </footer>
      </section>
    </main>
  );
}
