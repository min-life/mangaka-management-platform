'use client';

import Link from 'next/link';
import { Loader2, ChevronsUpDown, ChevronUp, ChevronDown } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { getProjectSlug } from '@/utils/slug';
import { Pagination } from './Pagination';

function SortIcon({
  activeField,
  activeOrder,
  field,
}: {
  activeField?: string;
  activeOrder?: string;
  field: string;
}) {
  if (activeField !== field) {
    return <ChevronsUpDown className="size-3.5 text-[#8b94a1]" />;
  }
  if (activeOrder === 'asc') {
    return <ChevronUp className="size-3.5 text-[#FFD369]" />;
  }
  return <ChevronDown className="size-3.5 text-[#FFD369]" />;
}

type ApplicationsTabProps = {
  applicationRows: any[];
  isLoading: boolean;
  formatUserName: (user?: any) => string;
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  sortField?: string;
  sortOrder?: 'asc' | 'desc';
  onSort: (field: string) => void;
};

export function ApplicationsTab({
  applicationRows,
  isLoading,
  formatUserName,
  page,
  limit,
  total,
  totalPages,
  onPageChange,
  onLimitChange,
  sortField,
  sortOrder,
  onSort,
}: ApplicationsTabProps) {
  return (
    <section className="mt-5 overflow-hidden rounded-[7px] border border-[#393E46] bg-[#0c1219]">
      <Table>
        <TableHeader>
          <TableRow className="h-[40px] border-[#393E46] bg-[#252e38] hover:bg-[#252e38]">
            <TableHead 
              className="w-[35%] px-5 text-[10px] font-black uppercase tracking-[0.08em] text-[#dce7f3] cursor-pointer select-none hover:text-white"
              onClick={() => onSort('title')}
            >
              <div className="flex items-center gap-1.5">
                Application
                <SortIcon activeField={sortField} activeOrder={sortOrder} field="title" />
              </div>
            </TableHead>
            <TableHead className="w-[180px] text-[10px] font-black uppercase tracking-[0.08em] text-[#dce7f3]">
              Type
            </TableHead>
            <TableHead className="w-[150px] text-[10px] font-black uppercase tracking-[0.08em] text-[#dce7f3]">
              Status
            </TableHead>
            <TableHead className="w-[180px] text-[10px] font-black uppercase tracking-[0.08em] text-[#dce7f3]">
              Project
            </TableHead>
            <TableHead className="w-[180px] text-[10px] font-black uppercase tracking-[0.08em] text-[#dce7f3]">
              Created By
            </TableHead>
            <TableHead 
              className="w-[150px] text-right pr-5 text-[10px] font-black uppercase tracking-[0.08em] text-[#dce7f3] cursor-pointer select-none hover:text-white"
              onClick={() => onSort('createdAt')}
            >
              <div className="flex items-center justify-end gap-1.5">
                Created At
                <SortIcon activeField={sortField} activeOrder={sortOrder} field="createdAt" />
              </div>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={6} className="h-40 text-center">
                <div className="flex flex-col items-center justify-center space-y-3">
                  <Loader2 className="size-6 animate-spin text-[#FFD369]" />
                  <span className="text-xs font-bold text-[#8b94a1]">Loading applications...</span>
                </div>
              </TableCell>
            </TableRow>
          ) : applicationRows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="h-40 text-center text-xs font-bold text-[#8b94a1]">
                No applications found.
              </TableCell>
            </TableRow>
          ) : (
            applicationRows.map((app) => (
              <TableRow
                className="h-[72px] border-l-4 border-l-transparent border-r-0 border-t-0 border-b-[#393E46] bg-[#0b1118] hover:border-l-[#FFD369] hover:bg-[#202832]"
                key={app.id}
              >
                <TableCell className="px-5">
                  <Link
                    className="flex items-center gap-4 rounded-[4px] outline-none transition-opacity hover:opacity-85 focus-visible:ring-2 focus-visible:ring-[#FFD369]"
                    href={`/studio/projects/${getProjectSlug(app.projectId, app.project || '')}/applications`}
                  >
                    <div>
                      <p className="text-sm font-black leading-5 text-white">{app.title}</p>
                    </div>
                  </Link>
                </TableCell>
                <TableCell className="text-xs font-bold text-white">
                  {app.type}
                </TableCell>
                <TableCell className="text-xs font-bold text-white">
                  {app.status}
                </TableCell>
                <TableCell className="text-xs font-bold text-white">
                  {app.project}
                </TableCell>
                <TableCell className="text-xs font-bold text-white">
                  <div className="flex items-center gap-2">
                    {app.createdByUser?.avatarUrl && app.createdByUser.avatarUrl.trim() !== '' ? (
                      <img
                        src={app.createdByUser.avatarUrl || undefined}
                        alt=""
                        className="size-7 rounded-full border border-[#393E46] object-cover"
                      />
                    ) : (
                      <span className="grid size-7 place-items-center rounded-full border border-[#26303b] bg-[#393E46] text-[9px] font-black text-white">
                        {formatUserName(app.createdByUser).charAt(0).toUpperCase()}
                      </span>
                    )}
                    <span>{app.createdBy}</span>
                  </div>
                </TableCell>
                <TableCell className="pr-5 text-right text-xs font-bold text-white">
                  {app.created}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      <Pagination
        page={page}
        limit={limit}
        total={total}
        totalPages={totalPages}
        onPageChange={onPageChange}
        onLimitChange={onLimitChange}
      />
    </section>
  );
}
