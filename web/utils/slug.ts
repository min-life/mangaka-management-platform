export function getProjectSlug(id: number | string, name: string) {
  const cleanName = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
  return cleanName ? `${id}-${cleanName}` : `${id}`;
}

export function parseId(slug: string | number | undefined | null): number {
  if (slug == null) return 0;
  if (typeof slug === 'number') return slug;
  
  // Extract the first numeric part before any dash
  const idPart = String(slug).split('-')[0];
  const parsed = parseInt(idPart, 10);
  
  return isNaN(parsed) ? 0 : parsed;
}
