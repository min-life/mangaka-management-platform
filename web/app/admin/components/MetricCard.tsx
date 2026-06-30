import type { LucideIcon } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';

type MetricCardProps = {
  label: string;
  value: string;
  change: string;
  icon: LucideIcon;
};

// Codex #admin-ui start
export function MetricCard({ label, value, change, icon: Icon }: MetricCardProps) {
  return (
    <Card className="border-[#4A5260] bg-[#393E46] shadow-sm">
      <CardContent className="flex items-start justify-between gap-4 pt-1">
        <div>
          <p className="text-sm font-medium text-[#aeb7c2]">{label}</p>
          <p className="mt-3 text-3xl font-semibold text-[#EEEEEE]">{value}</p>
          <p className="mt-2 text-sm text-[#8f9aa8]">{change}</p>
        </div>
        <div className="grid size-10 place-items-center rounded-lg bg-[#FFD369] text-[#222831]">
          <Icon className="size-5" />
        </div>
      </CardContent>
    </Card>
  );
}
// Codex #admin-ui end
