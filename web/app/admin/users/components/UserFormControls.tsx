'use client';

import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import type { AdminRoleResponse } from '../../admin-api';

export function RoleCheckboxList({
  onChange,
  roles,
  selectedRoleIds,
}: {
  onChange: (roleIds: number[]) => void;
  roles: AdminRoleResponse[];
  selectedRoleIds: number[];
}) {
  const toggleRole = (roleId: number) => {
    onChange(
      selectedRoleIds.includes(roleId)
        ? selectedRoleIds.filter((selectedRoleId) => selectedRoleId !== roleId)
        : [...selectedRoleIds, roleId],
    );
  };

  return (
    <div className="grid gap-2">
      <Label>SYS Roles</Label>
      <div className="grid max-h-56 gap-2 overflow-y-auto rounded-lg border border-[#4A5260] bg-[#393E46] p-3">
        {roles.length ? (
          roles.map((role) => (
            <label className="flex items-center gap-3 text-sm text-[#EEEEEE]" key={role.id}>
              <Checkbox
                checked={selectedRoleIds.includes(Number(role.id))}
                className="data-checked:border-[#FFD369] data-checked:bg-[#FFD369] data-checked:text-[#222831]"
                onCheckedChange={() => toggleRole(Number(role.id))}
              />
              <span>{role.name}</span>
            </label>
          ))
        ) : (
          <p className="text-sm text-[#aeb7c2]">No SYS roles available.</p>
        )}
      </div>
    </div>
  );
}

export function AdminTextField({
  autoComplete,
  label,
  onChange,
  placeholder,
  type = 'text',
  value,
}: {
  autoComplete?: string;
  label: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: 'email' | 'password' | 'text';
  value: string;
}) {
  const inputId = label.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="grid gap-2">
      <Label htmlFor={inputId}>{label}</Label>
      <Input
        autoComplete={autoComplete}
        className="border-[#4A5260] bg-[#393E46] text-[#EEEEEE] placeholder:text-[#8f9aa8] focus-visible:border-[#FFD369] focus-visible:bg-[#414854] focus-visible:ring-[#FFD369]/20"
        id={inputId}
        name={`admin-${inputId}`}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        type={type}
        value={value}
      />
    </div>
  );
}
