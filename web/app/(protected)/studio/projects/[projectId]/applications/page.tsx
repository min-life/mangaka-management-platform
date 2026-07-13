import { ApplicationsClient } from './ApplicationsClient';

type ApplicationsPageProps = {
  params: Promise<{
    projectId: string;
  }>;
};

export default async function ApplicationsPage() {
  return <ApplicationsClient />;
}
