import { TaskDetailClient } from './TaskDetailClient';

type TaskDetailPageProps = {
  params: Promise<{ projectId: string; taskId: string }>;
};

export default async function TaskDetailPage({ params }: TaskDetailPageProps) {
  const { projectId, taskId } = await params;

  return <TaskDetailClient projectId={Number(projectId)} taskId={taskId} />;
}
