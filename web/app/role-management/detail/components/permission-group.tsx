import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

type PermissionGroupProps = {
  title: string;
  permissions: Array<{
    label: string;
    checked: boolean;
    disabled?: boolean;
  }>;
};

export function PermissionGroup({ title, permissions }: PermissionGroupProps) {
  return (
    <div>
      <h3 className="mb-4 border-l-2 border-[#e2e2e2] pl-3 text-[12px] font-semibold leading-4 tracking-[0.05em] text-[#e2e2e2]">
        {title}
      </h3>
      <div className="space-y-4">
        {permissions.map((permission) => (
          <label
            className="group flex cursor-pointer items-center justify-between"
            key={permission.label}
          >
            <span
              className={cn(
                'text-[14px] leading-5',
                permission.disabled ? 'text-[#c4c7c7]' : 'text-[#ecdfe2]',
              )}
            >
              {permission.label}
            </span>
            <Checkbox
              checked={permission.checked}
              className={cn(
                'size-5 rounded-sm border-[#444748] bg-transparent focus-visible:ring-0 data-checked:border-emerald-500 data-checked:bg-emerald-500 data-checked:text-white',
                permission.disabled && 'cursor-not-allowed bg-[#241e20] opacity-50',
              )}
              disabled={permission.disabled}
            />
          </label>
        ))}
      </div>
    </div>
  );
}
