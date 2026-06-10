'use client';

import { useState } from 'react';
import { FolderCog, Lock, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { createRole, type RoleScope } from '@/lib/roles-api';
import { createRoleModal } from '../const';
import { CreateRoleField } from './create-role-field';

export function CreateRoleModal() {
  const router = useRouter();
  const [roleName, setRoleName] = useState('');
  const [scope, setScope] = useState<RoleScope>('SYS');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleCreateRole() {
    if (!roleName.trim()) {
      setError('Role name is required.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const role = await createRole({ name: roleName.trim(), scope });
      router.push(`/role-management/detail?roleId=${role.id}`);
    } catch {
      setError('Unable to create role from local API.');
      setIsSubmitting(false);
    }
  }

  return (
    <div className="relative w-full max-w-lg overflow-hidden border border-[#333333] bg-[rgba(27,27,27,0.85)] text-[#ecdfe2] shadow-2xl backdrop-blur-2xl">
      <div className="space-y-6 p-8">
        <div className="space-y-1">
          <div className="flex items-start justify-between">
            <h2 className="text-[24px] font-semibold leading-8 text-[#ecdfe2]">
              {createRoleModal.title}
            </h2>
            <Button
              asChild
              className="size-8 text-[#c4c7c7] hover:text-[#ecdfe2]"
              size="icon"
              variant="ghost"
            >
              <Link href="/role-management">
                <X className="size-5" />
                <span className="sr-only">Close</span>
              </Link>
            </Button>
          </div>
          <p className="text-[14px] leading-5 text-[#c4c7c7]">{createRoleModal.description}</p>
        </div>

        <div className="space-y-5">
          <CreateRoleField label="Role Name">
            <Input
              className="h-[46px] rounded-sm border-[#444748] bg-[#120d0e] p-3 text-[14px] leading-5 text-[#ecdfe2] outline-none transition-all placeholder:text-[#8e9192] focus-visible:border-[#e2e2e2] focus-visible:ring-1 focus-visible:ring-[#e2e2e2]/20"
              onChange={(event) => setRoleName(event.target.value)}
              placeholder={createRoleModal.roleNamePlaceholder}
              value={roleName}
            />
          </CreateRoleField>

          <CreateRoleField label="Scope">
            <div className="flex min-h-[66px] items-center gap-3 rounded-sm border border-[#444748]/30 bg-[#2f282a]/50 p-3">
              <FolderCog className="size-6 shrink-0 fill-[#c4c7c7] text-[#c4c7c7]" />
              <div className="flex-1">
                <Select value={scope} onValueChange={(value) => setScope(value as RoleScope)}>
                  <SelectTrigger className="h-[30px] w-full rounded-sm border-[#444748] bg-[#120d0e] px-3 text-[14px] font-bold leading-5 text-[#ecdfe2] focus-visible:ring-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-sm border-[#333333] bg-[#1b1b1b] text-[#ecdfe2]">
                    {createRoleModal.scopeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className="block text-[10px] font-medium leading-4 text-[#c4c7c7]">
                  {createRoleModal.scopeDescriptions[scope]}
                </span>
              </div>
              <Lock className="size-4 text-[#c4c7c7]" />
            </div>
          </CreateRoleField>
          {error ? <p className="text-[12px] leading-4 text-[#ffb4ab]">{error}</p> : null}
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-[#444748] pt-4">
          <Button
            asChild
            className="h-[38px] rounded-sm px-6 py-2.5 text-[12px] font-bold text-[#c4c7c7] hover:bg-[#3a3335] hover:text-[#ecdfe2]"
            variant="ghost"
          >
            <Link href="/role-management">Cancel</Link>
          </Button>
          <Button
            className="h-[38px] rounded-sm bg-[#e2e2e2] px-8 py-2.5 text-[12px] font-bold text-[#2f3131] shadow-lg shadow-[#e2e2e2]/10 hover:bg-[#e2e2e2]/90"
            disabled={isSubmitting}
            onClick={handleCreateRole}
          >
            {isSubmitting ? 'Creating...' : 'Create Role'}
          </Button>
        </div>
      </div>
      <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-[#e2e2e2]/40 to-transparent" />
    </div>
  );
}
