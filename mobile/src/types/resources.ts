export type ResourceNodeType = 'folder' | 'file';

export interface ResourceNodeBase {
  id: string;
  name: string;
  type: ResourceNodeType;
  createdBy?: string;
  createdByName?: string;
  createdAt?: string;
  updatedAt?: string;
  coverUri?: string;
}

export interface ResourceFolderNode extends ResourceNodeBase {
  type: 'folder';
  projectId?: string;
  parentId: string | null;
  description?: string;
  children: ResourceNode[];
}

export interface ResourceFileNode extends ResourceNodeBase {
  type: 'file';
  folderId?: string;
  description?: string;
  language: string;
  content: string;
}

export type ResourceNode = ResourceFolderNode | ResourceFileNode;

export interface ProjectResourceTree {
  projectId: string;
  root: ResourceFolderNode;
}
