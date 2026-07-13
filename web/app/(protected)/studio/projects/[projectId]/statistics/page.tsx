import { StatisticsClient } from './StatisticsClient';

type StatisticsPageProps = {
  params: Promise<{ projectId: string }>;
};

export default async function StatisticsPage() {
  return <StatisticsClient />;
}
