export type ResourceNodeType = 'folder' | 'file';

export interface ResourceNodeBase {
  id: string;
  name: string;
  type: ResourceNodeType;
}

export interface ResourceFolderNode extends ResourceNodeBase {
  type: 'folder';
  parentId: string | null;
  description?: string;
  children: ResourceNode[];
}

export interface ResourceFileNode extends ResourceNodeBase {
  type: 'file';
  language: string;
  content: string;
}

export type ResourceNode = ResourceFolderNode | ResourceFileNode;

export interface ProjectResourceTree {
  projectId: string;
  root: ResourceFolderNode;
}
