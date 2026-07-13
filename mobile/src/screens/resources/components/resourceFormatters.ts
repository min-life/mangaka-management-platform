import { ResourceFolderNode } from '@/src/types/resources';

export function getResourceCreatorName(node: ResourceFolderNode) {
  return node.createdByName ?? node.createdBy ?? 'Unknown creator';
}

export function formatResourceDate(value?: string) {
  if (!value) return '';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value ?? '';

  return new Intl.DateTimeFormat('en', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function getResourceDateRange(node: ResourceFolderNode) {
  const createdAt = formatResourceDate(node.createdAt);
  const updatedAt = formatResourceDate(node.updatedAt);

  if (createdAt && updatedAt) return `${createdAt} - ${updatedAt}`;
  return createdAt || updatedAt || 'No date';
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
