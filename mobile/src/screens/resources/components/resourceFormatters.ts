import { ResourceFolderNode } from '@/src/types/resources';

const FALLBACK_CREATOR = 'Project owner';
const FALLBACK_CREATED_AT = '2026-06-01T08:00:00.000Z';
const FALLBACK_UPDATED_AT = '2026-06-28T04:00:00.000Z';

export function getResourceCreatorName(node: ResourceFolderNode) {
  return node.createdByName ?? node.createdBy ?? FALLBACK_CREATOR;
}

export function formatResourceDate(value?: string) {
  const date = new Date(value ?? FALLBACK_CREATED_AT);

  if (Number.isNaN(date.getTime())) return value ?? '';

  return new Intl.DateTimeFormat('en', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function getResourceDateRange(node: ResourceFolderNode) {
  return `${formatResourceDate(node.createdAt)} - ${formatResourceDate(
    node.updatedAt ?? FALLBACK_UPDATED_AT,
  )}`;
}

export function getResourceInitials(name: string) {
  return name
    .split(/[\s._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

export function getDirectChapterCount(folder: ResourceFolderNode) {
  return folder.children.filter((node) => node.type === 'folder').length;
}

export function getPageCount(folder: ResourceFolderNode): number {
  return folder.children.reduce((total, node) => {
    if (node.type === 'file') return total + 1;
    return total + getPageCount(node);
  }, 0);
}

export function getMaterialVersionCount(folder: ResourceFolderNode): number {
  return folder.children.reduce((total, node) => {
    if (node.type === 'file') return total + (node.materialVersions?.length ?? 0);
    return total + getMaterialVersionCount(node);
  }, 0);
}
