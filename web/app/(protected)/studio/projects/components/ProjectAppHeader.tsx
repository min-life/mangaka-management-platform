'use client';

import Link from 'next/link';
import { Bell, ChevronDown, FolderKanban, HelpCircle, Search, Settings } from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type ProjectAppHeaderProps = {
  projectName: string;
};

export function ProjectAppHeader({ projectName }: ProjectAppHeaderProps) {
  return (
    <header className="z-30 flex h-16 shrink-0 items-center justify-between border-b border-[#26303b] bg-[#171e27] px-5">
      <div className="flex items-center gap-5">
        <div className="flex h-9 w-[360px] items-center gap-3 rounded-[4px] border border-[#39424f] bg-[#222a34] px-3 text-[#8b94a1]">
          <Search className="size-4 text-[#dce7f3]" />
          <span className="text-xs font-medium">Search production data...</span>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="hidden h-9 items-center gap-2 rounded-[4px] border border-transparent px-3 text-xs font-black uppercase tracking-[0.08em] text-[#aeb7c2] hover:border-[#39424f] hover:bg-[#222a34] lg:flex"
              type="button"
            >
              <FolderKanban className="size-4 text-[#FFD369]" />
              <span>Workspace</span>
              <span className="text-[#5b626d]">/</span>
              <span className="text-[#FFD369]">{projectName}</span>
              <ChevronDown className="size-3.5 text-[#dce7f3]" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            className="min-w-56 rounded-[4px] border border-[#39424f] bg-[#101820] p-1 text-white"
          >
            {['Neon Tokyo Drifters', 'Cyberpunk Ronin', 'Autumn Whisper'].map((name) => (
              <DropdownMenuItem
                className="cursor-pointer rounded-[3px] px-2 py-2 text-xs font-bold focus:bg-[#303842] focus:text-white"
                key={name}
              >
                {name}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator className="bg-[#39424f]" />
            <DropdownMenuItem
              asChild
              className="cursor-pointer rounded-[3px] px-2 py-2 text-xs font-bold text-[#FFD369] focus:bg-[#303842] focus:text-[#FFD369]"
            >
              <Link href="/studio">Back to Workspace</Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex items-center gap-4">
        <button className="relative text-white" type="button">
          <Bell className="size-5" />
          <span className="absolute -right-0.5 -top-1 size-2 rounded-full bg-[#FFD369]" />
        </button>
        <HelpCircle className="size-5 text-white" />
        <Settings className="size-5 text-white" />
        <span className="grid size-8 place-items-center rounded-full border border-[#FFD369] bg-[#151c25] text-xs font-black text-white">
          IT
        </span>
      </div>
    </header>
  );
}
