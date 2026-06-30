import {
  ApiDataResponse,
  ApiFile,
  ApiFolder,
  ApiListResponse,
  ApiMaterial,
  ApiTask,
} from './apiTypes';
import { apiRequest } from './apiClient';
import { mapFile, mapFolder, mapMaterialVersion, mapResourceTask } from './mappers';
import {
  ResourceFileMaterialVersion,
  ResourceFileNode,
  ResourceFolderNode,
  ResourceNode,
} from '@/src/types/resources';

export interface ProjectMaterialFile {
  file: ResourceFileNode;
  folderId: string;
  latestVersion: ResourceFileMaterialVersion;
  versionCount: number;
}

export async function fetchProjectRootFolders(projectId: string) {
  const response = await apiRequest<ApiListResponse<ApiFolder>>(`/projects/${projectId}/folders`, {
    params: {
      field: 'createdAt',
      limit: 100,
      order: 'desc',
      page: 1,
    },
  });

  return (response.data ?? [])
    .filter((folder) => !folder.parent && !folder.parentId)
    .map((folder) => mapFolder(folder));
}

export async function fetchFolderBundle(folderId: string) {
  const [folderResponse, childrenResponse, filesResponse] = await Promise.all([
    apiRequest<ApiDataResponse<ApiFolder>>(`/folders/${folderId}`),
    apiRequest<ApiListResponse<ApiFolder>>(`/folders/${folderId}/children`, {
      params: { field: 'createdAt', limit: 100, order: 'desc', page: 1 },
    }),
    apiRequest<ApiListResponse<ApiFile>>(`/folders/${folderId}/files`, {
      params: { field: 'createdAt', limit: 100, order: 'desc', page: 1 },
    }),
  ]);

  const folder = folderResponse.data;
  if (!folder) throw new Error('Resource folder not found');

  const childFolders = (childrenResponse.data ?? []).map((item) => mapFolder(item));
  const files = (filesResponse.data ?? []).map((item) => mapFile(item));

  return {
    folder: mapFolder(folder, [...childFolders, ...files]),
    items: [...childFolders, ...files] as ResourceNode[],
  };
}

export async function fetchResourceFileBundle(fileId: string) {
  const [fileResponse, versionsResponse, tasksResponse, commentsResponse] = await Promise.all([
    apiRequest<ApiDataResponse<ApiFile>>(`/files/${fileId}`),
    apiRequest<ApiListResponse<ApiMaterial>>(`/files/${fileId}/versions`, {
      params: { limit: 50, page: 1 },
    }).catch(() => ({ data: [] })),
    apiRequest<ApiListResponse<ApiTask>>(`/files/${fileId}/tasks`, {
      params: { limit: 50, page: 1 },
    }).catch(() => ({ data: [] })),
    apiRequest<ApiListResponse<never>>(`/files/${fileId}/comments`, {
      params: { limit: 100, page: 1 },
    }).catch(() => ({ data: [] })),
  ]);

  const file = fileResponse.data;
  if (!file) throw new Error('File not found');

  const tasks = await Promise.all(
    (tasksResponse.data ?? []).map(async (task) => {
      const [framesResponse, taskCommentsResponse] = await Promise.all([
        apiRequest<ApiListResponse<never>>(`/tasks/${task.id}/frames`, {
          params: { limit: 100, page: 1 },
        }).catch(() => ({ data: [] })),
        apiRequest<ApiListResponse<never>>(`/tasks/${task.id}/comments`, {
          params: { limit: 100, page: 1 },
        }).catch(() => ({ data: [] })),
      ]);
      return mapResourceTask(task, framesResponse.data ?? [], taskCommentsResponse.data ?? []);
    }),
  );

  return mapFile(file, versionsResponse.data ?? [], tasks);
}

export async function fetchProjectMaterials(projectId: string): Promise<ProjectMaterialFile[]> {
  const rootFolders = await fetchProjectRootFolders(projectId);
  const result: ProjectMaterialFile[] = [];

  async function walkFolder(folder: ResourceFolderNode) {
    const bundle = await fetchFolderBundle(folder.id);
    await Promise.all(
      bundle.items.map(async (item) => {
        if (item.type === 'folder') {
          await walkFolder(item);
          return;
        }

        const versionsResponse = await apiRequest<ApiListResponse<ApiMaterial>>(
          `/files/${item.id}/versions`,
          { params: { limit: 20, page: 1 } },
        ).catch(() => ({ data: [] }));
        const versions = (versionsResponse.data ?? []).map(mapMaterialVersion);
        const latestVersion = versions[0];
        if (latestVersion) {
          const file = { ...item, materialVersions: versions, previewImageUri: latestVersion.materials.imageUri } as ResourceFileNode;
          result.push({
            file,
            folderId: folder.id,
            latestVersion,
            versionCount: versions.length,
          });
        }
      }),
    );
  }

  await Promise.all(rootFolders.map(walkFolder));
  return result;
}
