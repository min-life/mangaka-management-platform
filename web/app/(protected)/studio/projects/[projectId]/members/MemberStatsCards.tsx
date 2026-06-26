'use client';

import { Users } from 'lucide-react';

export function MemberStatsCards() {
  return (
    <div className="mt-5 grid grid-cols-3 gap-4">
      <article className="rounded-[5px] border border-[#39424f] bg-[#1a222d] p-4">
        <div className="flex items-center gap-3">
          <Users className="size-5 text-[#FFD369]" />
          <p className="text-xs font-black uppercase tracking-[0.08em] text-[#aeb7c2]">
            Team Health *
          </p>
        </div>
        <p className="mt-3 text-2xl font-black text-white">92%</p>
      </article>
      <article className="rounded-[5px] border border-[#39424f] bg-[#1a222d] p-4">
        <p className="text-xs font-black uppercase tracking-[0.08em] text-[#aeb7c2]">
          Open Assignments *
        </p>
        <p className="mt-3 text-2xl font-black text-white">31</p>
      </article>
      <article className="rounded-[5px] border border-[#39424f] bg-[#1a222d] p-4">
        <p className="text-xs font-black uppercase tracking-[0.08em] text-[#aeb7c2]">
          Review Coverage *
        </p>
        <p className="mt-3 text-2xl font-black text-white">4 editors</p>
      </article>
    </div>
  );
}
