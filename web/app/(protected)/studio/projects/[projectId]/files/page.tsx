import { FilesClient } from './FilesClient';

type ProjectFilesPageProps = {
  params: Promise<{
    projectId: string;
  }>;
};

export default async function ProjectFilesPage({ params }: ProjectFilesPageProps) {
  const { projectId } = await params;

  return <FilesClient projectId={Number(projectId)} />;
}
