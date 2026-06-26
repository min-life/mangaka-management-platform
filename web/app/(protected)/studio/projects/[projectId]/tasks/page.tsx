import { TasksClient } from './TasksClient';

type TasksPageProps = {
  params: Promise<{ projectId: string }>;
};

export default async function TasksPage({ params }: TasksPageProps) {
  const { projectId } = await params;

  return <TasksClient projectId={Number(projectId)} />;
}
