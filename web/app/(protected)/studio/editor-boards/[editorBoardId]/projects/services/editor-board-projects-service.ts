import { getEditorBoardProjects as getEditorBoardProjectsRequest } from '@/services/editor-board.service';
import type { ProjectResponse } from '@/services/project.service';

export type EditorBoardProjectUser = {
  avatarUrl: string | null;
  displayName: string;
  id: number;
};

export type EditorBoardProject = {
  createdAt: string;
  createdBy: EditorBoardProjectUser | null;
  description: string | null;
  id: number;
  imageUrl: string | null;
  name: string;
  updatedAt: string;
};

function mapUser(
  user: ProjectResponse['createdByUser'],
): EditorBoardProjectUser | null {
  if (!user) {
    return null;
  }

  return {
    avatarUrl: user.avatarUrl ?? null,
    displayName: user.displayName ?? user.email ?? 'Unknown',
    id: user.id,
  };
}

export async function getEditorBoardProjects(editorBoardId: number | string) {
  const result = await getEditorBoardProjectsRequest(editorBoardId, {
    field: 'createdAt',
    limit: 50,
    order: 'desc',
    page: 1,
  });

  return result.projects.map(
    (project): EditorBoardProject => ({
      createdAt: project.createdAt,
      createdBy: mapUser(project.createdByUser),
      description: project.description ?? null,
      id: project.id,
      imageUrl: project.imageUrl ?? null,
      name: project.name,
      updatedAt: project.updatedAt,
    }),
  );
}
