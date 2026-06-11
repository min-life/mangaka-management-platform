import type { ReactNode } from 'react';

type FormFieldProps = {
  label: string;
  children: ReactNode;
};

export function FormField({ label, children }: FormFieldProps) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-[12px] font-semibold uppercase leading-4 tracking-[0.05em] text-[#c4c7c7]">
        {label}
      </label>
      {children}
    </div>
  );
}
