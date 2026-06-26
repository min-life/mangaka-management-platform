import { ProjectShell } from '../components/ProjectShell';

type ProjectLayoutProps = {
  children: React.ReactNode;
  params: Promise<{
    projectId: string;
  }>;
};

export default async function ProjectLayout({ children, params }: ProjectLayoutProps) {
  const { projectId } = await params;

  return <ProjectShell projectId={projectId}>{children}</ProjectShell>;
}
