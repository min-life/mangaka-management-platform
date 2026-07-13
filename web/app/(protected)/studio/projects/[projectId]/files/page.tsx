import { Suspense } from 'react';
import { FilesClient } from './FilesClient';
import { LoadingState } from '@/components/ui/loading-state';

type ProjectFilesPageProps = {
  params: Promise<{
    projectId: string;
  }>;
};

export default async function ProjectFilesPage() {
  return <FilesClient />;
}
