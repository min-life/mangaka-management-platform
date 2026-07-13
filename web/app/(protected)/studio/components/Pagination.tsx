'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

type PaginationProps = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
};

export function Pagination({
  page,
  limit,
  total,
  totalPages,
  onPageChange,
  onLimitChange,
}: PaginationProps) {
  // If there are no items, render a clean fallback or hide
  if (total === 0) return null;

  // Make sure we have at least 1 page
  const safeTotalPages = Math.max(1, totalPages);
  const pages = Array.from({ length: safeTotalPages }, (_, i) => i + 1);

  return (
    <div className="flex h-[56px] items-center justify-between border-t border-[#26303b] bg-[#0d151e]/30 px-5 shrink-0 select-none">
      {/* Left: Page Numbers Navigation */}
      <div className="flex items-center gap-1.5">
        <button
          className="flex size-8 items-center justify-center rounded-[6px] border border-[#212936] bg-[#0d151e] text-[#8b94a1] transition-all hover:bg-[#151c25] hover:text-white disabled:pointer-events-none disabled:opacity-40"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          type="button"
          aria-label="Previous page"
        >
          <ChevronLeft className="size-4" />
        </button>

        {pages.map((p) => {
          const isActive = p === page;
          return (
            <button
              className={`flex size-8 items-center justify-center rounded-[6px] text-xs font-bold transition-all ${
                isActive
                  ? 'border border-[#3b82f6] bg-[#1d4ed8]/10 text-[#3b82f6]'
                  : 'text-[#8b94a1] hover:bg-[#151c25] hover:text-white'
              }`}
              key={p}
              onClick={() => onPageChange(p)}
              type="button"
            >
              {p}
            </button>
          );
        })}

        <button
          className="flex size-8 items-center justify-center rounded-[6px] border border-[#212936] bg-[#0d151e] text-[#8b94a1] transition-all hover:bg-[#151c25] hover:text-white disabled:pointer-events-none disabled:opacity-40"
          disabled={page >= safeTotalPages}
          onClick={() => onPageChange(page + 1)}
          type="button"
          aria-label="Next page"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>

      {/* Right: Items Per Page Dropdown */}
      <div className="flex items-center gap-2">
        <span className="text-[11px] font-bold text-[#8b94a1]">Total {total} items</span>
        <select
          className="h-8 rounded-[6px] border border-[#212936] bg-[#0d151e] px-2.5 text-xs font-bold text-white outline-none focus:border-[#FFD369] transition-all cursor-pointer"
          value={limit}
          onChange={(e) => onLimitChange(Number(e.target.value))}
        >
          <option value="5">5 / page</option>
          <option value="10">10 / page</option>
          <option value="20">20 / page</option>
          <option value="50">50 / page</option>
        </select>
      </div>
    </div>
  );
}
