import type { RoleManagementIcon } from '../const';

type SidebarUtilityProps = {
  icon: RoleManagementIcon;
  label: string;
};

export function SidebarUtility({ icon: Icon, label }: SidebarUtilityProps) {
  return (
    <a
      className="flex h-8 items-center gap-3 px-3 py-2 text-[12px] leading-4 text-[#c4c7c7] transition-colors hover:text-[#e2e2e2]"
      href="#"
    >
      <Icon className="size-[18px]" />
      <span>{label}</span>
    </a>
  );
}
