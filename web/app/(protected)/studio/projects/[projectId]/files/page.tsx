import { Suspense } from 'react';
import { FilesClient } from './FilesClient';
import { LoadingState } from '@/components/ui/loading-state';

type ProjectFilesPageProps = {
  params: Promise<{
    projectId: string;
  }>;
};

export default async function ProjectFilesPage({ params }: ProjectFilesPageProps) {
  const { projectId } = await params;

  return <FilesClient projectId={Number(projectId)} />;
}
