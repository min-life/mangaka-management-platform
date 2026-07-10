import { ProjectAppHeader } from './ProjectAppHeader';
import { ProjectSidebar } from './ProjectSidebar';

type ProjectShellProps = {
  children: React.ReactNode;
  projectId: string;
  projectName?: string;
};

export function ProjectShell({
  children,
  projectId,
  projectName = 'Neon Tokyo Drifters',
}: ProjectShellProps) {
  return (
    <main className="workspace-scrollbar flex h-screen overflow-hidden bg-[#101820] text-[#eeeeee]">
      <ProjectSidebar projectId={projectId} />
      <div className="flex h-screen min-w-0 flex-1 flex-col overflow-hidden">
        <ProjectAppHeader projectId={projectId} projectName={projectName} />
        <div className="min-h-0 flex-1 w-full max-w-full overflow-x-hidden overflow-y-auto">{children}</div>
      </div>
    </main>
  );
}
