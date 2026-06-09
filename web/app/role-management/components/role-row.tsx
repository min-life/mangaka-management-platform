import { Edit } from 'lucide-react';
import Link from 'next/link';

import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarImage,
} from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TableCell, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { memberAvatars, toRoleRow } from '../const';

type RoleRowProps = {
  role: ReturnType<typeof toRoleRow>;
};

export function RoleRow({ role }: RoleRowProps) {
  return (
    <TableRow className="h-[65px] border-[#444748] transition-colors hover:bg-[#2f282a]">
      <TableCell className="px-6 py-4">
        <div className="flex items-center gap-3">
          <role.icon
            className={cn('size-5', role.highlighted ? 'text-[#e2e2e2]' : 'text-[#c4c7c7]')}
          />
          <span className="text-[14px] font-bold leading-5 text-[#ecdfe2]">{role.name}</span>
        </div>
      </TableCell>
      <TableCell className="px-6 py-4 font-mono text-[11px] leading-[14px] text-[#c4c7c7]">
        #{role.id}
      </TableCell>
      <TableCell className="px-6 py-4 text-center">
        <Badge
          className={cn(
            'h-[18px] rounded px-2 py-0.5 text-[10px] font-bold uppercase leading-none',
            role.scope === 'SYS'
              ? 'border-[#e2e2e2]/30 bg-[#c6c6c6]/20 text-[#e2e2e2]'
              : 'border-[#444748] bg-[#3a3335] text-[#c4c7c7]',
          )}
          variant="outline"
        >
          {role.scope}
        </Badge>
      </TableCell>
      <TableCell className="px-6 py-4 text-[14px] leading-5 text-[#ecdfe2]">
        {role.members === 'avatars' ? (
          <AvatarGroup className="-space-x-2">
            {memberAvatars.map((avatar, index) => (
              <Avatar className="size-6 border border-[#0f0f0f] ring-0" key={avatar} size="sm">
                <AvatarImage alt={`Member ${index + 1}`} src={avatar} />
                <AvatarFallback>M{index + 1}</AvatarFallback>
              </Avatar>
            ))}
            <AvatarGroupCount className="size-6 border border-[#0f0f0f] bg-[#3a3335] text-[10px] font-bold text-[#ecdfe2] ring-0">
              +2
            </AvatarGroupCount>
          </AvatarGroup>
        ) : (
          role.members
        )}
      </TableCell>
      <TableCell className="px-6 py-4 text-[12px] leading-4 text-[#c4c7c7]">
        {role.createdAt}
      </TableCell>
      <TableCell className="px-6 py-4 text-right">
        <Button
          asChild
          className="ml-auto h-7 gap-1 px-2 text-[#c4c7c7] hover:text-[#e2e2e2]"
          size="sm"
          variant="ghost"
        >
          <Link href={`/role-management/detail?roleId=${role.id}`}>
            <Edit className="size-[18px]" />
            <span className="text-[12px] font-medium">Edit</span>
          </Link>
        </Button>
      </TableCell>
    </TableRow>
  );
}
