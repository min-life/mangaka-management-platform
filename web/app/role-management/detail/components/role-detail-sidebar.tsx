import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { navItems, sidebarUtilityItems, studioAvatar, type RoleDetailIcon } from '../const';

export function RoleDetailSidebar() {
  return (
    <aside className="fixed left-0 top-0 z-50 flex h-full w-[260px] flex-col border-r border-[#444748] bg-[#241e20] px-4 py-6">
      <div className="mb-10 px-2">
        <h1 className="text-[24px] font-bold leading-8 text-[#e2e2e2]">MangaStudio Ink</h1>
        <p className="mt-1 text-[12px] uppercase leading-4 tracking-[0.18em] text-[#c4c7c7]">
          Editorial Control
        </p>
      </div>

      <nav className="flex-grow space-y-1">
        {navItems.map((item) => (
          <a
            href="#"
            key={item.label}
            className={cn(
              'flex h-[40px] items-center gap-3 rounded px-3 py-2.5 text-[14px] leading-5 transition-colors',
              item.active
                ? 'border-r-2 border-[#e2e2e2] bg-[#2f282a] font-bold text-[#e2e2e2]'
                : 'text-[#c4c7c7] hover:bg-[#2f282a]',
            )}
          >
            <item.icon className="size-5" />
            <span>{item.label}</span>
          </a>
        ))}
      </nav>

      <div className="mt-auto space-y-1 border-t border-[#444748] pt-6">
        {sidebarUtilityItems.map((item) => (
          <SidebarUtility icon={item.icon} label={item.label} key={item.label} />
        ))}
        <div className="mt-6 flex items-center gap-3 px-2">
          <Avatar className="size-8 border border-[#8e9192]">
            <AvatarImage alt="Studio Lead Avatar" src={studioAvatar} />
            <AvatarFallback>SL</AvatarFallback>
          </Avatar>
          <div className="min-w-0 overflow-hidden">
            <p className="truncate text-[12px] font-bold leading-4">Studio Lead</p>
            <p className="truncate text-[10px] text-[#c4c7c7]">admin@mangastudio.ink</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

function SidebarUtility({ icon: Icon, label }: { icon: RoleDetailIcon; label: string }) {
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
