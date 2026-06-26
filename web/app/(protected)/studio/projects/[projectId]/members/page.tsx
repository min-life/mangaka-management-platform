import { ProjectMembersClient } from './ProjectMembersClient';

type ProjectMembersPageProps = {
  params: Promise<{
    projectId: string;
  }>;
};

export default async function ProjectMembersPage({ params }: ProjectMembersPageProps) {
  const { projectId } = await params;

  return <ProjectMembersClient projectId={Number(projectId)} />;
}
