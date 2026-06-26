import { ApplicationsClient } from './ApplicationsClient';

type ApplicationsPageProps = {
  params: Promise<{
    projectId: string;
  }>;
};

export default async function ApplicationsPage({ params }: ApplicationsPageProps) {
  const { projectId } = await params;

  return <ApplicationsClient projectId={Number(projectId)} />;
}
