import type { ProjectMemberResponse } from '@/services/project.service';

export function getRoleClassName(roleName: string) {
  const normalizedRole = roleName.toLowerCase();

  if (normalizedRole.includes('lead')) {
    return 'border-[#6b2637] bg-[#371522] text-[#ff9ab3]';
  }

  if (normalizedRole.includes('review')) {
    return 'border-[#6c5516] bg-[#30270d] text-[#ffd35b]';
  }

  if (normalizedRole.includes('artist')) {
    return 'border-[#4f6e73] bg-[#2a454a] text-[#e9fbff]';
  }

  return 'border-[#4a4f55] bg-[#20282b] text-[#dce7f3]';
}

export function getInitials(member: ProjectMemberResponse) {
  const label = member.displayName ?? member.email;
  return label
    .split(/[.@\s_-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join('');
}

export function formatOptionalDate(dateValue?: string) {
  if (!dateValue) {
    return 'Not returned';
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return dateValue;
  }

  return date.toLocaleDateString('en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}
