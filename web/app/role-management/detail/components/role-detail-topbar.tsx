import { Bell, Clock3, UserCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { topNavItems } from '../const';

export function RoleDetailTopbar() {
  return (
    <header className="fixed right-0 top-0 z-40 flex h-12 w-[calc(100%-260px)] items-center justify-between border-b border-[#444748] bg-[#171214] px-4">
      <div className="flex items-center gap-6">
        <span className="text-[20px] font-bold leading-7 text-[#e2e2e2]">MangaStudio Ink</span>
        <nav className="hidden items-center gap-6 md:flex">
          {topNavItems.map((item) => (
            <a
              className="text-[14px] leading-5 text-[#c4c7c7] transition-colors hover:text-[#e2e2e2]"
              href="#"
              key={item}
            >
              {item}
            </a>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-4">
        <Button className="size-8 text-[#c4c7c7] hover:text-[#e2e2e2]" size="icon" variant="ghost">
          <Bell className="size-5" />
        </Button>
        <Button className="size-8 text-[#c4c7c7] hover:text-[#e2e2e2]" size="icon" variant="ghost">
          <Clock3 className="size-5" />
        </Button>
        <Button className="size-8 text-[#c4c7c7] hover:text-[#e2e2e2]" size="icon" variant="ghost">
          <UserCircle className="size-5" />
        </Button>
      </div>
    </header>
  );
}
