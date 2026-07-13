import { useParams } from 'next/navigation';
import { useMemo } from 'react';
import { parseId } from '@/utils/slug';

export function useProjectParams() {
  const params = useParams();
  // We cast to string because useParams values can be string | string[]
  const slug = params?.projectId ? String(params.projectId) : '';
  const numericId = useMemo(() => parseId(slug), [slug]);
  
  return { slug, numericId };
}
