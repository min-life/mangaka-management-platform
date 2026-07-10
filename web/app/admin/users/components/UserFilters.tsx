'use client';

import { Search } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import type { AdminRoleResponse } from '../../admin-api';

type UserFiltersProps = {
  roleFilter: string;
  roles: AdminRoleResponse[];
  searchQuery: string;
  setRoleFilter: (value: string) => void;
  setSearchQuery: (value: string) => void;
  setStatusFilter: (value: string) => void;
  statusFilter: string;
};

export function UserFilters({
  roleFilter,
  roles,
  searchQuery,
  setRoleFilter,
  setSearchQuery,
  setStatusFilter,
  statusFilter,
}: UserFiltersProps) {
  return (
    <Card className="border-[#4A5260] bg-[#393E46] shadow-sm">
      <CardContent className="grid gap-3 pt-1 md:grid-cols-[1fr_180px_180px]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#8f9aa8]" />
          <Input
            className="h-10 border-[#4A5260] bg-[#393E46] pl-9 text-[#EEEEEE] placeholder:text-[#8f9aa8] focus-visible:border-[#FFD369] focus-visible:bg-[#414854] focus-visible:ring-[#FFD369]/20"
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search by name or email"
            value={searchQuery}
          />
        </div>
        <Select onValueChange={setRoleFilter} value={roleFilter}>
          <SelectTrigger className="h-10 w-full border-[#4A5260] bg-[#393E46] text-[#EEEEEE] focus-visible:border-[#FFD369] focus-visible:ring-[#FFD369]/20">
            <SelectValue placeholder="Role" />
          </SelectTrigger>
          <SelectContent className="border-[#4A5260] bg-[#393E46] text-[#EEEEEE]">
            <SelectItem value="all">All Roles</SelectItem>
            {roles.map((role) => (
              <SelectItem key={role.id} value={String(role.id)}>
                {role.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select onValueChange={setStatusFilter} value={statusFilter}>
          <SelectTrigger className="h-10 w-full border-[#4A5260] bg-[#393E46] text-[#EEEEEE] focus-visible:border-[#FFD369] focus-visible:ring-[#FFD369]/20">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="border-[#4A5260] bg-[#393E46] text-[#EEEEEE]">
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="disabled">Disabled</SelectItem>
          </SelectContent>
        </Select>
      </CardContent>
    </Card>
  );
}
