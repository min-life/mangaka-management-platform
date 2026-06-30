import type { ReactNode } from 'react';

type PageHeaderProps = {
  title: string;
  description: string;
  action?: ReactNode;
};

// Codex #admin-ui start
export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#FFD369]">
          MangaStudio Admin
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-normal text-[#EEEEEE]">{title}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#aeb7c2]">{description}</p>
      </div>
      {action}
    </div>
  );
}
// Codex #admin-ui end
