import { StatisticsClient } from './StatisticsClient';

type StatisticsPageProps = {
  params: Promise<{ projectId: string }>;
};

export default async function StatisticsPage({ params }: StatisticsPageProps) {
  const { projectId } = await params;

  return <StatisticsClient projectId={Number(projectId)} />;
}
