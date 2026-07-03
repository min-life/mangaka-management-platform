import {
  ApiComment,
  ApiDataResponse,
  ApiFile,
  ApiFrame,
  ApiFolder,
  ApiListResponse,
  ApiMaterial,
  ApiTask,
} from './apiTypes';
import { apiRequest } from './apiClient';
import {
  mapComment,
  mapFile,
  mapFolder,
  mapFrame,
  mapMaterialVersion,
  mapResourceTask,
  uniqueById,
} from './mappers';
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
      limit: 10,
      order: 'desc',
      page: 1,
      type: 'ARC',
    },
  });

  return uniqueById(
    (response.data ?? [])
      .filter((folder) => !folder.parent && !folder.parentId)
      .map((folder) => mapFolder(folder)),
  );
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

  const childFolders = uniqueById((childrenResponse.data ?? []).map((item) => mapFolder(item)));
  const files = uniqueById((filesResponse.data ?? []).map((item) => mapFile(item)));

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
    apiRequest<ApiListResponse<ApiComment>>(`/files/${fileId}/comments`, {
      params: { limit: 100, page: 1 },
    }),
  ]);

  const file = fileResponse.data;
  if (!file) throw new Error('File not found');

  const tasks = await Promise.all(
    (tasksResponse.data ?? []).map(async (task) => {
      const [framesResponse, taskCommentsResponse] = await Promise.all([
        apiRequest<ApiListResponse<ApiFrame>>(`/tasks/${task.id}/frames`, {
          params: { limit: 100, page: 1 },
        }).catch(() => ({ data: [] })),
        apiRequest<ApiListResponse<ApiComment>>(`/tasks/${task.id}/comments`, {
          params: { limit: 100, page: 1 },
        }).catch(() => ({ data: [] })),
      ]);
      const frameComments = await Promise.all(
        (framesResponse.data ?? []).map((frame) =>
          apiRequest<ApiListResponse<ApiComment>>(`/frames/${frame.id}/comments`, {
            params: { limit: 100, page: 1 },
          })
            .then((response) => response.data ?? [])
            .catch(() => []),
        ),
      );
      return mapResourceTask(task, framesResponse.data ?? [], [
        ...(taskCommentsResponse.data ?? []),
        ...frameComments.flat(),
      ]);
    }),
  );

  return mapFile(file, versionsResponse.data ?? [], uniqueById(tasks), commentsResponse.data ?? []);
}

export async function createFileDiscussionComment(params: { fileId: string; text: string }) {
  const text = params.text.trim();
  if (!text) throw new Error('Vui lòng nhập nội dung bình luận.');

  const response = await apiRequest<ApiDataResponse<ApiComment>>(
    `/files/${params.fileId}/comments`,
    {
      body: { content: { text } },
      method: 'POST',
    },
  );

  if (!response.data) throw new Error('Không thể tạo bình luận.');
  return mapComment(response.data);
}

export async function fetchFileDiscussionComments(fileId: string) {
  const response = await apiRequest<ApiListResponse<ApiComment>>(`/files/${fileId}/comments`, {
    params: { field: 'createdAt', limit: 100, order: 'desc', page: 1 },
  });

  return uniqueById((response.data ?? []).map(mapComment));
}

export async function fetchFileDiscussionTasks(fileId: string) {
  const response = await apiRequest<ApiListResponse<ApiTask>>(`/files/${fileId}/tasks`, {
    params: { field: 'createdAt', limit: 100, order: 'desc', page: 1 },
  });

  return uniqueById((response.data ?? []).map((task) => mapResourceTask(task)));
}

export async function fetchTaskDiscussionComments(taskId: string) {
  const response = await apiRequest<ApiListResponse<ApiComment>>(`/tasks/${taskId}/comments`, {
    params: { field: 'createdAt', limit: 100, order: 'desc', page: 1 },
  });

  return uniqueById((response.data ?? []).map(mapComment));
}

export async function fetchTaskDiscussionFrames(taskId: string) {
  const response = await apiRequest<ApiListResponse<ApiFrame>>(`/tasks/${taskId}/frames`, {
    params: { limit: 100, page: 1 },
  });

  return uniqueById((response.data ?? []).map(mapFrame));
}

export async function fetchFrameDetail(frameId: string) {
  const response = await apiRequest<ApiDataResponse<ApiFrame>>(`/frames/${frameId}`);

  if (!response.data) throw new Error('Frame not found.');
  return mapFrame(response.data);
}

export async function fetchFrameDiscussionComments(frameId: string) {
  const response = await apiRequest<ApiListResponse<ApiComment>>(`/frames/${frameId}/comments`, {
    params: { field: 'createdAt', limit: 100, order: 'desc', page: 1 },
  });

  return uniqueById((response.data ?? []).map(mapComment));
}

export async function createDiscussionComment(params: {
  frameId?: string | null;
  taskId: string;
  text: string;
}) {
  const text = params.text.trim();
  if (!text) throw new Error('Vui lòng nhập nội dung bình luận.');

  const path = params.frameId
    ? `/frames/${params.frameId}/comments`
    : `/tasks/${params.taskId}/comments`;
  const response = await apiRequest<ApiDataResponse<ApiComment>>(path, {
    body: { content: { text } },
    method: 'POST',
  });

  if (!response.data) throw new Error('Không thể tạo bình luận.');
  return mapComment(response.data);
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
        const versions = uniqueById((versionsResponse.data ?? []).map(mapMaterialVersion));
        const latestVersion = versions[0];
        if (latestVersion) {
          const file = {
            ...item,
            materialVersions: versions,
            previewImageUri: latestVersion.materials.imageUri,
          } as ResourceFileNode;
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
