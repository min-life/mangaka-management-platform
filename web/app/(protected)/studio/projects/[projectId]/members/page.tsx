import { ProjectMembersClient } from './ProjectMembersClient';

type ProjectMembersPageProps = {
  params: Promise<{
    projectId: string;
  }>;
};

export default async function ProjectMembersPage() {
  return <ProjectMembersClient />;
}
