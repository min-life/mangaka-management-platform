import { FileDetailClient } from './FileDetailClient';

type FileDetailPageProps = {
  params: Promise<{
    fileId: string;
    projectId: string;
  }>;
  searchParams: Promise<{
    taskId?: string;
  }>;
};

export default async function FileDetailPage({ params, searchParams }: FileDetailPageProps) {
  const { fileId, projectId } = await params;
  const { taskId } = await searchParams;

  return (
    <FileDetailClient
      fileId={Number(fileId)}
      focusedTaskId={taskId ?? null}
      projectId={Number(projectId)}
    />
  );
}
