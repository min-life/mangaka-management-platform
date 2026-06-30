import { Badge } from '@/components/ui/badge';

import type { AdminUserStatus } from '../data/admin-data';

const STATUS_CLASS_NAMES: Record<AdminUserStatus, string> = {
  Active: 'border-[#FFD369]/50 bg-[#FFD369]/10 text-[#f4d98a]',
  Invited: 'border-[#4A5260] bg-[#393E46] text-[#aeb7c2]',
  Disabled: 'border-red-400/30 bg-red-400/10 text-red-200',
};

type StatusBadgeProps = {
  status: AdminUserStatus;
};

// Codex #admin-ui start
export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <Badge variant="outline" className={STATUS_CLASS_NAMES[status]}>
      {status}
    </Badge>
  );
}
// Codex #admin-ui end
