import type { ReactNode } from 'react';

type CreateRoleFieldProps = {
  children: ReactNode;
  label: string;
};

export function CreateRoleField({ children, label }: CreateRoleFieldProps) {
  return (
    <div className="space-y-1.5">
      <label className="text-[12px] font-semibold uppercase leading-4 tracking-wide text-[#c4c7c7]">
        {label}
      </label>
      {children}
    </div>
  );
}
